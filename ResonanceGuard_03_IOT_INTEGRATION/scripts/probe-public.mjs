import mqtt from 'mqtt';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';

// Separate diagnostic topic; never publish motor commands in this probe.
const topic = `rg-demo/diagnostic-${randomUUID()}/rg01/diagnostic`;
const clients = [];
const signal = AbortSignal.timeout(15000);
const timeout = setTimeout(() =>
{
    for (const client of clients)
    {
        client.end(true);
    }
}, 15000);
try
{
    const receiver = mqtt.connect(process.env.MQTT_URL ?? 'mqtt://broker.hivemq.com:1883', {
        reconnectPeriod: 0, connectTimeout: 10000
    });
    clients.push(receiver);
    await once(receiver, 'connect', { signal });
    await receiver.subscribeAsync(topic, { qos: 1 });
    const sender = mqtt.connect(process.env.MQTT_URL ?? 'mqtt://broker.hivemq.com:1883', {
        reconnectPeriod: 0, connectTimeout: 10000
    });
    clients.push(sender);
    await once(sender, 'connect', { signal });
    const incoming = once(receiver, 'message', { signal });
    const payload = JSON.stringify({ source: 'synthetic', probe: randomUUID() });
    await sender.publishAsync(topic, payload, { qos: 1, retain: false });
    const [, bytes, packet] = await incoming;
    if (bytes.toString() !== payload || packet.retain)
    {
        throw new Error('Public broker roundtrip mismatch');
    }
    console.log('PASS: public broker TCP/MQTT subscribe/publish roundtrip using two Node clients, QoS1, non-retained, source=synthetic');
    console.log('LIMIT: this does not verify Wokwi Gateway or ESP32 connectivity');
}
catch (error)
{
    console.error(`FAIL: public broker probe: ${error.code ?? error.message}`);
    process.exitCode = 1;
}
finally
{
    clearTimeout(timeout);
    await Promise.all(clients.map(client => client.endAsync(true)));
}
