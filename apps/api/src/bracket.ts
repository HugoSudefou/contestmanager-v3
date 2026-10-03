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
}

/** Best team of each group first (by score), then the best remaining teams, until `size` teams. */
export function qualify(teams: Ranked[], size: number): Ranked[] {
  const byScore = [...teams].sort((a, b) => b.best - a.best);
  const winners = new Map<number, Ranked>();
  for (const t of byScore) if (!winners.has(t.groupId)) winners.set(t.groupId, t);
  const qualified = [...winners.values()].slice(0, size);
  for (const t of byScore) {
    if (qualified.length >= size) break;
    if (!qualified.includes(t)) qualified.push(t);
  }
  return qualified.sort((a, b) => b.best - a.best);
}

/** The single best team of a finished match, or null if not everyone is scored yet or it is a tie. */
export function matchWinner(participants: { teamId: number; score: number | null }[]): number | null {
  if (participants.length < 2 || participants.some((p) => p.score === null)) return null;
  const sorted = [...participants].sort((a, b) => b.score! - a.score!);
  return sorted[0].score === sorted[1].score ? null : sorted[0].teamId;
}
