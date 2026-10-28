import { createDemo } from './app.js';

const demo = createDemo({
    url: process.env.MQTT_URL ?? 'mqtt://test.mosquitto.org:1883',
    prefix: process.env.MQTT_PREFIX
});
demo.server.listen(Number(process.env.PORT ?? 3000), '127.0.0.1', () =>
{
    console.log('Backend: http://localhost:3000 · source=synthetic');
});
for (const signal of ['SIGINT', 'SIGTERM'])
{
    process.on(signal, async () =>
    {
        await demo.close();
        process.exit(0);
    });
}
