import { Injectable, computed, signal } from '@angular/core';
import { compareResults, finalScore, type Answers, type EvalPart, type Sheet } from '@contest/scoring';
import { environment } from '../environments/environment';

/** REFEREE: parents, no password (matches + attitude). EVALUATOR: poster / oral and technology bonuses, simple password. */
export type Role = 'ADMIN' | 'REFEREE' | 'TEACHER' | 'EVALUATOR';
export interface User { id: number; username: string; role: Role }
export interface Contest {
  id: number;
  name: string;
  season: string;
  description: string | null;
  sheet: Sheet;
  published: boolean;
}
/** Contest embedded in the app (builtin-contests.ts): training works with no server and no network. */
export interface BuiltinContest {
  id: string;
  name: string;
  season: string;
  description: string | null;
  sheet: Sheet;
}
export interface Tournament { id: number; name: string; date: string | null; location: string | null }
export interface Team {
  id: number;
  name: string;
  school: { name: string } | null;
  teacherId: number | null;
  groupId: number;
  /** Number in its class: with the class letter, the team code (A1, B3...). */
  number?: number | null;
  /** Bonuses scored once for the team (attitude, pedagogique, technologique). */
  evaluations?: TeamEvaluation[];
}
export interface TeamEvaluation { part: EvalPart; score: number; scoredAt: string; answers?: Answers }
export interface Student { id?: number; firstName: string; lastName: string; role: string | null }
export interface Participant {
  id: number;
  matchId: number;
  teamId: number;
  score: number | null;
  timeSeconds: number | null;
  scoredAt: string | null;
  team: { id: number; name: string };
}
export interface Match {
  id: number;
  groupId: number;
  tableNumber: number | null;
  scheduledAt: string | null;
  /** Final phase: 1 = final, 2 = semi-finals... null = qualifying match. */
  round: number | null;
  bracketIndex: number | null;
  participants: Participant[];
}
export interface Group {
  id: number;
  name: string;
  tournamentId: number;
  contestId: number;
  /** Class letter (A, B, C...). */
  letter?: string | null;
  contest: Contest;
  teams: Team[];
  matches: Match[];
}
export interface TournamentDetail extends Tournament { groups: Group[] }
/**
 * A match score, or a bonus scored once for the team (`part` other than 'match': attitude, pedagogique,
 * technologique; matchId is then 0). Both wait in the same outbox when offline.
 */
export interface ScoreSubmission {
  part?: EvalPart;
  matchId: number;
  teamId: number;
  answers: Answers;
  penalties: number;
  timeSeconds: number;
  /** For display in the pending list only. */
  label: string;
}

/** A score as kept on the tablet (see ApiService.localScores). */
export interface LocalScore extends ScoreSubmission {
  tournamentId: number;
  teamName: string;
  /** « Table 1 · 09:00 », or the bonus name. */
  what: string;
  score: number;
  savedAt: string;
  /** false while it waits in the outbox. */
  sent: boolean;
}

/** The team a referee's tablet follows during the half-day. */
export interface TabletTeam {
  tournamentId: number;
  teamId: number;
  teamName: string;
  contestId: number;
}

/** Same match for the same team, or the same bonus for the same team: the newer one replaces the older. */
export function sameSubmission(a: ScoreSubmission, b: ScoreSubmission): boolean {
  return a.teamId === b.teamId && (a.part ?? 'match') === (b.part ?? 'match') && a.matchId === b.matchId;
}

/** Thrown when the server could not be reached (as opposed to the server refusing the request). */
export class OfflineError extends Error {}

const read = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};
const write = (key: string, value: unknown) => localStorage.setItem(key, JSON.stringify(value));

