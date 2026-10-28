import express from 'express';
import mqtt from 'mqtt';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { mkdirSync, createWriteStream } from 'node:fs';
import { STALE_MS, validPayload } from './protocol.js';

export function createDemo({ url, prefix, logDirectory = 'data' })
{
    if (!prefix || /[+#]/.test(prefix) || prefix.includes('CHANGE_THIS'))
    {
        throw new Error('Set a unique MQTT_PREFIX in .env first.');
    }
    const app = express();
    const server = createServer(app);
    const allowedOrigin = origin => !origin || /^http:\/\/(localhost|127\.0\.0\.1):(3000|5173)$/.test(origin);
    const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 4096,
        verifyClient: (info, done) => done(allowedOrigin(info.origin), 403, 'Origin rejected') });
    const client = mqtt.connect(url, {
        clientId: `rg-be-${randomUUID()}`, reconnectPeriod: 2000,
        clean: true, queueQoSZero: false, connectTimeout: 10000
    });
    mkdirSync(logDirectory, { recursive: true });
    const log = createWriteStream(`${logDirectory}/telemetry-${Date.now()}.jsonl`, { flags: 'a' });
    log.on('error', (error) => console.error('LOG ERROR', error.message));
    let state = null;
    let stateAt = 0;
    let lastAck = null;
    let history = [];
    let accepted = new Map();
    const pending = new Map();
    const inflight = new Set();
    const retiredBoots = new Set();
    let streams = {};
    const snapshot = () => ({
        broker_connected: client.connected, prefix,
        state, state_age_ms: stateAt ? Date.now() - stateAt : null,
        stale: !client.connected || !stateAt || Date.now() - stateAt > STALE_MS,
        last_ack: lastAck, history,
        streams: Object.fromEntries(Object.entries(streams).map(([type, row]) => [type, {
            age_ms: Date.now() - row.received_at,
            stale: !client.connected || Date.now() - row.received_at > STALE_MS
        }]))
    });
    const broadcast = (event) =>
    {
        const text = JSON.stringify(event);
        for (const socket of wss.clients)
        {
            if (socket.readyState === WebSocket.OPEN && socket.bufferedAmount < 100000)
            {
                socket.send(text);
            }
        }
    };
    client.on('connect', () =>
    {
        console.log('MQTT connected · source=synthetic');
        client.subscribe(['state', 'telemetry/vibration', 'telemetry/rpm', 'ack'].map(s => `${prefix}/${s}`), { qos: 1 });
        broadcast({ type: 'snapshot', data: snapshot() });
    });
    client.on('error', (error) => console.error('MQTT:', error.message));
    const discardCommands = () =>
    {
        for (const messageId of inflight)
        {
            client.removeOutgoingMessage(messageId);
        }
        inflight.clear();
        pending.clear();
    };
    const invalidate = () =>
    {
        stateAt = 0;
        discardCommands();
        broadcast({ type: 'snapshot', data: snapshot() });
    };
    client.on('close', invalidate);
    client.on('packetsend', packet =>
    {
        if (packet.cmd === 'publish' && packet.topic === `${prefix}/cmd/motor`)
        {
            inflight.add(packet.messageId);
        }
    });
    client.on('packetreceive', packet =>
    {
        if (packet.cmd === 'puback')
        {
            inflight.delete(packet.messageId);
        }
    });
    client.on('message', (topic, bytes, packet) =>
    {
        if (bytes.length > 8192 || packet.retain)
        {
            return;
        }
        let data;
        try
        {
            data = JSON.parse(bytes.toString());
        }
        catch
        {
            return;
        }
        const type = topic.slice(prefix.length + 1);
        if (!validPayload(type, data) || retiredBoots.has(data.boot_id))
        {
            return;
        }
        if (type !== 'state' && data.boot_id !== state?.boot_id)
        {
            return;
        }
        const record = type === 'ack' ? pending.get(data.command_id) : null;
        if (type === 'ack' && (!record || record.boot_id !== data.boot_id || Date.now() - record.created_at > 5000))
        {
            return;
        }
        if (type === 'state' && state && data.boot_id !== state.boot_id)
        {
            retiredBoots.add(state.boot_id);
            if (retiredBoots.size > 32)
            {
                retiredBoots.delete(retiredBoots.values().next().value);
            }
            history = [];
            streams = {};
            lastAck = null;
            discardCommands();
        }
        const key = `${type}/${data.boot_id}`;
        const previous = accepted.get(key);
        if (previous && (data.seq <= previous.seq || ((data.t_device_ms - previous.time) | 0) < 0))
        {
            return;
        }
        accepted.set(key, { seq: data.seq, time: data.t_device_ms });
        if (accepted.size > 64)
        {
            accepted.delete(accepted.keys().next().value);
        }
        const event = { type, data, received_at: Date.now() };
        if (type === 'state')
        {
            state = data;
            stateAt = Date.now();
        }
        if (type === 'ack')
        {
            lastAck = data;
            pending.delete(data.command_id);
        }
        if (type.startsWith('telemetry/'))
        {
            streams[type] = event;
            history.push(event);
            history = history.slice(-240);
        }
        if (log.writableLength < 1000000)
        {
            log.write(JSON.stringify(event) + '\n');
        }
        broadcast(event);
    });
    wss.on('connection', socket => socket.send(JSON.stringify({ type: 'snapshot', data: snapshot() })));
    app.use((req, res, next) =>
    {
        const origin = req.get('origin');
        if (!allowedOrigin(origin))
        {
            return res.status(403).json({ error: 'Origin rejected' });
        }
        next();
    });
    app.use(express.json({ limit: '4kb' }));
    app.get('/api/state', (req, res) => res.json(snapshot()));
    app.post('/api/motor', (req, res) =>
    {
        const { action, duty } = req.body ?? {};
        if (!['start', 'stop', 'renew', 'set_duty'].includes(action) ||
            (action !== 'stop' && (!Number.isFinite(duty) || duty < 0 || duty > 0.8)))
        {
            return res.status(400).json({ error: 'Invalid action or duty (0..0.8)' });
        }
        if (!client.connected)
        {
            return res.status(503).json({ error: 'Broker offline' });
        }
        if (action !== 'stop' && (!stateAt || Date.now() - stateAt > STALE_MS))
        {
            return res.status(409).json({ error: 'Device state missing or stale' });
        }
        const command = {
            schema_version: 1, device_id: 'rg01', source: 'synthetic',
            boot_id: state?.boot_id ?? '', command_id: randomUUID(),
            action, duty: action === 'stop' ? 0 : duty,
            lease_ms: 4000,
            not_after_device_ms: ((state?.t_device_ms ?? 0) + 3000) >>> 0
        };
        pending.set(command.command_id, { boot_id: command.boot_id, created_at: Date.now() });
        while (pending.size > 100)
        {
            pending.delete(pending.keys().next().value);
        }
        client.publish(`${prefix}/cmd/motor`, JSON.stringify(command), { qos: 1, retain: false }, error =>
        {
            if (error)
            {
                console.error('Publish failed/discarded:', error.message);
            }
        });
        console.log('COMMAND', command.action, command.command_id);
        res.status(202).json({ status: 'sent_waiting_for_device_ack', command_id: command.command_id });
    });
    app.use(express.static('dist'));
    app.use((error, req, res, next) => res.status(400).json({ error: error.message }));
    return {
        server, client,
        async close()
        {
            for (const socket of wss.clients)
            {
                socket.terminate();
            }
            wss.close();
            await client.endAsync(true);
            await new Promise(resolve => log.end(resolve));
            await new Promise(resolve => server.close(resolve));
        }
    };
}
