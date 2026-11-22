// Live reload on a real phone over USB (or wireless debugging), without the local network:
//   npm run live:android
// 1. starts the Vite dev server on 127.0.0.1:5173 (IPv4: that is where `adb reverse` connects);
// 2. `cap run --live-reload --forwardPorts` builds a debug app whose WebView loads http://localhost:5173
//    and runs `adb reverse`, so the phone's localhost:5173 is the PC's dev server through the cable.
// Every saved change then reloads on the phone in about a second. Ctrl+C stops everything.
// The live-reload URL is set through the CLI, so capacitor.config.json never holds a server.url.
import { execFileSync, spawn } from 'node:child_process';
import { join } from 'node:path';

const PORT = 5173;
const root = process.cwd();
const isWindows = process.platform === 'win32';
const adb = join(process.env.ANDROID_HOME ?? 'D:\\Android\\Sdk', 'platform-tools', isWindows ? 'adb.exe' : 'adb');

const devices = execFileSync(adb, ['devices'], { encoding: 'utf8' })
  .split(/\r?\n/)
  .slice(1)
  .filter((line) => /\tdevice$/.test(line))
  .map((line) => line.split('\t')[0]);
if (devices.length !== 1) {
  throw new Error(
    `Live reload needs exactly one device in "adb devices" (USB debugging on, or "adb pair" + "adb connect"), found ${devices.length}: ${JSON.stringify(devices)}`,
  );
}
const target = devices[0];

const dev = spawn('npx', ['vite', '--host', '127.0.0.1', '--port', String(PORT), '--strictPort'], {
  cwd: root,
  stdio: 'inherit',
  shell: true,
});

/** Stops the dev server and its children; with shell:true a plain kill would only end the shell. */
function stopDev() {
  if (dev.exitCode !== null) return;
  if (isWindows) execFileSync('taskkill', ['/pid', String(dev.pid), '/T', '/F'], { stdio: 'ignore' });
  else dev.kill('SIGTERM');
}

dev.on('exit', (code) => {
  if (code !== 0 && code !== null) {
    console.error(`[live] dev server exited with code ${code} (is port ${PORT} already in use?)`);
    process.exit(1);
  }
});
process.on('SIGINT', () => {
  stopDev();
  process.exit(0);
});

try {
  execFileSync(
    'npx',
    [
      'cap', 'run', 'android',
      '--target', target,
      '--live-reload', '--host', 'localhost', '--port', String(PORT),
      '--forwardPorts', `${PORT}:${PORT}`,
    ],
    {
      cwd: root,
      stdio: 'inherit',
      shell: true,
      // Windows with NoDefaultCurrentDirectoryInExePath=1 does not run ./gradlew from the current folder;
      // Capacitor calls it by bare name, so the android folder goes on PATH for this command only.
      env: { ...process.env, PATH: `${join(root, 'android')}${isWindows ? ';' : ':'}${process.env.PATH ?? ''}` },
    },
  );
} finally {
  stopDev();
}
