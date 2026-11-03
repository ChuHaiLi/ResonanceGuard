import net from 'node:net';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { randomUUID } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import mqtt from 'mqtt';
import aedes from 'aedes';
import { WebSocket } from 'ws';

process.chdir(fileURLToPath(new URL('..', import.meta.url)));
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
async function eventually(check)
{
    for (let i = 0; i < 100; ++i)
    {
        try
        {
            if (await check())
            {
                return;
            }
        }
        catch
        {
            // A child process may still be starting.
        }
        await sleep(100);
    }
    throw new Error('Smoke check timed out');
}

// Never replace a user's existing server on the normal development ports.
for (const port of [3000, 5173])
{
    const probe = net.createServer();
    probe.listen(port, '127.0.0.1');
    await once(probe, 'listening');
    await new Promise(resolve => probe.close(resolve));
}
const broker = aedes();
const tcp = net.createServer(broker.handle);
tcp.listen(0, '127.0.0.1');
await once(tcp, 'listening');
const url = `mqtt://127.0.0.1:${tcp.address().port}`;
const directory = await mkdtemp(path.join(os.tmpdir(), 'rg-smoke-'));
const prefix = `rg-demo/smoke-${randomUUID()}/rg01`;
const children = [];
let peer;
let socket;
function launch(args, env = {})
{
    const child = spawn(process.execPath, args, {
        env: { ...process.env, ...env }, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true
    });
    child.stdout.on('data', () =>
    {
        // Keep child output drained; only the probe's verified results are printed.
    });
    child.stderr.on('data', bytes => process.stderr.write(bytes));
    children.push(child);
    return child;
}
try
{
    launch(['server/index.js'], { MQTT_URL: url, MQTT_PREFIX: prefix, PORT: '3000', DATA_DIR: directory });
    launch(['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--strictPort', '--config', 'web/vite.config.js']);
    await eventually(async () => (await (await fetch('http://127.0.0.1:3000/api/state')).json()).broker_connected);
    await eventually(async () => (await fetch('http://127.0.0.1:5173')).ok);
    const built = await (await fetch('http://127.0.0.1:3000')).text();
    const asset = built.match(/src="([^\"]+\.js)"/)?.[1];
    assert.ok(asset, 'built React entry point');
    assert.equal((await fetch(`http://127.0.0.1:3000${asset}`)).status, 200);
    assert.match(await (await fetch('http://127.0.0.1:5173')).text(), /@vite\/client/);
    console.log('PASS: real server/index.js process serves production React assets; real Vite serves frontend');

    peer = mqtt.connect(url, { reconnectPeriod: 0 });
    await once(peer, 'connect');
    await peer.subscribeAsync(`${prefix}/cmd/motor`);
    socket = new WebSocket('ws://127.0.0.1:5173/ws', { origin: 'http://127.0.0.1:5173' });
    const events = [];
    socket.on('message', bytes => events.push(JSON.parse(bytes)));
    await once(socket, 'open');
    let seq = 0;
    const envelope = { schema_version: 1, device_id: 'rg01', boot_id: 'smoke-fixture-not-esp32', source: 'synthetic', t_device_ms: 1000 };
    const send = (type, data) => peer.publishAsync(`${prefix}/${type}`, JSON.stringify({ ...envelope, seq: seq++, ...data }), {
        qos: type === 'ack' ? 1 : 0, retain: false
    });
    await send('state', { running: false, duty: 0 });
    await send('telemetry/vibration', { ax: 0, ay: 0, az: 9.80665, unit: 'm/s2', quality: 'wokwi_i2c' });
    await send('telemetry/rpm', { rpm: 700, ppr: 1, pulses: 10, quality: 'valid_model_pulses' });
    await eventually(() => events.some(row => row.type === 'telemetry/rpm'));
    const state = await (await fetch('http://127.0.0.1:5173/api/state')).json();
    assert.equal(state.history.length, 2);
    console.log('PASS: local MQTT fixture → real backend → Vite HTTP/WS proxy, acceleration and RPM');
    for (const action of ['start', 'set_duty', 'renew', 'stop'])
    {
        const commandEvent = once(peer, 'message');
        const response = await fetch('http://127.0.0.1:5173/api/motor', {
            method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'http://127.0.0.1:5173' },
            body: JSON.stringify({ action, duty: 0.6 })
        });
        assert.equal(response.status, 202);
        const [, payload] = await commandEvent;
        const command = JSON.parse(payload);
        assert.equal(command.action, action);
        await send('ack', { command_id: command.command_id, accepted: true, running: action !== 'stop', reason: 'synthetic_test_peer_only' });
        await eventually(() => events.some(row => row.type === 'ack' && row.data.command_id === command.command_id));
    }
    console.log('PASS: HTTP START/PWM/renew/STOP → MQTT → synthetic peer ACK → WS');
    console.log('LIMIT: no browser rendering/clicks, ESP32, MPU6050, encoder GPIO or Wokwi was tested by this script');
}
finally
{
    socket?.terminate();
    if (peer)
    {
        await peer.endAsync(true);
    }
    for (const child of children)
    {
        if (child.exitCode === null && child.signalCode === null)
        {
            const closed = once(child, 'close');
            child.kill();
            await closed;
        }
    }
    await new Promise(resolve => tcp.close(resolve));
    await new Promise(resolve => broker.close(resolve));
    await rm(directory, { recursive: true, force: true });
}
