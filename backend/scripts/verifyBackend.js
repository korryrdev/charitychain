import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const commands = [
  ['npm', ['run', 'build']],
  ['npm', ['run', 'test:unit']],
  ['npm', ['run', 'test:api']],
  ['npm', ['run', 'test:security']],
  ['npm', ['run', 'test:integration']]
];

for (const [command, args] of commands) {
  process.stdout.write(`\n>>> ${command} ${args.join(' ')}\n`);
  execFileSync(command, args, { cwd: backendRoot, stdio: 'inherit', shell: process.platform === 'win32' });
}

process.stdout.write('\nBackend verification passed.\n');
