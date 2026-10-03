import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bracketSeeds, matchWinner, qualify } from './bracket.ts';

test('bracket seeds keep top seeds apart', () => {
  assert.deepEqual(bracketSeeds(2), [1, 2]);
  assert.deepEqual(bracketSeeds(4), [1, 4, 2, 3]);
  assert.deepEqual(bracketSeeds(8), [1, 8, 4, 5, 2, 7, 3, 6]);
});

test('qualify takes each group winner, then the best others', () => {
  const teams = [
    { teamId: 1, groupId: 1, best: 90 },
    { teamId: 2, groupId: 1, best: 80 },
    { teamId: 3, groupId: 2, best: 40 },
    { teamId: 4, groupId: 3, best: 50 },
    { teamId: 5, groupId: 1, best: 70 },
  ];
  assert.deepEqual(qualify(teams, 4).map((t) => t.teamId), [1, 2, 4, 3]);
  // More groups than places: best group winners only.
  assert.deepEqual(qualify(teams, 2).map((t) => t.teamId), [1, 4]);
});

test('matchWinner needs every score and no tie', () => {
  assert.equal(matchWinner([{ teamId: 1, score: 10 }, { teamId: 2, score: null }]), null);
  assert.equal(matchWinner([{ teamId: 1, score: 10 }, { teamId: 2, score: 10 }]), null);
  assert.equal(matchWinner([{ teamId: 1, score: 10 }, { teamId: 2, score: 30 }]), 2);
});
