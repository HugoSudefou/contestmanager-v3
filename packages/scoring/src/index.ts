/**
 * Data-driven mission sheets. A contest is just JSON: missions made of typed items.
 * The same engine computes scores in the app (live, offline) and in the API (trusted total).
 */

/** `images` (several pictures side by side, e.g. the zone + the object) takes precedence over `image`.
 *  `section`: optional sub-heading shown just before the item (e.g. « 1 - Attitude des élèves pendant le défi »).
 *  `showIf`: id of a check item of the same mission; the line is shown only once that box is ticked
 *  (pair it with a limit item ≤ showIf so unticking the box also clears the hidden line). */
/** One answer of a choice line. `image`: picture shown next to this answer (e.g. the robot in the workshop). */
export interface ChoiceOption {
  label: string;
  points: number;
  image?: string;
}

export type ItemDef =
  | { id: string; type: 'check'; label: string; section?: string; showIf?: string; image?: string; images?: string[]; points: number }
  | { id: string; type: 'counter'; label: string; section?: string; showIf?: string; image?: string; images?: string[]; points: number; max: number }
  | { id: string; type: 'choice'; label: string; section?: string; showIf?: string; image?: string; images?: string[]; options: ChoiceOption[] };

/** Adds `add` points (can be negative) when every condition matches. Covers the "20 + 70 = 100" style combos. */
export interface RuleDef {
  label?: string;
  when: { item: string; equals: boolean | number }[];
  add: number;
}

/**
 * Who scores what. A team is evaluated in four separate parts:
 * - match: the missions and penalties, scored by the referee at each match (only the best match counts);
 * - attitude: scored once by the referee, after the team's last match;
 * - pedagogique: poster and oral presentation, scored once by the educational advisers;
 * - technologique: scored once by the digital-education referents.
 * Final score = best match + attitude + pedagogique + technologique.
 */
export type EvalPart = 'match' | 'attitude' | 'pedagogique' | 'technologique';
export const EVAL_PARTS: { part: EvalPart; title: string; who: string }[] = [
  { part: 'match', title: 'Matchs', who: "L'arbitre, à chaque match" },
  { part: 'attitude', title: 'Bonus Attitude', who: "L'arbitre, après le dernier match de l'équipe" },
  { part: 'pedagogique', title: 'Bonus pédagogique', who: 'Les conseillers pédagogiques' },
  { part: 'technologique', title: 'Bonus technologique', who: 'Les référents numériques' },
];

export interface MissionDef {
  id: string;
  title: string;
  /** Evaluation part this mission belongs to; absent = 'match'. */
  part?: EvalPart;
  description?: string;
  image?: string;
  items: ItemDef[];
  /** Shared limit on objects across items (counter value, or 1 per ticked check). Exceeded = mission scores 0. */
  maxObjects?: { items: string[]; max: number };
  /** Ceiling on the mission's points (e.g. technology bonus: 100 points at most). */
  maxPoints?: number;
  /**
   * Physical consistency between lines: `item` can never count more than `notMoreThan`
   * (e.g. a waste at level 3 of a tower needs one at level 2 under it). On the sheet, adding to `item`
   * also adds to `notMoreThan` (and so on down the chain); the server gives 0 to a mission that breaks one.
   */
  limits?: { item: string; notMoreThan: string }[];
  rules?: RuleDef[];
}

export interface Sheet {
  /** Match length; 0 = free stopwatch (counts up with no limit, timing optional). */
  durationSeconds: number;
  /** Equal scores are split by time: a timed run beats an untimed one, the shorter time wins. */
  timeTiebreak?: boolean;
  penaltyPoints: number;
  /** Optional cap on the number of penalties counted (e.g. Mars II: 10 max). */
  maxPenalties?: number;
  missions: MissionDef[];
}

/** check: boolean, counter: number, choice: option index (null = nothing chosen). */
export type ItemValue = boolean | number | null;
export type MissionAnswers = Record<string, ItemValue>;
export type Answers = Record<string, MissionAnswers>;