/**
 * Online first: every GET goes to the server and its answer is cached.
 * Offline: GETs fall back to the cache and referee scores wait in an outbox, sent as soon as the network is back.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  readonly baseUrl = signal(read('apiUrl', 'Capacitor' in window ? environment.nativeApiUrl : environment.apiUrl));
  readonly session = signal(read<{ token: string; user: User } | null>('session', null));
  readonly user = computed(() => this.session()?.user ?? null);
  readonly outbox = signal(read<ScoreSubmission[]>('outbox', []));
  /** Every score saved on this tablet (sent or not): the team's results stay on the device all day. */
  readonly localScores = signal(read<LocalScore[]>('tabletScores', []));
  /** Team this tablet is attached to (the referee picks it once; the app then opens on it). */
  readonly tabletTeam = signal(read<TabletTeam | null>('tabletTeam', null));
  readonly online = signal(navigator.onLine);
  private flushing = false;

  constructor() {
    window.addEventListener('online', () => {
      this.online.set(true);
      void this.flush();
    });
    window.addEventListener('offline', () => this.online.set(false));
    setInterval(() => void this.flush(), 30_000);
    void this.flush();
  }

  setBaseUrl(url: string) {
    const clean = url.trim().replace(/\/+$/, '');
    this.baseUrl.set(clean);
    write('apiUrl', clean);
  }

  /** Mission images: uploaded ones live on the server, legacy ones ship with the app. */
  imageUrl(path?: string | null): string | null {
    if (!path) return null;
    return path.startsWith('/') ? this.baseUrl() + path : path;
  }

  async login(username: string, password: string): Promise<User> {
    return this.open(await this.request<{ token: string; user: User }>('POST', '/auth/login', { username, password }));
  }

  /** Referee access, no password (matches and attitude bonus). */
  async refereeLogin(): Promise<User> {
    return this.open(await this.request<{ token: string; user: User }>('POST', '/auth/referee'));
  }

  /** Poster / oral and technology bonuses: password only. */
  async bonusLogin(password: string): Promise<User> {
    return this.open(await this.request<{ token: string; user: User }>('POST', '/auth/bonus', { password }));
  }

  private open(session: { token: string; user: User }): User {
    this.session.set(session);
    write('session', session);
    void this.flush();
    return session.user;
  }

  logout() {
    this.session.set(null);
    localStorage.removeItem('session');
  }

  /** Server first, cache as fallback. Throws OfflineError only if nothing was ever cached. */
  async get<T>(path: string): Promise<T> {
    try {
      const data = await this.request<T>('GET', path);
      write('cache:' + path, data);
      return data;
    } catch (e) {
      const cached = read<T | null>('cache:' + path, null);
      if (e instanceof OfflineError && cached !== null) return cached;
      throw e;
    }
  }

  send<T>(method: 'POST' | 'PUT' | 'DELETE', path: string, body?: unknown): Promise<T> {
    return this.request<T>(method, path, body);
  }

  async upload(file: File): Promise<string> {
    const form = new FormData();
    form.append('file', file);
    return (await this.request<{ url: string }>('POST', '/uploads', form)).url;
  }

  /** Returns true if sent now, false if queued for later. */
  async submitScore(s: ScoreSubmission): Promise<boolean> {
    try {
      await this.postScore(s);
      return true;
    } catch (e) {
      if (!(e instanceof OfflineError)) throw e;
      this.setOutbox([...this.outbox().filter((o) => !sameSubmission(o, s)), s]);
      return false;
    }
  }

  async flush() {
    if (this.flushing || !this.outbox().length || !this.session()) return;
    this.flushing = true;
    try {
      for (const s of this.outbox()) {
        try {
          await this.postScore(s);
        } catch (e) {
          if (e instanceof OfflineError) break;
          // Refused by the server (match deleted...): keep it so nothing is lost silently, the home page shows it.
          if (e instanceof ApiError && e.status === 401) break;
          continue;
        }
        this.setOutbox(this.outbox().filter((o) => o !== s));
        this.markSent(s);
      }
    } finally {
      this.flushing = false;
    }
  }

  /** Keeps a copy of a score on the tablet; the newer score of the same match / bonus replaces the older one. */
  keepLocal(score: LocalScore) {
    const list = [score, ...this.localScores().filter((o) => !(o.tournamentId === score.tournamentId && sameSubmission(o, score)))].slice(0, 500);
    this.localScores.set(list);
    write('tabletScores', list);
  }

  /** Marks the tablet copy of a score as received by the server. */
  markSent(s: ScoreSubmission) {
    const list = this.localScores().map((o) => (sameSubmission(o, s) && !o.sent ? { ...o, sent: true } : o));
    this.localScores.set(list);
    write('tabletScores', list);
  }

  setTabletTeam(team: TabletTeam | null) {
    this.tabletTeam.set(team);
    if (team) write('tabletTeam', team);
    else localStorage.removeItem('tabletTeam');
  }

  discardPending(s: ScoreSubmission) {
    this.setOutbox(this.outbox().filter((o) => o !== s));
  }

  private postScore({ matchId, label: _label, part, ...body }: ScoreSubmission) {
    if (part && part !== 'match') return this.request('POST', `/teams/${body.teamId}/evaluations`, { part, answers: body.answers });
    return this.request('POST', `/matches/${matchId}/scores`, body);
  }

  private setOutbox(list: ScoreSubmission[]) {
    this.outbox.set(list);
    write('outbox', list);
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const headers: Record<string, string> = {};
    const token = this.session()?.token;
    if (token) headers['Authorization'] = 'Bearer ' + token;
    const isForm = body instanceof FormData;
    if (body !== undefined && !isForm) headers['Content-Type'] = 'application/json';

    let res: Response;
    // 10 s at most. Not AbortSignal.timeout(): it only exists since Chrome 103, and on older tablets every call
    // failed with « Serveur injoignable ». AbortController works from Chrome 66.
    const controller = typeof AbortController === 'function' ? new AbortController() : null;
    const timer = setTimeout(() => controller?.abort(), 10_000);
    try {
      res = await fetch(this.baseUrl() + path, {
        method,
        headers,
        body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
        signal: controller?.signal,
      });
      this.online.set(true);
    } catch {
      this.online.set(false);
      throw new OfflineError('Serveur injoignable');
    } finally {
      clearTimeout(timer);
    }
    // Without network the service worker answers 504 instead of failing: that is "offline", not a refusal
    // (otherwise a score typed during a network cut would be lost instead of waiting in the outbox).
    if (res.status === 502 || res.status === 503 || res.status === 504) {
      this.online.set(false);
      throw new OfflineError('Serveur injoignable');
    }
    const data = res.status === 204 ? null : await res.json().catch(() => null);
    if (!res.ok) {
      if (res.status === 401 && token) this.logout();
      const msg = data?.message;
      throw new ApiError(res.status, Array.isArray(msg) ? msg.join('\n') : msg || `Erreur ${res.status}`);
    }
    return data as T;
  }
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Local history of training sheets (no server involved). */
export interface PracticeRun {
  /** Server contest id, or the key of a built-in contest (e.g. "mars2-cycle3"). */
  contestId: number | string;
  contestName: string;
  team: string;
  total: number;
  timeSeconds: number;
  date: string;
}
export const practiceHistory = {
  list: () => read<PracticeRun[]>('practice', []),
  add: (run: PracticeRun) => write('practice', [run, ...practiceHistory.list()].slice(0, 200)),
  clear: () => localStorage.removeItem('practice'),
};

