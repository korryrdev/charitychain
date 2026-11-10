import { access } from 'node:fs/promises';
await access(new URL('../src/index.js', import.meta.url));
process.stdout.write('Shared package source validation passed.\n');
