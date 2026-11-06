import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { computeSheet, validateSheet, type Sheet } from './index.ts';

const seed = JSON.parse(readFileSync(new URL('../../../apps/api/prisma/seed-contests.json', import.meta.url), 'utf8')) as {
  name: string;
  sheet: Sheet;
}[];
const load = (cycle: number) => seed.find((c) => c.name === `Défi Mars II 2027 - Cycle ${cycle}`)!.sheet;

for (const cycle of [2, 3]) {
  test(`Mars II cycle ${cycle}: sheet is valid`, () => {
    assert.deepEqual(validateSheet(load(cycle)), []);
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
      'bonus-techno': { capteurs: 3, moteurs: 2, 'outils-3d': 1 },
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
    assert.equal(computeSheet(sheet, { 'bonus-techno': { capteurs: 2, moteurs: 2 } }, 0).total, 80);
    assert.equal(computeSheet(sheet, { 'bonus-techno': { capteurs: 2, moteurs: 1, 'outils-3d': 1 } }, 0).total, 80);
  });
}

test('technology bonus, same in all 4 contests (robot name aside): 3 sensors, 2 motors, 2 3D tools, 100 max', () => {
  const strip = (c: (typeof seed)[number]) => {
    const m = structuredClone(c.sheet.missions.find((x) => x.id === 'bonus-techno')!);
    m.items.forEach((i) => (i.label = i.label.replace(/^(RoBee|GardBot|Le rover) /, '')));
    return JSON.stringify(m);
  };
  for (const c of seed) assert.equal(strip(c), strip(seed[0]), c.name);
  assert.deepEqual(seed.map((c) => c.sheet.missions.find((x) => x.id === 'bonus-techno')!.items[0].label.split(' ')[0]), ['RoBee', 'GardBot', 'Le', 'Le']);
  const m = seed[0].sheet.missions.find((x) => x.id === 'bonus-techno')!;
  assert.deepEqual(m.items.map((i) => [i.id, i.type === 'counter' ? i.max : 0]), [['capteurs', 3], ['moteurs', 2], ['outils-3d', 2]]);
  const sheet = { ...seed[0].sheet, missions: [m] };
  const pts = (a: Record<string, number>) => computeSheet(sheet, { 'bonus-techno': a }, 0).total;
  assert.equal(pts({ capteurs: 3, moteurs: 2, 'outils-3d': 2 }), 100); // 140 capped
  assert.equal(pts({ capteurs: 3, moteurs: 2 }), 100);
  assert.equal(pts({ capteurs: 2, 'outils-3d': 2 }), 80);
});

test('RoBee: missions worth 600 points like the other contests (2019 scores x 3)', () => {
  const robee = seed.find((c) => c.name === 'Défi robotique 2019 - Cycle 2')!.sheet;
  const best = { m1: { n4: 1, n3: 1, n2: 1, sol: 1 }, m2: { 'bonne-zone': 4 }, m3: { arret: true, structure: true, musique: true }, m4: { n4: 1, n3: 1, n2: 1, fond: 1 }, m5: { danse: 1 }, m6: { abri: 1 } };
  const r = computeSheet(robee, best, 0);
  assert.deepEqual(r.missions.slice(0, 6).map((m) => m.points), [150, 120, 90, 150, 30, 60]);
  assert.equal(r.total, 600);
});

test('pedagogical bonus, identical in all 4 contests: 5 attitude criteria + poster frames that need the poster', async () => {
  const { applyChange } = await import('./index.ts');
  const all = seed;
  assert.equal(all.length, 4);
  const ref = JSON.stringify(all[0].sheet.missions.find((x) => x.id === 'bonus-pedago'));
  for (const c of all) assert.equal(JSON.stringify(c.sheet.missions.find((x) => x.id === 'bonus-pedago')), ref, c.name);
  for (const c of all) {
    const m = c.sheet.missions.find((x) => x.id === 'bonus-pedago')!;
    const sheet = { ...c.sheet, missions: [m] };
    const att = ['att-respect', 'att-roles', 'att-arbitre', 'att-perseverance', 'att-autres-equipes'];
    const frames = ['a-presentation', 'a-conception', 'a-programmation', 'a-apports', 'a-equipe'];
    const ticked = (ids: string[]) => Object.fromEntries(ids.map((id) => [id, true]));
    assert.equal(computeSheet(sheet, { 'bonus-pedago': ticked(att) }, 0).total, 50, c.name);
    assert.equal(computeSheet(sheet, { 'bonus-pedago': ticked(['att-respect', 'att-arbitre']) }, 0).total, 20);
    assert.equal(computeSheet(sheet, { 'bonus-pedago': ticked([...att, 'affiche', ...frames]) }, 0).total, 100);
    // Ticking a frame ticks "poster present"; unticking the poster unticks its frames
    const one = applyChange(m, {}, 'a-conception', 1)!;
    assert.equal(one.affiche, true);
    assert.equal(computeSheet(sheet, { 'bonus-pedago': one }, 0).total, 10);
    assert.equal(applyChange(m, one, 'affiche', -1)!['a-conception'], false);
    // A frame without the poster (forced through the API) is refused
    assert.equal(computeSheet(sheet, { 'bonus-pedago': { 'a-conception': true } }, 0).total, 0);
  }
});

test('penalties are the same in all 4 contests: 5 points each, 10 at most', () => {
  for (const c of seed) {
    assert.equal(c.sheet.penaltyPoints, 5, c.name);
    assert.equal(c.sheet.maxPenalties, 10, c.name);
    assert.equal(computeSheet(c.sheet, {}, 13).penalties, 50, c.name);
  }
});

test('time is handled the same way in all 4 contests: free stopwatch, ties split by time', () => {
  for (const c of seed) {
    assert.equal(c.sheet.durationSeconds, 0, c.name);
    assert.equal(c.sheet.timeTiebreak, true, c.name);
  }
});
