import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { computeSheet, validateSheet, type Sheet } from './index.ts';

const load = (cycle: number) =>
  JSON.parse(readFileSync(new URL(`../../../docs/defi-mars-2027-cycle${cycle}.json`, import.meta.url), 'utf8')) as Sheet;
const seed = JSON.parse(readFileSync(new URL('../../../apps/api/prisma/seed-contests.json', import.meta.url), 'utf8')) as {
  name: string;
  sheet: Sheet;
}[];

for (const cycle of [2, 3]) {
  test(`Mars II cycle ${cycle}: sheet is valid and identical in docs/ and in the seed`, () => {
    const sheet = load(cycle);
    assert.deepEqual(validateSheet(sheet), []);
    assert.deepEqual(seed.find((c) => c.name === `Défi Mars II 2027 - Cycle ${cycle}`)?.sheet, sheet);
  });

  test(`Mars II cycle ${cycle}: perfect run, penalties and bonus cap`, () => {
    const sheet = load(cycle);
    const perfect = {
      m1: { reserve: 4, empilee: true },
      m2: { resultat: 0 },
      m3: { note: 4 },
      m4: { parfaite: 2 },
      m5: { position: 0 },
      m6: { emetteur: 0, rover: 0 },
      'bonus-techno': { moteurs: 2, capteurs: 2, 'outils-3d': 2 },
    };
    const r = computeSheet(sheet, perfect, 0);
    // 6 missions: 110 (M1 with stacking bonus) + 5 × 100 = 610, + technology bonus capped at 100
    assert.equal(r.missions.find((m) => m.id === 'bonus-techno')?.points, 100);
    assert.equal(r.total, 710);
    assert.equal(computeSheet(sheet, perfect, 12).total, 710 - 50);
    // 5 objects in the caisses mission: data entry error, mission scores 0
    const over = computeSheet(sheet, { m1: { reserve: 4, camp: 1 } }, 0);
    assert.equal(over.missions[0].points, 0);
    assert.ok(over.missions[0].error);
    // bonus below the cap is not reduced
    assert.equal(computeSheet(sheet, { 'bonus-techno': { moteurs: 2, capteurs: 2, 'outils-3d': 1 } }, 0).total, 100);
  });
}

test('Mars II pedagogical bonus: 100 max, poster frames only count with a poster', () => {
  const sheet = load(3);
  const all = { attitude: true, affiche: true, 'a-presentation': true, 'a-conception': true, 'a-programmation': true, 'a-apports': true, 'a-equipe': true };
  const pts = (a: Record<string, boolean>) => computeSheet(sheet, { 'bonus-pedago': a }, 0).total;
  assert.equal(pts(all), 100);
  assert.equal(pts({ ...all, affiche: false }), 50);
  assert.equal(pts({ attitude: true }), 50);
});
