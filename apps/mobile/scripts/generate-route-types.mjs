// Expo writes the typed-route declarations (`.expo/types/router.d.ts`) only while its dev server
// runs, and `expo export` does not. CI uses this to get the same declarations the editor has, so
// `tsc` rejects a link to a route that does not exist. It starts the server offline, waits for the
// file, and stops the server.
import { spawn } from 'node:child_process';
import console from 'node:console';
import { existsSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import process from 'node:process';
import { setTimeout as sleep } from 'node:timers/promises';
import { fileURLToPath, URL } from 'node:url';

const target = new URL('../.expo/types/router.d.ts', import.meta.url);
const expoCli = createRequire(import.meta.url).resolve('expo/bin/cli');
const timeoutMs = 120_000;

rmSync(target, { force: true });

const server = spawn(process.execPath, [expoCli, 'start', '--offline', '--port', '8099'], {
  cwd: fileURLToPath(new URL('..', import.meta.url)),
  env: { ...process.env, CI: '1' },
  stdio: 'inherit',
});

const started = Date.now();
while (!existsSync(target) && Date.now() - started < timeoutMs && server.exitCode === null) {
  await sleep(500);
}
server.kill();

if (!existsSync(target)) {
  console.error('The route types were not generated.');
  process.exit(1);
}
console.log('Generated .expo/types/router.d.ts');