export interface MissionResult {
  id: string;
  points: number;
  error?: string;
}

export interface SheetResult {
  missions: MissionResult[];
  penalties: number;
  total: number;
}

function counterValue(item: { max: number }, value: ItemValue | undefined): number {
  return typeof value === 'number' ? Math.max(0, Math.min(item.max, Math.floor(value))) : 0;
}

function itemPoints(item: ItemDef, value: ItemValue | undefined): number {
  switch (item.type) {
    case 'check':
      return value === true ? item.points : 0;
    case 'counter':
      return counterValue(item, value) * item.points;
    case 'choice':
      return typeof value === 'number' ? (item.options[value]?.points ?? 0) : 0;
  }
}

function objectCount(item: ItemDef, value: ItemValue | undefined): number {
  if (item.type === 'counter') return counterValue(item, value);
  if (item.type === 'check') return value === true ? 1 : 0;
  return typeof value === 'number' ? 1 : 0;
}

/** How many objects an item stands for: counter value, 1 per ticked check, 1 per chosen option. */
export function itemCount(mission: MissionDef, answers: MissionAnswers, itemId: string): number {
  const item = mission.items.find((i) => i.id === itemId);
  return item ? objectCount(item, answers[itemId]) : 0;
}

/** Objects counted in the mission's shared limit (maxObjects), or 0 when there is none. */
export function objectsUsed(mission: MissionDef, answers: MissionAnswers = {}): number {
  const ids = mission.maxObjects?.items ?? [];
  return mission.items.filter((i) => ids.includes(i.id)).reduce((sum, i) => sum + objectCount(i, answers[i.id]), 0);
}

/**
 * The referee's +1 / −1 on a counter (or ticking / unticking a box), with the lines that depend on it kept consistent:
 * adding a waste at level 3 also counts the levels under it (`limits`), removing a lower level removes what
 * stood on it. Returns the new answers, or null when the change is impossible (line or object maximum reached).
 */
export function applyChange(mission: MissionDef, answers: MissionAnswers, itemId: string, delta: 1 | -1): MissionAnswers | null {
  const item = mission.items.find((i) => i.id === itemId);
  if (!item || item.type === 'choice') return null;
  const next: MissionAnswers = { ...answers };
  const get = (id: string) => itemCount(mission, next, id);
  const put = (id: string, n: number) => {
    const it = mission.items.find((i) => i.id === id);
    if (it) next[id] = it.type === 'check' ? n > 0 : n;
  };
  const target = get(itemId) + delta;
  if (target < 0) return null;
  put(itemId, target);
  for (let changed = true, guard = 0; changed && guard < 100; guard++) {
    changed = false;
    for (const l of mission.limits ?? []) {
      const above = get(l.item);
      const below = get(l.notMoreThan);
      if (above > below) {
        if (delta > 0) put(l.notMoreThan, above);
        else put(l.item, below);
        changed = true;
      }
    }
  }
  for (const i of mission.items) {
    const raw = next[i.id];
    if (i.type === 'counter' && typeof raw === 'number' && raw > i.max) return null;
  }
  if (mission.maxObjects && objectsUsed(mission, next) > mission.maxObjects.max) return null;
  return next;
}

/** Can the referee add one here (dependent lines included) without going over a maximum? */
export function canIncrease(mission: MissionDef, answers: MissionAnswers, itemId: string): boolean {
  return applyChange(mission, answers, itemId, 1) !== null;
}

/** Can the referee remove one here? (Lines that depend on it follow.) */
export function canDecrease(mission: MissionDef, answers: MissionAnswers, itemId: string): boolean {
  return applyChange(mission, answers, itemId, -1) !== null;
}

