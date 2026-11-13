import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { applyChange, computePart, computeSheet, finalScore, partsOf, validateSheet, type Sheet } from './index.ts';

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
  const best = { m1: { n4: 1, n3: 1, n2: 1, sol: 1 }, m2: { 'bonne-zone': 4 }, m3: { arret: true, structure: true, musique: true }, m4: { n4: 1, n3: 1, n2: 1, fond: 1 }, m5: { danse: 1 }, m6: { abri: 1, eteint: 0 } };
  const r = computeSheet(robee, best, 0);
  assert.deepEqual(r.missions.slice(0, 6).map((m) => m.points), [150, 120, 90, 150, 30, 60]);
  assert.equal(r.total, 600);
});

test('bonuses, identical in all 4 contests: attitude (referee), poster (advisers), technology (referents)', () => {
  const all = seed;
  assert.equal(all.length, 4);
  for (const id of ['bonus-attitude', 'bonus-pedago']) {
    const ref = JSON.stringify(all[0].sheet.missions.find((x) => x.id === id));
    for (const c of all) assert.equal(JSON.stringify(c.sheet.missions.find((x) => x.id === id)), ref, `${c.name} ${id}`);
  }
  for (const c of all) {
    // Attitude: scored by the referee after the matches, 5 criteria worth 10 points
    const att = c.sheet.missions.find((x) => x.id === 'bonus-attitude')!;
    assert.equal(att.part, 'attitude');
    const ids = att.items.map((i) => i.id);
    const ticked = (list: string[]) => Object.fromEntries(list.map((id) => [id, true]));
    assert.equal(computePart(c.sheet, 'attitude', { 'bonus-attitude': ticked(ids) }).total, 50, c.name);
    // Poster: scored by the educational advisers, its 5 frames open once "poster present" is ticked
    const m = c.sheet.missions.find((x) => x.id === 'bonus-pedago')!;
    assert.equal(m.part, 'pedagogique');
    const frames = ['a-presentation', 'a-conception', 'a-programmation', 'a-apports', 'a-equipe'];
    for (const id of frames) assert.equal(m.items.find((i) => i.id === id)!.showIf, 'affiche', id);
    assert.equal(computePart(c.sheet, 'pedagogique', { 'bonus-pedago': ticked(['affiche', ...frames]) }).total, 50);
    assert.equal(computePart(c.sheet, 'pedagogique', { 'bonus-pedago': ticked(['affiche']) }).total, 0);
    const one = applyChange(m, applyChange(m, {}, 'affiche', 1)!, 'a-conception', 1)!;
    assert.equal(applyChange(m, one, 'affiche', -1)!['a-conception'], false);
    assert.equal(computePart(c.sheet, 'pedagogique', { 'bonus-pedago': { 'a-conception': true } }).total, 0);
    // Technology: scored by the digital-education referents
    assert.equal(c.sheet.missions.find((x) => x.id === 'bonus-techno')!.part, 'technologique');
    // A match only counts the missions and penalties: bonus answers sent with a match are ignored
    assert.equal(computePart(c.sheet, 'match', { 'bonus-attitude': ticked(ids) }, 2).total, -10, c.name);
    assert.deepEqual(partsOf(c.sheet), ['match', 'attitude', 'pedagogique', 'technologique']);
    // Bonuses never get penalties
    assert.equal(computePart(c.sheet, 'technologique', {}, 5).total, 0);
  }
});

test('final score = best match + the three bonuses', () => {
  assert.equal(finalScore(420, [40, 50, 100]), 610);
  assert.equal(finalScore(420, [null, undefined, 60]), 480);
  assert.equal(finalScore(null, [30]), 30);
  assert.equal(finalScore(null, [null]), null);
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

test('GardBot mission 6: workshop 30 / lodge 50 / other 0, then switched off yes 50 / no 0', () => {
  const m6 = seed.find((c) => c.name === 'Défi robotique 2019 - Cycle 3')!.sheet.missions[5];
  const sheet = { durationSeconds: 0, penaltyPoints: 5, missions: [m6] };
  const pts = (position: number, eteint: number) => computeSheet(sheet, { m6: { position, eteint } }, 0).total;
  assert.equal(pts(1, 0), 100);
  assert.equal(pts(0, 0), 80);
  assert.equal(pts(1, 1), 50);
  assert.equal(pts(2, 1), 0);
});

test('every picture of the 4 contests exists, and each answer picture sits next to its own answer', async () => {
  const { existsSync } = await import('node:fs');
  const assets = new URL('../../../apps/app/src/', import.meta.url);
  const all = JSON.parse(readFileSync(new URL('../../../apps/api/prisma/seed-contests.json', import.meta.url), 'utf8')) as { name: string; sheet: Sheet }[];
  for (const c of all) {
    for (const m of c.sheet.missions) {
      const pics = [m.image, ...m.items.flatMap((i) => [i.image, ...(i.images ?? []), ...(i.type === 'choice' ? i.options.map((o) => o.image) : [])])];
      for (const p of pics.filter(Boolean)) assert.ok(existsSync(new URL(p!, assets)), `${c.name} ${m.id} : ${p} introuvable`);
      for (const i of m.items) {
        if (i.type !== 'choice') continue;
        const optionPics = i.options.map((o) => o.image).filter(Boolean);
        assert.equal(new Set(optionPics).size, optionPics.length, `${c.name} ${m.id}/${i.id} : même image sur deux réponses`);
        if (optionPics.length) assert.ok(!i.images?.length && !i.image, `${c.name} ${m.id}/${i.id} : images à la fois sur la question et les réponses`);
      }
    }
  }
  // GardBot: the mummy's three places have their picture, "Autre situation" none; "éteint" next to "Oui"
  const gardbot = all.find((c) => c.sheet.missions.some((m) => JSON.stringify(m).includes('gardbot')))!;
  const item = (mid: string, iid: string) => gardbot.sheet.missions.find((m) => m.id === mid)!.items.find((i) => i.id === iid)!;
  const momie = item('m1', 'momie');
  assert.deepEqual(momie.type === 'choice' && momie.options.map((o) => o.image?.split('/').pop() ?? null), [
    'm1-momie-tablette-sarcophage.jpg', 'm1-momie-loge.jpg', 'm1-momie-couloirs.jpg', null,
  ]);
  const eteint = item('m6', 'eteint');
  assert.deepEqual(eteint.type === 'choice' && eteint.options.map((o) => o.image?.split('/').pop() ?? null), ['m6-eteint.png', null]);
});
