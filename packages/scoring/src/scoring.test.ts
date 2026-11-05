import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compareResults, computeSheet, validateSheet, type Sheet } from './index.ts';

// Shapes taken from the 2019 sheets of the old app.
const sheet: Sheet = {
  durationSeconds: 180,
  penaltyPoints: 4,
  missions: [
    {
      id: 'm1',
      title: 'Dépollution de la rivière',
      items: [
        { id: 'school', type: 'counter', label: 'Déchet à l’école', points: 3, max: 4 },
        { id: 'level4', type: 'check', label: 'Déchet niveau 4', points: 20 },
      ],
      maxObjects: { items: ['school', 'level4'], max: 4 },
    },
    {
      id: 'm5',
      title: 'Création d’un morceau de musique',
      items: [
        { id: 'a', type: 'choice', label: 'Partie 1', options: [{ label: 'non', points: 0 }, { label: 'oui', points: 20 }] },
        { id: 'b', type: 'choice', label: 'Partie 2', options: [{ label: 'non', points: 0 }, { label: 'oui', points: 70 }] },
      ],
      rules: [{ when: [{ item: 'a', equals: 1 }, { item: 'b', equals: 1 }], add: 10 }],
    },
  ],
};

test('sums items, applies combo rule and penalties', () => {
  const r = computeSheet(sheet, { m1: { school: 2, level4: true }, m5: { a: 1, b: 1 } }, 2);
  assert.deepEqual(r.missions.map((m) => m.points), [26, 100]);
  assert.equal(r.penalties, 8);
  assert.equal(r.total, 118);
});

test('object limit zeroes the mission with an error', () => {
  const r = computeSheet(sheet, { m1: { school: 4, level4: true } }, 0);
  assert.equal(r.missions[0].points, 0);
  assert.ok(r.missions[0].error);
});

test('counters are clamped and missing answers count as zero', () => {
  const r = computeSheet(sheet, { m1: { school: 99 }, m5: { a: 0 } }, 0);
  assert.equal(r.total, 12);
});

test('validateSheet accepts a good sheet and reports broken references', () => {
  assert.deepEqual(validateSheet(sheet), []);
  const broken = structuredClone(sheet);
  broken.missions[0].maxObjects!.items.push('ghost');
  assert.equal(validateSheet(broken).length, 1);
});

test('maxPenalties caps the penalties counted (Mars II: 5 pts, 10 max)', () => {
  const capped = { ...sheet, penaltyPoints: 5, maxPenalties: 10 };
  assert.equal(computeSheet(capped, {}, 14).penalties, 50);
  assert.equal(computeSheet(capped, {}, 3).penalties, 15);
  assert.equal(computeSheet(sheet, {}, 14).penalties, 56); // no cap set: unchanged behaviour
  assert.deepEqual(validateSheet(capped), []);
  assert.equal(validateSheet({ ...sheet, maxPenalties: -1 }).length, 1);
});

test('free stopwatch: durationSeconds 0 is a valid sheet', () => {
  assert.deepEqual(validateSheet({ ...sheet, durationSeconds: 0 }), []);
  assert.equal(validateSheet({ ...sheet, durationSeconds: -1 }).length, 1);
});

test('compareResults: score first, then time only when the tie-break is on', () => {
  assert.ok(compareResults({ score: 300 }, { score: 250 }) < 0);
  assert.ok(compareResults({ score: null }, { score: 0 }) > 0);
  const fast = { score: 300, timeSeconds: 95 };
  const slow = { score: 300, timeSeconds: 140 };
  const untimed = { score: 300, timeSeconds: 0 };
  assert.equal(compareResults(fast, slow), 0); // option off: still a tie
  assert.ok(compareResults(fast, slow, true) < 0);
  assert.ok(compareResults(untimed, slow, true) > 0); // a timed run beats an untimed one
  assert.equal(compareResults(untimed, { score: 300, timeSeconds: null }, true), 0);
  assert.ok(compareResults({ score: 310, timeSeconds: 500 }, fast, true) < 0); // points always come first
});

