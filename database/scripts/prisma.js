import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';

config({ path: new URL('../../.env', import.meta.url), quiet: true });

const prismaCli = fileURLToPath(
  new URL('../../node_modules/prisma/build/index.js', import.meta.url)
);
const result = spawnSync(process.execPath, [prismaCli, ...process.argv.slice(2)], {
  stdio: 'inherit',
  env: process.env
});

if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
