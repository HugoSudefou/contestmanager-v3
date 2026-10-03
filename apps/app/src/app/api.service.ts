import { Injectable, computed, signal } from '@angular/core';
import type { Answers, Sheet } from '@contest/scoring';
import { environment } from '../environments/environment';

export type Role = 'ADMIN' | 'REFEREE';
export interface User { id: number; username: string; role: Role }
export interface Contest {
  id: number;
  name: string;
  season: string;
  description: string | null;
  sheet: Sheet;
  published: boolean;
}
export interface Tournament { id: number; name: string; date: string | null; location: string | null }
export interface Team { id: number; name: string; school: string | null; members: string | null; groupId: number }
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
  participants: Participant[];
}
export interface Group {
  id: number;
  name: string;
  tournamentId: number;
  contestId: number;
  contest: Contest;
  teams: Team[];
  matches: Match[];
}
export interface TournamentDetail extends Tournament { groups: Group[] }
export interface ScoreSubmission {
  matchId: number;
  teamId: number;
  answers: Answers;
  penalties: number;
  timeSeconds: number;
  /** For display in the pending list only. */
  label: string;
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
    const session = await this.request<{ token: string; user: User }>('POST', '/auth/login', { username, password });
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
      this.setOutbox([...this.outbox().filter((o) => !(o.matchId === s.matchId && o.teamId === s.teamId)), s]);
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
      }
    } finally {
      this.flushing = false;
    }
  }

  discardPending(s: ScoreSubmission) {
    this.setOutbox(this.outbox().filter((o) => o !== s));
  }

  private postScore({ matchId, label: _label, ...body }: ScoreSubmission) {
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
    try {
      res = await fetch(this.baseUrl() + path, {
        method,
        headers,
        body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
        signal: AbortSignal.timeout(10_000),
      });
      this.online.set(true);
    } catch {
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
  contestId: number;
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

export const formatTime = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
