import { readdir, readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const backendRoot = fileURLToPath(new URL('..', import.meta.url));
const sourceRoot = path.join(backendRoot, 'src');
const requiredPaths = [
  'package.json',
  '.env.example',
  'src/app.js',
  'src/server.js',
  'src/bootstrap',
  'src/config',
  'src/middleware',
  'src/modules',
  'src/routes',
  'tests'
];

async function collectJavaScriptFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nestedFiles = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) return collectJavaScriptFiles(entryPath);
      return entry.isFile() && entry.name.endsWith('.js') ? [entryPath] : [];
    })
  );

  return nestedFiles.flat();
}

for (const requiredPath of requiredPaths) {
  await stat(path.join(backendRoot, requiredPath));
}

const packageJson = JSON.parse(await readFile(path.join(backendRoot, 'package.json'), 'utf8'));
if (packageJson.name !== '@charitychain/backend' || packageJson.type !== 'module') {
  throw new Error('Backend package metadata is invalid.');
}

const sourceFiles = await collectJavaScriptFiles(sourceRoot);
if (sourceFiles.length === 0) throw new Error('No backend JavaScript source files were found.');

process.stdout.write(
  `Backend root validation passed (${requiredPaths.length} required paths, ${sourceFiles.length} source files).\n`
);
