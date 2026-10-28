import test from 'node:test';
import assert from 'node:assert/strict';
import { validPayload } from '../server/protocol.js';
import { latestReading } from '../web/src/freshness.js';
import { ControlSession } from '../web/src/control.js';

const envelope = { schema_version: 1, source: 'synthetic', device_id: 'rg01', boot_id: 'boot', seq: 1, t_device_ms: 100 };
test('payload validation rejects null/array, invalid units, quality, ranges and OFF with PWM', () =>
{
    for (const bad of [null, [], 0, 'data'])
    {
        assert.equal(validPayload('state', bad), false);
    }
    const vibration = { ...envelope, ax: 0, ay: 0, az: 9.80665, unit: 'm/s2', quality: 'wokwi_i2c' };
    assert.equal(validPayload('telemetry/vibration', vibration), true);
    for (const patch of [{ unit: 'g' }, { quality: 'valid' }, { ax: null }, { az: 100 }, { source: 'measured_live' }, { boot_id: '' }])
    {
        assert.equal(validPayload('telemetry/vibration', { ...vibration, ...patch }), false);
    }
    assert.equal(validPayload('telemetry/vibration', { ...vibration, ax: null, ay: null, az: null, quality: 'imu_read_failed' }), true);
    assert.equal(validPayload('state', { ...envelope, running: false, duty: 0.3 }), false);
    assert.equal(validPayload('telemetry/rpm', { ...envelope, rpm: 0, ppr: 1, pulses: 0, quality: 'no_recent_pulses' }), false);
    assert.equal(validPayload('telemetry/rpm', { ...envelope, rpm: null, ppr: 1, pulses: 0, quality: 'no_recent_pulses' }), true);
});

test('frontend STOP/disconnect invalidate late HTTP and ACK; only a fresh START ACK enables renew', () =>
{
    const session = new ControlSession();
    const originalEpoch = session.epoch;
    session.register('start', 'start', false, originalEpoch, 100);
    session.disarm();
    assert.equal(session.register('late-http', 'start', false, originalEpoch, 200), false);
    assert.equal(session.acknowledge({ command_id: 'start', accepted: true, running: true }, true, 200), null);
    assert.equal(session.active, false);
    session.register('renew-off', 'renew', true, session.epoch, 300);
    session.acknowledge({ command_id: 'renew-off', accepted: true, running: true }, true, 400);
    assert.equal(session.active, false);
    session.register('new', 'start', false, session.epoch, 500);
    session.acknowledge({ command_id: 'new', accepted: true, running: true }, true, 600);
    assert.equal(session.active, true);
    session.register('rejected-renew', 'renew', true, session.epoch, 700);
    session.acknowledge({ command_id: 'rejected-renew', accepted: false, running: false }, true, 800);
    assert.equal(session.active, false);
    session.register('stale', 'start', false, session.epoch, 900);
    session.acknowledge({ command_id: 'stale', accepted: true, running: true }, false, 1000);
    assert.equal(session.active, false);
    session.register('timeout', 'start', false, session.epoch, 1100);
    assert.equal(session.acknowledge({ command_id: 'timeout', accepted: true, running: true }, true, 6200), null);
    assert.equal(session.active, false);
});

test('frontend freshness is independent per stream and boot; stale values are not measurements', () =>
{
    const rows = [
        { type: 'telemetry/rpm', received_at: 1000, data: { ...envelope, rpm: 700 } },
        { type: 'telemetry/vibration', received_at: 5500, data: { ...envelope, az: 9.8 } }
    ];
    assert.equal(latestReading(rows, 'telemetry/rpm', 'boot', 6000, true).stale, true);
    assert.equal(latestReading(rows, 'telemetry/vibration', 'boot', 6000, true).stale, false);
    assert.equal(latestReading(rows, 'telemetry/vibration', 'other-boot', 6000, true).data, undefined);
    assert.equal(latestReading(rows, 'telemetry/vibration', 'boot', 6000, false).stale, true);
});
