export const STALE_MS = 4000;

export function validEnvelope(data)
{
    return data !== null && typeof data === 'object' && !Array.isArray(data) &&
        data.schema_version === 1 && data.device_id === 'rg01' && data.source === 'synthetic' &&
        typeof data.boot_id === 'string' && data.boot_id.length > 0 && data.boot_id.length <= 64 &&
        Number.isSafeInteger(data.seq) && data.seq >= 0 &&
        Number.isSafeInteger(data.t_device_ms) && data.t_device_ms >= 0 && data.t_device_ms <= 0xffffffff;
}

export function validPayload(type, data)
{
    if (!validEnvelope(data))
    {
        return false;
    }
    if (type === 'state')
    {
        return typeof data.running === 'boolean' && Number.isFinite(data.duty) &&
            data.duty >= 0 && data.duty <= 0.8 && (data.running || data.duty === 0);
    }
    if (type === 'telemetry/vibration')
    {
        const values = [data.ax, data.ay, data.az];
        return data.unit === 'm/s2' &&
            ((data.quality === 'wokwi_i2c' && values.every(value => Number.isFinite(value) && Math.abs(value) <= 4 * 9.80665)) ||
            (data.quality === 'imu_read_failed' && values.every(value => value === null)));
    }
    if (type === 'telemetry/rpm')
    {
        return data.ppr === 1 && Number.isSafeInteger(data.pulses) && data.pulses >= 0 &&
            ((data.quality === 'valid_model_pulses' && Number.isFinite(data.rpm) && data.rpm > 0 && data.rpm <= 10000) ||
            (data.quality === 'no_recent_pulses' && data.rpm === null));
    }
    if (type === 'ack')
    {
        return typeof data.command_id === 'string' && data.command_id.length > 0 && data.command_id.length <= 64 &&
            typeof data.accepted === 'boolean' && typeof data.running === 'boolean' &&
            typeof data.reason === 'string' && data.reason.length > 0 && data.reason.length <= 100;
    }
    return false;
}