export const FINALS_GROUP = 'Phase finale';

/** Team code: class letter + team number (A1, B3...), or '' when not set. */
export function teamCode(group: { letter?: string | null } | null | undefined, team: { number?: number | null }): string {
  return group?.letter && team.number ? `${group.letter}${team.number}` : '';
}

/** Best match of a team in its group (time splits equal scores when the sheet says so). null = no match scored. */
export function bestMatch(g: Group, team: Team): Participant | null {
  const tie = !!g.contest?.sheet?.timeTiebreak;
  const scored = g.matches.flatMap((m) => m.participants).filter((p) => p.teamId === team.id && p.score !== null);
  return [...scored].sort((a, b) => compareResults(a, b, tie))[0] ?? null;
}

export interface RankedTeam {
  team: Team;
  group: Group;
  code: string;
  best: number | null;
  bonus: number;
  final: number | null;
  timeSeconds: number | null;
  /** Best team of its class: the one that represents the class on the podium. */
  classBest: boolean;
}

/**
 * Ranking of one contest in a half-day: every team on its final score (best match + bonuses), ties split by the time
 * of the best match when the sheet says so. The podium keeps only the best team of each class (group):
 * a class may hold the top scores, only one team represents it.
 */
export function rankContest(groups: Group[]): { all: RankedTeam[]; podium: RankedTeam[] } {
  const tie = !!groups[0]?.contest?.sheet?.timeTiebreak;
  const all = groups
    .flatMap((g) =>
      g.teams.map((team) => {
        const top = bestMatch(g, team);
        const bonus = (team.evaluations ?? []).reduce((sum, e) => sum + e.score, 0);
        return { team, group: g, code: teamCode(g, team), best: top?.score ?? null, bonus, final: teamFinal(g, team), timeSeconds: top?.timeSeconds ?? null, classBest: false };
      }),
    )
    .sort((a, b) => compareResults({ score: a.final, timeSeconds: a.timeSeconds }, { score: b.final, timeSeconds: b.timeSeconds }, tie) || a.code.localeCompare(b.code, 'fr', { numeric: true }));
  const seen = new Set<number>();
  for (const r of all) {
    if (r.final !== null && !seen.has(r.group.id)) {
      seen.add(r.group.id);
      r.classBest = true;
    }
  }
  return { all, podium: all.filter((r) => r.classBest) };
}

/** Final score of a team: its best match + the bonuses scored once (attitude, pedagogique, technologique). */
export function teamFinal(g: Group, team: Team): number | null {
  return finalScore(bestMatch(g, team)?.score ?? null, (team.evaluations ?? []).map((e) => e.score));
}
export const roundName = (round: number) =>
  ({ 1: 'Finale', 2: 'Demi-finales', 3: 'Quarts de finale', 4: 'Huitièmes de finale' })[round] ?? `Tour ${round}`;
/** Matches and the attitude bonus: the referees (and admins). */
export const canScore = (u: User | null) => u?.role === 'REFEREE' || u?.role === 'ADMIN';
/** Poster / oral and technology bonuses: the bonus evaluators (and admins). */
export const canScoreBonus = (u: User | null) => u?.role === 'EVALUATOR' || u?.role === 'ADMIN';
/** Who may open a team's evaluation menu. */
export const canEvaluate = (u: User | null) => canScore(u) || canScoreBonus(u);
/** Parts of a team this user scores. */
export const partsFor = (u: User | null): EvalPart[] =>
  u?.role === 'ADMIN' ? ['match', 'attitude', 'pedagogique', 'technologique'] : u?.role === 'REFEREE' ? ['match', 'attitude'] : u?.role === 'EVALUATOR' ? ['pedagogique', 'technologique'] : [];

export const formatTime = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
