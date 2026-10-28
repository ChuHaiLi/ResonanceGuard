import test from 'node:test';
import assert from 'node:assert/strict';
import net from 'node:net';
import { mkdtemp, rm, readdir, readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import mqtt from 'mqtt';
import aedes from 'aedes';
import { WebSocket } from 'ws';
import { once } from 'node:events';
import { createDemo } from '../server/app.js';

async function eventually(check)
{
    for (let i = 0; i < 60; ++i)
    {
        if (await check())
        {
            return;
        }
        await new Promise(resolve => setTimeout(resolve, 30));
    }
    throw new Error('Timed out waiting for event');
}

test('MQTT → backend → REST/WS and web command → MQTT → ACK', { timeout: 15000 }, async t =>
{
    const broker = aedes();
    const tcp = net.createServer(broker.handle);
    tcp.listen(0, '127.0.0.1');
    await once(tcp, 'listening');
    const url = `mqtt://127.0.0.1:${tcp.address().port}`;
    const directory = await mkdtemp(path.join(os.tmpdir(), 'rg-test-'));
    const prefix = 'rg-test/unique/rg01';
    const demo = createDemo({ url, prefix, logDirectory: directory });
    const esp = mqtt.connect(url, { clientId: 'test-esp' });
    let ws;
    t.after(async () =>
    {
        ws?.terminate();
        await esp.endAsync(true);
        await demo.close();
        await new Promise(resolve => tcp.close(resolve));
        await new Promise(resolve => broker.close(resolve));
        await rm(directory, { recursive: true, force: true });
    });
    await Promise.all([once(esp, 'connect'), once(demo.client, 'connect')]);
    await esp.subscribeAsync(`${prefix}/cmd/motor`);
    demo.server.listen(0, '127.0.0.1');
    await once(demo.server, 'listening');
    const base = `http://127.0.0.1:${demo.server.address().port}`;
    ws = new WebSocket(base.replace('http:', 'ws:') + '/ws');
    const messages = [];
    ws.on('message', text => messages.push(JSON.parse(text)));
    await once(ws, 'open');
    const post = body => fetch(`${base}/api/motor`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
    });
    assert.equal((await post({ action: 'start', duty: 0.3 })).status, 409);
    const envelope = { schema_version: 1, source: 'synthetic', device_id: 'rg01', boot_id: 'boot-test', t_device_ms: 1000 };
    const send = (type, data, options) => esp.publishAsync(`${prefix}/${type}`, JSON.stringify({ ...envelope, ...data }), options);
    await send('state', { seq: 1, running: false, duty: 0 });
    await eventually(async () => (await (await fetch(`${base}/api/state`)).json()).state !== null);
    await send('telemetry/vibration', { seq: 2, ax: 0, ay: 0, az: 9.80665, unit: 'm/s2', quality: 'wokwi_i2c' });
    await send('telemetry/rpm', { seq: 3, rpm: 700, ppr: 1, pulses: 10, quality: 'valid_model_pulses' });
    await eventually(() => messages.some(row => row.type === 'telemetry/rpm'));
    assert.equal((await post({ action: 'start', duty: 1 })).status, 400);
    const commandPromise = once(esp, 'message');
    const response = await post({ action: 'start', duty: 0.3 });
    assert.equal(response.status, 202);
    const requested = await response.json();
    const [topic, payload, packet] = await commandPromise;
    const command = JSON.parse(payload);
    assert.equal(topic, `${prefix}/cmd/motor`);
    assert.equal(command.command_id, requested.command_id);
    assert.equal(command.boot_id, 'boot-test');
    assert.equal(command.duty, 0.3);
    assert.equal(packet.retain, false);
    await send('ack', { seq: 4, command_id: command.command_id, accepted: true, reason: 'test_ack', running: true });
    await eventually(() => messages.some(row => row.type === 'ack'));
    await send('state', { seq: 5, running: true, duty: 0.3 });
    await send('state', { seq: 4, running: false, duty: 0 });
    await send('state', { seq: 6, running: false, duty: 0, source: 'measured_live' });
    await send('telemetry/rpm', { seq: 3, rpm: 700 });
    await send('telemetry/rpm', { seq: 7, rpm: 'invalid' });
    await eventually(async () => (await (await fetch(`${base}/api/state`)).json()).state.seq === 5);
    const snapshot = await (await fetch(`${base}/api/state`)).json();
    assert.equal(snapshot.state.running, true);
    assert.equal(snapshot.history.length, 2);
    assert.equal(snapshot.last_ack.command_id, command.command_id);
    assert.equal((await fetch(`${base}/api/motor`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://example.com' },
        body: JSON.stringify({ action: 'stop' })
    })).status, 403);
    await eventually(async () =>
    {
        const [file] = await readdir(directory);
        const rows = (await readFile(path.join(directory, file), 'utf8')).trim().split('\n').map(JSON.parse);
        assert.ok(rows.every(row => row.data.source === 'synthetic'));
        return rows.length === 5;
    });
});
