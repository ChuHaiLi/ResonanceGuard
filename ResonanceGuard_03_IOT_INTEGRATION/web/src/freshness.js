export function latestReading(rows, type, bootId, now, connected)
{
    const row = rows.filter(item => item.type === type && item.data.boot_id === bootId).at(-1);
    const age = row ? now - row.received_at : null;
    return { data: row?.data, age_ms: age, stale: !connected || age === null || age > 4000 || age < -1000 };
}
