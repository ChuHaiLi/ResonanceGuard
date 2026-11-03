import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

for (const [name, compiler, args] of [
    ['firmware motor decisions (native C++, not ESP32 build)', 'g++', ['-std=c++11', 'tests/motor_control.cpp']],
    ['custom chip model (native C with stub Wokwi API)', 'gcc', ['-std=c11', '-Itests/native', 'tests/native/chip_test.c']]
])
{
    test(name, t =>
    {
        if (spawnSync(compiler, ['--version']).error?.code === 'ENOENT')
        {
            t.skip(`${compiler} unavailable; firmware logic NOT verified`);
            return;
        }
        const directory = mkdtempSync(path.join(os.tmpdir(), 'rg-native-'));
        t.after(() => rmSync(directory, { recursive: true, force: true }));
        const executable = path.join(directory, process.platform === 'win32' ? 'test.exe' : 'test');
        const build = spawnSync(compiler, [...args, '-Wall', '-Wextra', '-Werror', '-o', executable], { encoding: 'utf8' });
        assert.equal(build.status, 0, build.stderr || build.error?.message);
        const run = spawnSync(executable, [], { encoding: 'utf8', timeout: 5000 });
        assert.equal(run.status, 0, run.stdout + run.stderr);
        t.diagnostic(run.stdout.trim());
    });
}
