// Builds the Android debug APK: web build -> Capacitor copy -> Gradle -> release/ronda-debug.apk.
//   npm run apk                 build
//   npm run apk -- --install    build and install on the connected phone (USB or wireless debugging)
//   npm run apk -- --sync       also update native plugins (only after adding or upgrading a Capacitor plugin)
// Gradle 9.1 (android/gradle/wrapper) runs on the JDK 25 bundled with Android Studio (JAVA_HOME).
// The Gradle daemon stays alive between builds for speed; stop it with D:\Android\stop-android-dev.ps1.
import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const args = new Set(process.argv.slice(2));
const unknown = [...args].filter((a) => !['--install', '--sync'].includes(a));
if (unknown.length > 0) throw new Error(`Unknown option(s): ${unknown.join(', ')}. Use --install and/or --sync.`);

const root = process.cwd();
const adb = join(process.env.ANDROID_HOME ?? 'D:\\Android\\Sdk', 'platform-tools', 'adb.exe');
const run = (command, argv, cwd = root) => execFileSync(command, argv, { cwd, stdio: 'inherit', shell: true });

function step(label, action) {
  const started = performance.now();
  action();
  console.log(`[apk] ${label}: ${((performance.now() - started) / 1000).toFixed(1)} s`);
}

function singleDevice() {
  const lines = execFileSync(adb, ['devices'], { encoding: 'utf8' })
    .split(/\r?\n/)
    .slice(1)
    .filter((line) => /\tdevice$/.test(line));
  if (lines.length !== 1) {
    throw new Error(`--install needs exactly one device in "adb devices", found ${lines.length}: ${JSON.stringify(lines)}`);
  }
  return lines[0].split('\t')[0];
}

step('vite build', () => run('npx', ['vite', 'build']));
step(args.has('--sync') ? 'cap sync' : 'cap copy', () => run('npx', ['cap', args.has('--sync') ? 'sync' : 'copy', 'android']));
step('gradle assembleDebug', () =>
  run(join(root, 'android', process.platform === 'win32' ? 'gradlew.bat' : 'gradlew'), ['assembleDebug'], join(root, 'android')),
);

const source = join(root, 'android', 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
mkdirSync(join(root, 'release'), { recursive: true });
const target = join(root, 'release', 'ronda-debug.apk');
copyFileSync(source, target);
console.log(`[apk] ready: ${target} (${(statSync(target).size / 1024 / 1024).toFixed(1)} MB)`);

if (args.has('--install')) {
  const device = singleDevice();
  step(`install on ${device}`, () => run(adb, ['-s', device, 'install', '-r', target]));
}
