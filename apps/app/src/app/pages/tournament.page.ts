import { Component, computed, inject, input, resource, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonNote,
  IonRefresher,
  IonRefresherContent,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
  ViewWillEnter,
} from '@ionic/angular';
import { ApiService, FINALS_GROUP, canEvaluate, canScore, rankContest, teamCode, teamFinal, type Group, type Match, type Participant, type Team, type TournamentDetail } from '../api.service';
import { BracketComponent } from '../bracket.component';

@Component({
  selector: 'app-tournament',
  imports: [
    DatePipe,
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonButton,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonNote,
    IonSpinner,
    IonText,
    IonListHeader,
    IonSearchbar,
    IonSegment,
    IonSegmentButton,
    IonRefresher,
    IonRefresherContent,
    BracketComponent,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start"><ion-back-button defaultHref="/tournaments"></ion-back-button></ion-buttons>
        <ion-title>{{ data.hasValue() ? data.value().name : 'Tournoi' }}</ion-title>
      </ion-toolbar>
      @if (mode() === 'team') {
        <ion-toolbar>
          <ion-segment [value]="publicView()" (ionChange)="publicView.set($any($event.detail.value))">
            <ion-segment-button value="ranking"><ion-label>Classement</ion-label></ion-segment-button>
            <ion-segment-button value="teams"><ion-label>Équipes</ion-label></ion-segment-button>
          </ion-segment>
        </ion-toolbar>
        @if (publicView() === 'teams') {
          <ion-toolbar>
            <ion-searchbar placeholder="Rechercher mon équipe" [value]="search()" (ionInput)="search.set($any($event).detail.value ?? '')"></ion-searchbar>
          </ion-toolbar>
        }
      } @else {
        <ion-toolbar>
          <ion-segment [value]="view()" (ionChange)="view.set($any($event.detail.value))">
            <ion-segment-button value="teams"><ion-label>Équipes</ion-label></ion-segment-button>
            <ion-segment-button value="todo"><ion-label>À noter</ion-label></ion-segment-button>
            <ion-segment-button value="all"><ion-label>Tous</ion-label></ion-segment-button>
          </ion-segment>
        </ion-toolbar>
        @if (view() === 'teams') {
          <ion-toolbar>
            <ion-searchbar placeholder="Rechercher l'équipe à évaluer" [value]="search()" (ionInput)="search.set($any($event).detail.value ?? '')"></ion-searchbar>
          </ion-toolbar>
        }
      }
    </ion-header>
    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="data.reload(); $any($event).target.complete()">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>
      <div class="narrow">
        @if (data.isLoading() && !data.hasValue()) {
          <div class="ion-text-center ion-padding"><ion-spinner></ion-spinner></div>
        } @else if (data.error()) {
          <ion-text color="danger"><p class="ion-padding">{{ data.error()?.message }}</p></ion-text>
        } @else if (mode() === 'referee') {
          @if (!canEvaluate(api.user())) {
            <div class="ion-padding">
              <p>Connectez-vous pour évaluer les équipes.</p>
              <ion-button expand="block" routerLink="/login" [queryParams]="{ redirect: currentUrl }">Connexion</ion-button>
            </div>
          }
          @if (followed(); as f) {
            <div class="ion-padding-horizontal">
              <ion-button expand="block" (click)="evaluate(f)"><span class="wrap">Cette tablette suit {{ f.code ? f.code + ' · ' : '' }}{{ f.name }} : ouvrir</span></ion-button>
            </div>
          }
          @if (view() === 'teams') {
            <p class="ion-padding-horizontal hint">Choisissez l'équipe, puis ce que vous évaluez : ses matchs, son attitude ou un bonus.</p>
            <ion-list>
              @for (t of teams(); track t.id) {
                <ion-item button detail="true" [disabled]="!canEvaluate(api.user())" (click)="evaluate(t)">
                  <ion-label>
                    <h2>@if (t.code) { <strong>{{ t.code }}</strong> · }{{ t.name }}</h2>
                    <p>{{ t.group }}{{ t.school ? ' · ' + t.school.name : '' }}</p>
                  </ion-label>
                  @if (t.final !== null) { <ion-note slot="end">{{ t.final }} pts</ion-note> }
                </ion-item>
              } @empty {
                <ion-item><ion-note>Aucune équipe trouvée.</ion-note></ion-item>
              }
            </ion-list>
          } @else {
            @for (g of data.value()?.groups; track g.id) {
                <ion-list>
                  <ion-list-header><ion-label>{{ g.name }} <ion-note>· {{ g.contest.name }}</ion-note></ion-label></ion-list-header>
                  @for (m of visibleMatches(g); track m.id) {
                    <ion-item lines="full">
                      <ion-label>
                        <h3>
                          @if (m.tableNumber) { Table {{ m.tableNumber }} · }
                          {{ m.scheduledAt | date: 'HH:mm' }}
                        </h3>
                        <div class="teams">
                          @for (p of m.participants; track p.id) {
                            <ion-button size="small" [fill]="p.score === null && !pending(m, p) ? 'solid' : 'outline'" [color]="pending(m, p) ? 'warning' : 'primary'" [disabled]="!canScore(api.user())" (click)="score(g, m, p)">
                              {{ label(m, p) }}
                            </ion-button>
                          }
                        </div>
                      </ion-label>
                    </ion-item>
                  } @empty {
                    <ion-item><ion-note>Aucun match {{ showDone() ? '' : 'à noter' }}.</ion-note></ion-item>
                  }
                </ion-list>
            }
          }
        } @else if (publicView() === 'ranking') {
          <p class="ion-padding-horizontal hint">En direct · mis à jour {{ updatedAt() }} · score final = meilleur match + bonus (attitude, pédagogique, technologique).</p>
          @if (finals(); as f) {
            <ion-list-header><ion-label>Finale</ion-label></ion-list-header>
            <app-bracket [matches]="f.matches" [timeTiebreak]="!!f.contest.sheet.timeTiebreak"></app-bracket>
          }
          @for (c of rankings(); track c.contestId) {
            <ion-list>
              <ion-list-header>
                <ion-label>
                  <h2>{{ c.name }}</h2>
                  <p>Podium : la meilleure équipe de chaque classe</p>
                </ion-label>
              </ion-list-header>
              @for (r of c.podium; track r.team.id; let i = $index) {
                <ion-item>
                  <div slot="start" class="rank" [class.top]="i < 3">{{ i + 1 }}</div>
                  <ion-label class="ion-text-wrap">
                    <h2>@if (r.code) { <strong>{{ r.code }}</strong> · }{{ r.team.name }}</h2>
                    <p>{{ r.group.name }}</p>
                  </ion-label>
                  <ion-note slot="end" class="pts"><strong>{{ r.final }} pts</strong><br /><small>match {{ r.best ?? '—' }} + bonus {{ r.bonus }}</small></ion-note>
                </ion-item>
              } @empty {
                <ion-item><ion-note>Aucun score pour l'instant.</ion-note></ion-item>
              }
            </ion-list>
            <details class="ion-padding-horizontal all">
              <summary>Toutes les équipes ({{ c.all.length }})</summary>
              <ion-list>
                @for (r of c.all; track r.team.id; let i = $index) {
                  <ion-item>
                    <div slot="start" class="rank small">{{ r.final === null ? '—' : i + 1 }}</div>
                    <ion-label class="ion-text-wrap">
                      <h3>@if (r.code) { <strong>{{ r.code }}</strong> · }{{ r.team.name }} @if (r.classBest) { <span class="star" title="Meilleure équipe de sa classe">★</span> }</h3>
                      <p>{{ r.group.name }}</p>
                    </ion-label>
                    <ion-note slot="end" class="pts">{{ r.final === null ? '—' : r.final + ' pts' }}@if (r.final !== null) {<br /><small>match {{ r.best ?? '—' }} + bonus {{ r.bonus }}</small>}</ion-note>
                  </ion-item>
                }
              </ion-list>
            </details>
          }
        } @else {
          @if (finals(); as f) {
            <ion-list-header><ion-label>Phase finale</ion-label></ion-list-header>
            <app-bracket [matches]="f.matches" [timeTiebreak]="!!f.contest.sheet.timeTiebreak"></app-bracket>
          }
          <ion-list>
            @for (t of teams(); track t.id) {
              <ion-item button [routerLink]="['/team', t.id]">
                <ion-label>
                  <h2>{{ t.name }}</h2>
                  <p>{{ t.group }}{{ t.school ? ' · ' + t.school.name : '' }}</p>
                </ion-label>
              </ion-item>
            } @empty {
              <ion-item><ion-note>Aucune équipe trouvée.</ion-note></ion-item>
            }
          </ion-list>
        }
      </div>
    </ion-content>
  `,
  styles: `.rank { width: 32px; height: 32px; border-radius: 50%; background: var(--ion-color-step-150, #e0e0e0); display: flex; align-items: center; justify-content: center; font-weight: bold; }
    .rank.top { background: var(--ion-color-warning); color: #000; }
    .rank.small { width: 26px; height: 26px; font-size: 0.85rem; background: transparent; }
    .pts { text-align: right; }
    .star { color: var(--ion-color-warning-shade); }
    .all { margin: 4px 0 16px; }
    .all summary { cursor: pointer; padding: 8px 0; color: var(--ion-color-primary); }
    .wrap { white-space: normal; } .hint { color: var(--ion-color-medium-shade); font-size: 0.9rem; } .teams { display: flex; flex-wrap: wrap; margin-top: 4px; } .teams > * { margin: 0 4px 4px 0; }`,
})
export class TournamentPage implements ViewWillEnter {
  api = inject(ApiService);
  private router = inject(Router);
  id = input.required<string>();
  mode = input<'referee' | 'team'>('team');
  canScore = canScore;
  canEvaluate = canEvaluate;

  /** Team this tablet follows in this tournament (referees). */
  followed = computed(() => {
    const t = this.api.tabletTeam();
    if (!t || String(t.tournamentId) !== this.id()) return null;
    return this.teams().find((x) => x.id === t.teamId) ?? null;
  });
  search = signal('');
  /** Referee mode: by team (then the evaluation menu), matches still to score, or all matches. */
  view = signal<'teams' | 'todo' | 'all'>('teams');
  showDone = computed(() => this.view() === 'all');
  currentUrl = this.router.url;

  data = resource({
    params: () => this.id(),
    loader: ({ params }) => this.api.get<TournamentDetail>(`/tournaments/${params}`),
  });

  finals = computed(() => (this.data.hasValue() ? this.data.value().groups.find((g) => g.name === FINALS_GROUP) : undefined));

  teams = computed(() => {
    const q = this.search().trim().toLowerCase();
    return (this.data.hasValue() ? this.data.value().groups : [])
      .filter((g) => g.name !== FINALS_GROUP)
      .flatMap((g) => g.teams.map((t) => ({ ...t, group: g.name, code: teamCode(g, t), contestId: g.contestId, final: teamFinal(g, t) })))
      .filter((t) => !q || `${t.code} ${t.name} ${t.group} ${t.school?.name ?? ''}`.toLowerCase().includes(q))
      .sort((a, b) => a.code.localeCompare(b.code, 'fr', { numeric: true }) || a.name.localeCompare(b.name));
  });

  /** Back from the sheet: show the new score. */
  /** Public page: ranking (live) or the team list. */
  publicView = signal<'ranking' | 'teams'>('ranking');
  updatedAt = signal('');
  private live?: ReturnType<typeof setInterval>;

  /** One ranking per contest (cycle 2, cycle 3...) of the half-day, the final group left out. */
  rankings = computed(() => {
    const groups = (this.data.hasValue() ? this.data.value().groups : []).filter((g) => g.name !== FINALS_GROUP);
    const byContest = new Map<number, Group[]>();
    for (const g of groups) byContest.set(g.contestId, [...(byContest.get(g.contestId) ?? []), g]);
    return [...byContest.entries()].map(([contestId, gs]) => ({ contestId, name: gs[0].contest.name, ...rankContest(gs) }));
  });

  /** Scores come in all through the half-day: the public page refreshes itself every 20 s. */
  ionViewDidEnter() {
    this.updatedAt.set(new Date().toLocaleTimeString('fr-FR'));
    if (this.mode() === 'team') {
      this.live = setInterval(() => {
        this.data.reload();
        this.updatedAt.set(new Date().toLocaleTimeString('fr-FR'));
      }, 20_000);
    }
  }

  ionViewWillLeave() {
    clearInterval(this.live);
  }

  ionViewWillEnter() {
    if (this.data.hasValue()) this.data.reload();
  }

  /** Scores still waiting in the outbox count as done, so a referee offline does not score twice. */
  visibleMatches(g: Group): Match[] {
    if (this.showDone()) return g.matches;
    return g.matches.filter((m) => m.participants.some((p) => p.score === null && !this.pending(m, p)));
  }

  label(m: Match, p: Participant) {
    if (this.pending(m, p)) return `${p.team.name} · en attente d'envoi`;
    return p.score === null ? p.team.name : `${p.team.name} · ${p.score} pts`;
  }

  pending(m: Match, p: Participant) {
    return this.api.outbox().some((s) => s.matchId === m.id && s.teamId === p.teamId);
  }

  /** Evaluation menu of the team: matches, attitude, educational and technology bonuses. */
  evaluate(t: Team & { contestId: number; code?: string }) {
    const teamName = t.code ? `${t.code} · ${t.name}` : t.name;
    void this.router.navigate(['/evaluate', t.contestId], { queryParams: { team: t.id, teamName, tournament: this.id() } });
  }

  score(g: Group, m: Match, p: Participant) {
    void this.router.navigate(['/sheet', g.contestId], {
      queryParams: { match: m.id, team: p.teamId, teamName: p.team.name, tournament: this.id() },
    });
  }
}
