import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateSheet, type Sheet } from './index.ts';
import { BUILTIN_CONTESTS } from '../../../apps/app/src/app/builtin-contests.ts';

// The app embeds the training contests; they must stay identical to the server seed and to docs/concours/.
const seed = JSON.parse(readFileSync(new URL('../../../apps/api/prisma/seed-contests.json', import.meta.url), 'utf8')) as {
  name: string;
  sheet: Sheet;
}[];
const source: Record<string, string> = {
  robee: 'Défi robotique 2019 - Cycle 2',
  gardbot: 'Défi robotique 2019 - Cycle 3',
  'mars2-cycle2': 'Défi Mars II 2027 - Cycle 2',
  'mars2-cycle3': 'Défi Mars II 2027 - Cycle 3',
};

test('the app embeds the 4 training contests', () => {
  assert.deepEqual(
    BUILTIN_CONTESTS.map((c) => c.name),
    ['RoBee, un robot pollinisateur', 'Une nuit au musée avec GardBot', 'Mars II - cycle 2', 'Mars II - cycle 3'],
  );
});

for (const c of BUILTIN_CONTESTS) {
  test(`built-in « ${c.name} »: valid, same sheet as the seed and as docs/concours/${c.id}.json`, () => {
    assert.deepEqual(validateSheet(c.sheet), []);
    assert.deepEqual(c.sheet, seed.find((s) => s.name === source[c.id])?.sheet);
    const file = JSON.parse(readFileSync(new URL(`../../../docs/concours/${c.id}.json`, import.meta.url), 'utf8'));
    assert.equal(file.name, c.name);
    assert.deepEqual(file.sheet, c.sheet);
    for (const img of JSON.stringify(c.sheet).match(/assets\/[^"]+/g) ?? []) {
      assert.ok(readFileSync(new URL(`../../../apps/app/src/${img}`, import.meta.url)).length > 0, img);
    }
  });
}