export function computeMission(mission: MissionDef, answers: MissionAnswers = {}): MissionResult {
  for (const l of mission.limits ?? []) {
    if (itemCount(mission, answers, l.item) > itemCount(mission, answers, l.notMoreThan)) {
      const label = (id: string) => mission.items.find((i) => i.id === id)?.label ?? id;
      return { id: mission.id, points: 0, error: `Saisie impossible : « ${label(l.item)} » dépasse « ${label(l.notMoreThan)} ».` };
    }
  }
  if (mission.maxObjects) {
    const { items, max } = mission.maxObjects;
    const count = mission.items
      .filter((i) => items.includes(i.id))
      .reduce((sum, i) => sum + objectCount(i, answers[i.id]), 0);
    if (count > max) {
      return { id: mission.id, points: 0, error: `Plus de ${max} objets comptés (${count}). Vérifiez la saisie.` };
    }
  }
  let points = mission.items.reduce((sum, i) => sum + itemPoints(i, answers[i.id]), 0);
  for (const rule of mission.rules ?? []) {
    if (rule.when.every((c) => (answers[c.item] ?? (typeof c.equals === 'boolean' ? false : null)) === c.equals)) {
      points += rule.add;
    }
  }
  if (mission.maxPoints != null && mission.maxPoints >= 0) points = Math.min(points, mission.maxPoints);
  return { id: mission.id, points };
}

/** Number of penalties actually counted: never negative, capped by `maxPenalties` when set. */
export function clampPenalties(sheet: Pick<Sheet, 'maxPenalties'>, penaltyCount: number): number {
  const n = Math.max(0, Math.floor(Number(penaltyCount) || 0));
  return sheet.maxPenalties != null && sheet.maxPenalties > 0 ? Math.min(n, sheet.maxPenalties) : n;
}

export function computeSheet(sheet: Sheet, answers: Answers, penaltyCount: number): SheetResult {
  const missions = sheet.missions.map((m) => computeMission(m, answers[m.id]));
  const penalties = clampPenalties(sheet, penaltyCount) * sheet.penaltyPoints;
  const total = missions.reduce((sum, m) => sum + m.points, 0) - penalties;
  return { missions, penalties, total };
}

/** The part a mission belongs to (missions without `part` are match missions). */
export function partOf(mission: Pick<MissionDef, 'part'>): EvalPart {
  return mission.part ?? 'match';
}

/** The sheet restricted to one part. Penalties only exist in matches. */
export function sheetForPart(sheet: Sheet, part: EvalPart): Sheet {
  const missions = sheet.missions.filter((m) => partOf(m) === part);
  return part === 'match' ? { ...sheet, missions } : { ...sheet, missions, penaltyPoints: 0, maxPenalties: 0 };
}

/** Score of one part: a match (missions − penalties) or a bonus evaluated once per team. */
export function computePart(sheet: Sheet, part: EvalPart, answers: Answers, penaltyCount = 0): SheetResult {
  return computeSheet(sheetForPart(sheet, part), answers, part === 'match' ? penaltyCount : 0);
}

/** Parts that actually have missions in this sheet (a contest without bonus shows only the matches). */
export function partsOf(sheet: Sheet): EvalPart[] {
  return EVAL_PARTS.map((p) => p.part).filter((p) => sheet.missions.some((m) => partOf(m) === p));
}

/** Final score: the best match plus each bonus evaluated once. null while nothing has been scored. */
export function finalScore(bestMatch: number | null, bonuses: (number | null | undefined)[]): number | null {
  const scored = bonuses.filter((b): b is number => typeof b === 'number');
  if (bestMatch === null && scored.length === 0) return null;
  return (bestMatch ?? 0) + scored.reduce((a, b) => a + b, 0);
}

export interface Performance {
  score: number | null;
  timeSeconds?: number | null;
}

/**
 * Sort comparator for results: negative when `a` ranks before `b`, 0 for a real tie.
 * Higher score first (unscored last). With `timeTiebreak`, equal scores are split by time:
 * a timed run (more than 0 s) beats an untimed one, and the shorter time wins.
 */
export function compareResults(a: Performance, b: Performance, timeTiebreak = false): number {
  const sa = a.score ?? -Infinity;
  const sb = b.score ?? -Infinity;
  if (sa !== sb) return sa > sb ? -1 : 1;
  if (!timeTiebreak) return 0;
  const ta = a.timeSeconds && a.timeSeconds > 0 ? a.timeSeconds : Infinity;
  const tb = b.timeSeconds && b.timeSeconds > 0 ? b.timeSeconds : Infinity;
  return ta === tb ? 0 : ta < tb ? -1 : 1;
}

