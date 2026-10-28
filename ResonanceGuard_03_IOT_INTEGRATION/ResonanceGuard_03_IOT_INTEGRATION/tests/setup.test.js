import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, copyFileSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';

test('setup creates matching config, preserves valid quoted env and rejects unsupported settings without overwriting', t =>
{
    const directory = mkdtempSync(path.join(os.tmpdir(), 'rg-setup-'));
    t.after(() => rmSync(directory, { recursive: true, force: true }));
    mkdirSync(path.join(directory, 'firmware'));
    copyFileSync('setup.mjs', path.join(directory, 'setup.mjs'));
    const run = () => spawnSync(process.execPath, [path.join(directory, 'setup.mjs')], { encoding: 'utf8' });
    assert.equal(run().status, 0);
    const generated = readFileSync(path.join(directory, '.env'), 'utf8');
    const prefix = generated.match(/MQTT_PREFIX=(.+)/)[1];
    assert.ok(readFileSync(path.join(directory, 'firmware/config.h'), 'utf8').includes(JSON.stringify(prefix)));
    const quoted = '# preserve this comment\nMQTT_URL="mqtt://127.0.0.1:1884"\nMQTT_PREFIX="rg-demo/my-team/rg01" # topic\nPORT=3000\n';
    writeFileSync(path.join(directory, '.env'), quoted);
    assert.equal(run().status, 0);
    assert.equal(readFileSync(path.join(directory, '.env'), 'utf8'), quoted);
    const config = readFileSync(path.join(directory, 'firmware/config.h'), 'utf8');
    assert.match(config, /BROKER_PORT = 1884/);
    for (const invalid of [
        'MQTT_URL=mqtt://user:demo-secret@localhost:1883\nMQTT_PREFIX=rg-demo/team/rg01\n',
        'MQTT_URL=mqtts://localhost:8883\nMQTT_PREFIX=rg-demo/team/rg01\n',
        'MQTT_URL=mqtt://localhost:1883\nMQTT_PREFIX=rg-demo/team/+/rg01\n',
        'MQTT_URL=invalid\nMQTT_PREFIX=rg-demo/team/rg01\n'
    ])
    {
        writeFileSync(path.join(directory, '.env'), invalid);
        const result = run();
        assert.notEqual(result.status, 0);
        assert.doesNotMatch(result.stdout + result.stderr, /demo-secret/);
        assert.equal(readFileSync(path.join(directory, '.env'), 'utf8'), invalid);
        assert.equal(readFileSync(path.join(directory, 'firmware/config.h'), 'utf8'), config);
    }
});
