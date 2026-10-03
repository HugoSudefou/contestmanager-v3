import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeSheet, validateSheet, type Sheet } from './index.ts';

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
