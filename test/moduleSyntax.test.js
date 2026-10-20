import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

function sourceModules(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceModules(path);
    return entry.isFile() && entry.name.endsWith('.js') ? [path] : [];
  });
}

test('all source modules parse before the game starts', () => {
  const modules = sourceModules(fileURLToPath(new URL('../src/', import.meta.url)));
  const failures = modules.flatMap((path) => {
    const result = spawnSync(process.execPath, ['--check', path], { encoding: 'utf8' });
    return result.status === 0 ? [] : [`${path}\n${result.stderr}`];
  });

  assert.deepEqual(failures, []);
});
