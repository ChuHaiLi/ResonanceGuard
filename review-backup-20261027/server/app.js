import express from 'express';
import mqtt from 'mqtt';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { mkdirSync, createWriteStream } from 'node:fs';

export function createDemo({ url, prefix, logDirectory = 'data' })
{
    if (!prefix || /[+#]/.test(prefix) || prefix.includes('CHANGE_THIS'))
    {
        throw new Error('Set a unique MQTT_PREFIX in .env first.');
    }
    const app = express();
    const server = createServer(app);
    const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 4096 });
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
    const snapshot = () => ({
        broker_connected: client.connected, prefix,
        state, state_age_ms: stateAt ? Date.now() - stateAt : null,
        stale: !stateAt || Date.now() - stateAt > 4000,
        last_ack: lastAck, history
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
        console.log(`MQTT connected: ${prefix}`);
        client.subscribe(['state', 'telemetry/vibration', 'telemetry/rpm', 'ack'].map(s => `${prefix}/${s}`), { qos: 1 });
        broadcast({ type: 'snapshot', data: snapshot() });
    });
    client.on('error', (error) => console.error('MQTT:', error.message));
    client.on('offline', () => broadcast({ type: 'snapshot', data: snapshot() }));
    client.on('message', (topic, bytes, packet) =>
    {
        if (bytes.length > 8192 || packet.retain)
        {
            return;
        }
        let data;
        try { data = JSON.parse(bytes.toString()); }
        catch { return; }
        const type = topic.slice(prefix.length + 1);
        if (data.schema_version !== 1 || data.device_id !== 'rg01' ||
            data.source !== 'synthetic' || typeof data.boot_id !== 'string' ||
            data.boot_id.length > 64 || !Number.isSafeInteger(data.seq) || data.seq < 0 ||
            !Number.isSafeInteger(data.t_device_ms) || data.t_device_ms < 0)
        {
            return;
        }
        if (!['state', 'telemetry/vibration', 'telemetry/rpm', 'ack'].includes(type))
        {
            return;
        }
        if (type === 'state' && (typeof data.running !== 'boolean' ||
            !Number.isFinite(data.duty) || data.duty < 0 || data.duty > 0.8))
        {
            return;
        }
        if (type === 'telemetry/vibration' &&
            !(data.ax === null && data.ay === null && data.az === null) &&
            ![data.ax, data.ay, data.az].every(Number.isFinite))
        {
            return;
        }
        if (type === 'telemetry/rpm' && data.rpm !== null &&
            (!Number.isFinite(data.rpm) || data.rpm < 0 || data.rpm > 10000))
        {
            return;
        }
        if (type === 'ack' && (typeof data.command_id !== 'string' ||
            typeof data.accepted !== 'boolean' || !pending.has(data.command_id)))
        {
            return;
        }
        const key = `${type}/${data.boot_id}`;
        if (data.seq <= (accepted.get(key) ?? -1))
        {
            return;
        }
        accepted.set(key, data.seq);
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
        if (origin && !/^http:\/\/(localhost|127\.0\.0\.1):(3000|5173)$/.test(origin))
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
        if (action !== 'stop' && (!stateAt || Date.now() - stateAt > 4000))
        {
            return res.status(409).json({ error: 'Device state missing or stale' });
        }
        const command = {
            schema_version: 1, device_id: 'rg01', source: 'synthetic',
            boot_id: state?.boot_id ?? '', command_id: randomUUID(),
            action, duty: action === 'stop' ? 0 : duty,
            lease_ms: 4000,
            not_after_device_ms: (state?.t_device_ms ?? 0) + 3000
        };
        pending.set(command.command_id, Date.now());
        while (pending.size > 100)
        {
            pending.delete(pending.keys().next().value);
        }
        client.publish(`${prefix}/cmd/motor`, JSON.stringify(command), { qos: 1, retain: false }, error =>
        {
            if (error) console.error('Publish failed:', error.message);
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
            for (const socket of wss.clients) socket.terminate();
            wss.close();
            await client.endAsync(true);
            log.end();
            await new Promise(resolve => server.close(resolve));
        }
    };
}
