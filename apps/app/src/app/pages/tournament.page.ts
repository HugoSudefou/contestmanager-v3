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
import { ApiService, FINALS_GROUP, canScore, teamFinal, type Group, type Match, type Participant, type Team, type TournamentDetail } from '../api.service';
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
          <ion-searchbar placeholder="Rechercher mon équipe" [value]="search()" (ionInput)="search.set($any($event).detail.value ?? '')"></ion-searchbar>
        </ion-toolbar>
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
          @if (!canScore(api.user())) {
            <div class="ion-padding">
              <p>Connectez-vous en arbitre pour noter les matchs.</p>
              <ion-button expand="block" routerLink="/login" [queryParams]="{ redirect: currentUrl }">Connexion arbitre</ion-button>
            </div>
          }
          @if (view() === 'teams') {
            <p class="ion-padding-horizontal hint">Choisissez l'équipe, puis ce que vous évaluez : ses matchs, son attitude ou un bonus.</p>
            <ion-list>
              @for (t of teams(); track t.id) {
                <ion-item button detail="true" [disabled]="!canScore(api.user())" (click)="evaluate(t)">
                  <ion-label>
                    <h2>{{ t.name }}</h2>
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
  styles: `.hint { color: var(--ion-color-medium-shade); font-size: 0.9rem; } .teams { display: flex; flex-wrap: wrap; margin-top: 4px; } .teams > * { margin: 0 4px 4px 0; }`,
})
export class TournamentPage implements ViewWillEnter {
  api = inject(ApiService);
  private router = inject(Router);
  id = input.required<string>();
  mode = input<'referee' | 'team'>('team');
  canScore = canScore;
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
      .flatMap((g) => g.teams.map((t) => ({ ...t, group: g.name, contestId: g.contestId, final: teamFinal(g, t) })))
      .filter((t) => !q || `${t.name} ${t.school?.name ?? ''}`.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  /** Back from the sheet: show the new score. */
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
  evaluate(t: Team & { contestId: number }) {
    void this.router.navigate(['/evaluate', t.contestId], { queryParams: { team: t.id, teamName: t.name, tournament: this.id() } });
  }

  score(g: Group, m: Match, p: Participant) {
    void this.router.navigate(['/sheet', g.contestId], {
      queryParams: { match: m.id, team: p.teamId, teamName: p.team.name, tournament: this.id() },
    });
  }
}
