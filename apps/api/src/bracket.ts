import { compareResults } from '@contest/scoring';

/** Pure helpers for the final phase (no database access), tested in bracket.test.ts. */

/** Seed numbers in bracket order: pairs are (1,8), (4,5), (2,7), (3,6) for 8 teams, so 1 and 2 can only meet in the final. */
export function bracketSeeds(size: number): number[] {
  let seeds = [1];
  while (seeds.length < size) {
    const n = seeds.length * 2 + 1;
    seeds = seeds.flatMap((s) => [s, n - s]);
  }
  return seeds;
}

export interface Ranked {
  teamId: number;
  groupId: number;
  best: number;
  /** Time of that best run (used only when the contest splits ties by time). */
  timeSeconds?: number | null;
}

const byResult = (timeTiebreak: boolean) => (a: Ranked, b: Ranked) =>
  compareResults({ score: a.best, timeSeconds: a.timeSeconds }, { score: b.best, timeSeconds: b.timeSeconds }, timeTiebreak);

/** Best team of each group first (by score), then the best remaining teams, until `size` teams. */
export function qualify(teams: Ranked[], size: number, timeTiebreak = false): Ranked[] {
  const byScore = [...teams].sort(byResult(timeTiebreak));
  const winners = new Map<number, Ranked>();
  for (const t of byScore) if (!winners.has(t.groupId)) winners.set(t.groupId, t);
  const qualified = [...winners.values()].slice(0, size);
  for (const t of byScore) {
    if (qualified.length >= size) break;
    if (!qualified.includes(t)) qualified.push(t);
  }
  return qualified.sort(byResult(timeTiebreak));
}

/** The single best team of a finished match, or null if not everyone is scored yet or it is a tie (score, and time if enabled). */
export function matchWinner(
  participants: { teamId: number; score: number | null; timeSeconds?: number | null }[],
  timeTiebreak = false,
): number | null {
  if (participants.length < 2 || participants.some((p) => p.score === null)) return null;
  const sorted = [...participants].sort((a, b) => compareResults(a, b, timeTiebreak));
  return compareResults(sorted[0], sorted[1], timeTiebreak) === 0 ? null : sorted[0].teamId;
}
