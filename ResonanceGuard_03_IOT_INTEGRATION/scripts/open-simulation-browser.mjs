// Windows simulation launcher. No device commands or runtime secrets are read.
// Separate profile: an existing Chrome process would otherwise ignore these flags.
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

if (process.platform !== 'win32')
{
    throw new Error('This launcher currently supports Windows Chrome only.');
}
const project = fileURLToPath(new URL('..', import.meta.url));
const options = process.argv.slice(2);
const dryRun = options.includes('--dry-run');
const recordIndex = options.indexOf('--record');
const recordFile = recordIndex >= 0 ? options[recordIndex + 1] : null;
if (recordIndex >= 0 && !recordFile)
{
    throw new Error('--record needs a destination JSON file.');
}
const candidates = [
    process.env.ProgramFiles && path.join(process.env.ProgramFiles, 'Google/Chrome/Application/chrome.exe'),
    process.env['ProgramFiles(x86)'] && path.join(process.env['ProgramFiles(x86)'], 'Google/Chrome/Application/chrome.exe'),
    process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Google/Chrome/Application/chrome.exe')
].filter(Boolean);
const chrome = candidates.find(candidate => existsSync(candidate));
if (!chrome)
{
    throw new Error('Chrome was not found. Nothing was downloaded or installed.');
}
let destination = null;
if (recordFile)
{
    destination = path.resolve(project, recordFile);
    const evidenceRoot = path.join(project, 'docs/evidence') + path.sep;
    if (!destination.startsWith(evidenceRoot) || existsSync(destination))
    {
        throw new Error('Record must be a new file under this project docs/evidence.');
    }
}
const switches = [
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding',
    '--no-first-run',
    '--no-default-browser-check'
];
const windows = [
    { role: 'wokwi', url: 'https://wokwi.com/projects/479040461413244929', size: '1100,940', position: '0,0' },
    { role: 'dashboard', url: 'http://localhost:3000', size: '820,940', position: '1100,0' }
];
if (dryRun)
{
    console.log(JSON.stringify({ chrome_found: true, switches, windows,
        profile: 'new temporary isolated profile', launches: 0, motor_commands: 0 }, null, 2));
}
else
{
    const profile = mkdtempSync(path.join(os.tmpdir(), 'rg-wokwi-chrome-'));
    const processes = [];
    for (const window of windows)
    {
        const args = [...switches, `--user-data-dir=${profile}`, '--new-window',
            `--window-size=${window.size}`, `--window-position=${window.position}`, window.url];
        const child = spawn(chrome, args, { detached: true, windowsHide: false, stdio: 'ignore' });
        await once(child, 'spawn');
        processes.push({ role: window.role, launch_pid: child.pid });
        child.unref();
        if (window.role === 'wokwi')
        {
            await new Promise(resolve => setTimeout(resolve, 1500));
        }
    }
    const record = { launched_at: new Date().toISOString(), profile_directory: profile,
        chrome, switches, windows, processes, motor_commands: 0,
        scope: 'Scheduling mitigation, not a verified network fix. No old Chrome process stopped; simulator not auto-started.' };
    writeFileSync(destination ?? path.join(profile, 'resonanceguard-launch.json'),
        JSON.stringify(record, null, 2) + '\n', { flag: 'wx' });
    console.log('Opened isolated Wokwi and Dashboard windows. No simulation or motor command was started.');
    console.log('Stop the simulation in the OLD Wokwi window before starting the NEW one; use only the new Dashboard.');
    console.log('Closing these two new windows ends this browser session; your normal Chrome profile is unchanged.');
}