test('limits between lines: clicking the top level of a tower counts the levels under it', async () => {
  const { applyChange, canIncrease } = await import('./index.ts');
  const robee = JSON.parse((await import('node:fs')).readFileSync(new URL('../../../apps/api/prisma/seed-contests.json', import.meta.url), 'utf8'))[0]
    .sheet.missions[0];
  const sheetOf = { durationSeconds: 0, penaltyPoints: 4, missions: [robee] };
  // Perfect mission: one click on level 4 = the whole tower, 4 wastes, everything else blocked
  const full = applyChange(robee, {}, 'n4', 1)!;
  assert.deepEqual(full, { n4: 1, n3: 1, n2: 1, sol: 1 });
  assert.equal(computeSheet(sheetOf, { m1: full }, 0).total, 50);
  for (const id of ['n4', 'n3', 'n2', 'sol', 'ecole', 'autre']) assert.equal(canIncrease(robee, full, id), false, id);
  // Level 3 => levels 2 and ground; level 2 => ground
  assert.deepEqual(applyChange(robee, {}, 'n3', 1), { n3: 1, n2: 1, sol: 1 });
  assert.deepEqual(applyChange(robee, {}, 'n2', 1), { n2: 1, sol: 1 });
  // Two towers of 2: 2 at level 2 => 2 on the ground (4 wastes)
  assert.deepEqual(applyChange(robee, { n2: 1, sol: 1 }, 'n2', 1), { n2: 2, sol: 2 });
  // Never 2 at level 3 / 4, never 3 at level 2, never more than 4 wastes
  assert.equal(canIncrease(robee, { n3: 1, n2: 1, sol: 1 }, 'n3'), false);
  assert.equal(canIncrease(robee, { n3: 1, n2: 1, sol: 1 }, 'n2'), false); // would need 5 wastes
  assert.equal(canIncrease(robee, { n3: 1, n2: 1, sol: 1 }, 'ecole'), true);
  // Removing the ground under a tower removes what stood on it; removing the top keeps the rest
  assert.deepEqual(applyChange(robee, full, 'sol', -1), { n4: 0, n3: 0, n2: 0, sol: 0 });
  assert.deepEqual(applyChange(robee, full, 'n4', -1), { n4: 0, n3: 1, n2: 1, sol: 1 });
  // A contradictory sheet forced through the API scores 0
  const bad = computeSheet(sheetOf, { m1: { n4: 1 } }, 0);
  assert.equal(bad.total, 0);
  assert.match(bad.missions[0].error!, /Saisie impossible/);
  assert.equal(validateSheet({ ...sheetOf, missions: [{ ...robee, limits: [{ item: 'x', notMoreThan: 'sol' }] }] }).length, 1);
});

test('RoBee mission 4 (honey): same top-down entry as the waste towers', async () => {
  const { applyChange, canIncrease } = await import('./index.ts');
  const m4 = JSON.parse((await import('node:fs')).readFileSync(new URL('../../../apps/api/prisma/seed-contests.json', import.meta.url), 'utf8'))[0]
    .sheet.missions[3];
  const full = applyChange(m4, {}, 'n4', 1)!;
  assert.deepEqual(full, { n4: 1, n3: 1, n2: 1, fond: 1 });
  for (const id of ['n4', 'n3', 'n2', 'fond', 'ruche', 'jardin']) assert.equal(canIncrease(m4, full, id), false, id);
  assert.deepEqual(applyChange(m4, { n2: 1, fond: 1 }, 'n2', 1), { n2: 2, fond: 2 });
});

test('RoBee mission 2: once 4 seeds are counted, every other line is blocked', async () => {
  const { canIncrease } = await import('./index.ts');
  const m2 = JSON.parse((await import('node:fs')).readFileSync(new URL('../../../apps/api/prisma/seed-contests.json', import.meta.url), 'utf8'))[0]
    .sheet.missions[1];
  for (const id of ['bonne-zone', 'cour', 'mauvaise-zone', 'pepiniere']) assert.equal(canIncrease(m2, { 'bonne-zone': 4 }, id), false, id);
  assert.equal(canIncrease(m2, { 'bonne-zone': 3 }, 'cour'), true);
});