/** Returns human-readable problems; empty array = valid. Used by the admin form and the API. */
export function validateSheet(sheet: unknown): string[] {
  const errors: string[] = [];
  const s = sheet as Partial<Sheet> | null;
  if (!s || typeof s !== 'object') return ['La feuille de mission est vide.'];
  if (!Number.isFinite(s.durationSeconds) || (s.durationSeconds ?? -1) < 0) errors.push('Durée du chrono invalide.');
  if (!Number.isFinite(s.penaltyPoints) || (s.penaltyPoints ?? -1) < 0) errors.push('Points de pénalité invalides.');
  if (s.maxPenalties != null && !(Number.isInteger(s.maxPenalties) && s.maxPenalties >= 0)) errors.push('Maximum de pénalités invalide.');
  if (!Array.isArray(s.missions) || s.missions.length === 0) return [...errors, 'Ajoutez au moins une mission.'];

  const missionIds = new Set<string>();
  for (const m of s.missions) {
    const where = `Mission « ${m?.title || '?'} »`;
    if (!m?.id || missionIds.has(m.id)) errors.push(`${where} : identifiant manquant ou en double.`);
    missionIds.add(m?.id);
    if (!m?.title) errors.push(`${where} : titre manquant.`);
    if (m?.part != null && !EVAL_PARTS.some((p) => p.part === m.part)) errors.push(`${where} : partie d'évaluation inconnue (${m.part}).`);
    if (!Array.isArray(m?.items) || m.items.length === 0) {
      errors.push(`${where} : ajoutez au moins une ligne de score.`);
      continue;
    }
    const itemIds = new Set<string>();
    for (const i of m.items) {
      if (!i?.id || itemIds.has(i.id)) errors.push(`${where} : identifiant de ligne manquant ou en double.`);
      itemIds.add(i?.id);
      if (!i?.label) errors.push(`${where} : une ligne n'a pas de libellé.`);
      if (i?.type === 'check' && !Number.isFinite(i.points)) errors.push(`${where} / ${i.label} : points invalides.`);
      else if (i?.type === 'counter' && (!Number.isFinite(i.points) || !(i.max >= 1))) {
        errors.push(`${where} / ${i.label} : points ou maximum invalides.`);
      } else if (i?.type === 'choice' && (!Array.isArray(i.options) || i.options.length < 2)) {
        errors.push(`${where} / ${i.label} : il faut au moins 2 choix.`);
      } else if (!['check', 'counter', 'choice'].includes(i?.type)) errors.push(`${where} : type de ligne inconnu.`);
    }
    for (const id of m.maxObjects?.items ?? []) {
      if (!itemIds.has(id)) errors.push(`${where} : la limite d'objets cite une ligne inconnue (${id}).`);
    }
    if (m.maxPoints != null && !(Number.isFinite(m.maxPoints) && m.maxPoints >= 0)) errors.push(`${where} : plafond de points invalide.`);
    for (const it of m.items ?? []) {
      if (it?.showIf != null && !m.items.some((o: ItemDef) => o.id === it.showIf && o.type === 'check'))
        errors.push(`${where} : « ${it.label} » dépend d'une case à cocher inconnue (${it.showIf}).`);
    }
    for (const l of m.limits ?? []) {
      if (!itemIds.has(l?.item) || !itemIds.has(l?.notMoreThan)) errors.push(`${where} : une limite entre lignes cite une ligne inconnue.`);
    }
    for (const r of m.rules ?? []) {
      if (!Number.isFinite(r.add)) errors.push(`${where} : bonus de règle invalide.`);
      for (const c of r.when ?? []) {
        if (!itemIds.has(c.item)) errors.push(`${where} : une règle cite une ligne inconnue (${c.item}).`);
      }
    }
  }
  return errors;
}
