import test from 'node:test';
import assert from 'node:assert/strict';
import net from 'node:net';
import { once } from 'node:events';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import mqtt from 'mqtt';
import aedes from 'aedes';
import { WebSocket } from 'ws';
import { createDemo } from '../server/app.js';

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
async function eventually(check)
{
    for (let i = 0; i < 100; ++i)
    {
        if (await check())
        {
            return;
        }
        await sleep(30);
    }
    assert.fail('Timed out');
}

async function fixture(t, retained = false)
{
    const broker = aedes();
    const tcp = net.createServer(broker.handle);
    tcp.listen(0, '127.0.0.1');
    await once(tcp, 'listening');
    const url = `mqtt://127.0.0.1:${tcp.address().port}`;
    const directory = await mkdtemp(path.join(os.tmpdir(), 'rg-robust-'));
    const prefix = 'rg-demo/robustness/rg01';
    const esp = mqtt.connect(url, { reconnectPeriod: 0 });
    let demo;
    t.after(async () =>
    {
        await esp.endAsync(true);
        if (demo)
        {
            await demo.close();
        }
        await new Promise(resolve => tcp.close(resolve));
        await new Promise(resolve => broker.close(resolve));
        await rm(directory, { recursive: true, force: true });
    });
    await once(esp, 'connect');
    const envelope = { schema_version: 1, source: 'synthetic', device_id: 'rg01', boot_id: 'boot-A', t_device_ms: 1000 };
    const send = (type, data, options) => esp.publishAsync(`${prefix}/${type}`, JSON.stringify({ ...envelope, ...data }), options);
    if (retained)
    {
        await send('state', { seq: 100, running: true, duty: 0.8 }, { qos: 1, retain: true });
    }
    demo = createDemo({ url, prefix, logDirectory: directory });
    await once(demo.client, 'connect');
    await esp.subscribeAsync(`${prefix}/cmd/motor`);
    demo.server.listen(0, '127.0.0.1');
    await once(demo.server, 'listening');
    const base = `http://127.0.0.1:${demo.server.address().port}`;
    const snapshot = async () => (await fetch(`${base}/api/state`)).json();
    const post = body => fetch(`${base}/api/motor`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
    });
    return { demo, esp, broker, prefix, base, send, snapshot, post };
}

test('retained replay, malformed payloads, ACK boot, stale state/streams, reboot and MQTT recovery', { timeout: 20000 }, async t =>
{
    const f = await fixture(t, true);
    await sleep(100);
    assert.equal((await f.snapshot()).state, null);
    await f.send('state', { seq: 1, running: false, duty: 0 });
    await eventually(async () => (await f.snapshot()).state?.seq === 1);
    for (const data of ['null', '[]', 'true', '{', '"text"', 'x'.repeat(9000)])
    {
        await f.esp.publishAsync(`${f.prefix}/state`, data);
    }
    await f.send('state', { seq: 2, running: false, duty: 0.2 });
    await f.send('telemetry/rpm', { seq: 3, boot_id: 'unknown-boot', rpm: 700, ppr: 1, pulses: 10, quality: 'valid_model_pulses' });
    const received = once(f.esp, 'message');
    const response = await f.post({ action: 'start', duty: 0.3 });
    assert.equal(response.status, 202);
    const [, payload] = await received;
    const command = JSON.parse(payload);
    const ack = { command_id: command.command_id, accepted: true, running: true, reason: 'fixture_only' };
    await f.send('ack', { ...ack, seq: 4, boot_id: 'wrong-boot' });
    await sleep(80);
    assert.equal((await f.snapshot()).last_ack, null);
    await f.send('ack', { ...ack, seq: 5 });
    await eventually(async () => (await f.snapshot()).last_ack?.seq === 5);
    await f.send('telemetry/rpm', { seq: 6, rpm: 700, ppr: 1, pulses: 10, quality: 'valid_model_pulses' });
    await eventually(async () => (await f.snapshot()).history.length === 1);
    await sleep(4100);
    let state = await f.snapshot();
    assert.equal(state.stale, true);
    assert.equal(state.streams['telemetry/rpm'].stale, true);
    assert.equal((await f.post({ action: 'renew', duty: 0.3 })).status, 409);
    assert.equal((await f.post({ action: 'stop' })).status, 202);
    await f.send('state', { seq: 7, t_device_ms: 5100, running: true, duty: 0.3 });
    await f.send('telemetry/vibration', { seq: 8, t_device_ms: 5100, ax: 0, ay: 0, az: 9.80665, unit: 'm/s2', quality: 'wokwi_i2c' });
    await eventually(async () => (await f.snapshot()).history.length === 2);
    state = await f.snapshot();
    assert.equal(state.stale, false);
    assert.equal(state.streams['telemetry/rpm'].stale, true);
    assert.equal(state.streams['telemetry/vibration'].stale, false);
    await f.send('state', { boot_id: 'boot-B', seq: 0, t_device_ms: 100, running: false, duty: 0 });
    await eventually(async () => (await f.snapshot()).state?.boot_id === 'boot-B');
    await f.send('state', { seq: 999, running: true, duty: 0.8 });
    await sleep(80);
    state = await f.snapshot();
    assert.equal(state.state.boot_id, 'boot-B');
    assert.equal(state.history.length, 0);
    assert.equal(state.last_ack, null);
    const disconnected = once(f.demo.client, 'close');
    f.demo.client.stream.destroy();
    await disconnected;
    assert.equal((await f.post({ action: 'start', duty: 0.3 })).status, 503);
    assert.equal((await f.snapshot()).stale, true);
    await once(f.demo.client, 'connect');
    assert.equal((await f.post({ action: 'start', duty: 0.3 })).status, 409);
    await f.send('state', { boot_id: 'boot-B', seq: 1, t_device_ms: 200, running: false, duty: 0 });
    await eventually(async () => !(await f.snapshot()).stale);
    assert.equal((await f.snapshot()).state.running, false);
});

test('HTTP malformed body and WebSocket foreign Origin are rejected', { timeout: 10000 }, async t =>
{
    const f = await fixture(t);
    const response = await fetch(`${f.base}/api/motor`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{'
    });
    assert.equal(response.status, 400);
    const rejected = new WebSocket(f.base.replace('http:', 'ws:') + '/ws', { origin: 'https://example.com' });
    const [error] = await once(rejected, 'error');
    assert.match(error.message, /403/);
});

test('unacknowledged QoS1 commands are discarded when MQTT disconnects', { timeout: 10000 }, async t =>
{
    const f = await fixture(t);
    await f.send('state', { seq: 1, running: false, duty: 0 });
    await eventually(async () => (await f.snapshot()).state !== null);
    let attempts = 0;
    let release;
    f.broker.authorizePublish = (client, packet, callback) =>
    {
        if (packet.topic === `${f.prefix}/cmd/motor`)
        {
            ++attempts;
            release = callback; // Deliberately withhold broker PUBACK.
            return;
        }
        callback(null);
    };
    assert.equal((await f.post({ action: 'start', duty: 0.3 })).status, 202);
    await eventually(() => attempts === 1);
    const disconnected = once(f.demo.client, 'close');
    f.demo.client.stream.destroy();
    await disconnected;
    release(new Error('test connection interrupted'));
    await once(f.demo.client, 'connect');
    await sleep(150);
    assert.equal(attempts, 1, 'START must not replay after reconnect');
    assert.equal((await f.snapshot()).stale, true);
});
