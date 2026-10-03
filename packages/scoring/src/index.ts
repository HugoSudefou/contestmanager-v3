/**
 * Data-driven mission sheets. A contest is just JSON: missions made of typed items.
 * The same engine computes scores in the app (live, offline) and in the API (trusted total).
 */

export type ItemDef =
  | { id: string; type: 'check'; label: string; image?: string; points: number }
  | { id: string; type: 'counter'; label: string; image?: string; points: number; max: number }
  | { id: string; type: 'choice'; label: string; image?: string; options: { label: string; points: number }[] };

/** Adds `add` points (can be negative) when every condition matches. Covers the "20 + 70 = 100" style combos. */
export interface RuleDef {
  label?: string;
  when: { item: string; equals: boolean | number }[];
  add: number;
}

export interface MissionDef {
  id: string;
  title: string;
  description?: string;
  image?: string;
  items: ItemDef[];
  /** Shared limit on objects across items (counter value, or 1 per ticked check). Exceeded = mission scores 0. */
  maxObjects?: { items: string[]; max: number };
  rules?: RuleDef[];
}

export interface Sheet {
  durationSeconds: number;
  penaltyPoints: number;
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

export function computeMission(mission: MissionDef, answers: MissionAnswers = {}): MissionResult {
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
  return { id: mission.id, points };
}

export function computeSheet(sheet: Sheet, answers: Answers, penaltyCount: number): SheetResult {
  const missions = sheet.missions.map((m) => computeMission(m, answers[m.id]));
  const penalties = Math.max(0, Math.floor(penaltyCount)) * sheet.penaltyPoints;
  const total = missions.reduce((sum, m) => sum + m.points, 0) - penalties;
  return { missions, penalties, total };
}

/** Returns human-readable problems; empty array = valid. Used by the admin form and the API. */
export function validateSheet(sheet: unknown): string[] {
  const errors: string[] = [];
  const s = sheet as Partial<Sheet> | null;
  if (!s || typeof s !== 'object') return ['La feuille de mission est vide.'];
  if (!Number.isFinite(s.durationSeconds) || (s.durationSeconds ?? 0) <= 0) errors.push('Durée du chrono invalide.');
  if (!Number.isFinite(s.penaltyPoints) || (s.penaltyPoints ?? -1) < 0) errors.push('Points de pénalité invalides.');
  if (!Array.isArray(s.missions) || s.missions.length === 0) return [...errors, 'Ajoutez au moins une mission.'];

  const missionIds = new Set<string>();
  for (const m of s.missions) {
    const where = `Mission « ${m?.title || '?'} »`;
    if (!m?.id || missionIds.has(m.id)) errors.push(`${where} : identifiant manquant ou en double.`);
    missionIds.add(m?.id);
    if (!m?.title) errors.push(`${where} : titre manquant.`);
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
    for (const r of m.rules ?? []) {
      if (!Number.isFinite(r.add)) errors.push(`${where} : bonus de règle invalide.`);
      for (const c of r.when ?? []) {
        if (!itemIds.has(c.item)) errors.push(`${where} : une règle cite une ligne inconnue (${c.item}).`);
      }
    }
  }
  return errors;
}
