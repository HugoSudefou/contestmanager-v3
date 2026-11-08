import { Component, computed, inject, input, resource } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonBackButton,
  IonBadge,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonNote,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
  type ViewWillEnter,
} from '@ionic/angular';
import { EVAL_PARTS, compareResults, finalScore, partsOf, type EvalPart } from '@contest/scoring';
import { ApiService, canEvaluate, formatTime, partsFor, teamCode, type BuiltinContest, type Contest, type Match, type Team } from '../api.service';
import { builtinContest } from '../builtin-contests';

interface TeamDetail extends Team {
  group: { id: number; name: string; letter: string | null };
  participations: { id: number; score: number | null; timeSeconds: number | null; match: Match }[];
}

/**
 * Menu shown before the mission sheet: whoever holds the tablet chooses what they evaluate for the team.
 * - Matchs: the referee, at each match (only the best match counts);
 * - Bonus Attitude: the referee, once the team's matches are over;
 * - Bonus pédagogique: the educational advisers; Bonus technologique: the digital-education referents.
 * Tournament: query params team / teamName / tournament. Training (built-in contest, offline): no team.
 */
@Component({
  selector: 'app-evaluate',
  imports: [
    DatePipe,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonButton,
    IonContent,
    IonCard,
    IonCardContent,
    IonList,
    IonListHeader,
    IonItem,
    IonLabel,
    IonNote,
    IonBadge,
    IonSpinner,
    IonText,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start"><ion-back-button [defaultHref]="backUrl()"></ion-back-button></ion-buttons>
        <ion-title>{{ title() }}</ion-title>
        @if (tabletTeam()) {
          <ion-buttons slot="end"><ion-button (click)="changeTeam()">Changer d'équipe</ion-button></ion-buttons>
        }
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="narrow">
        @if (contest.isLoading() && !contest.hasValue()) {
          <div class="ion-text-center ion-padding"><ion-spinner></ion-spinner></div>
        } @else if (contest.error()) {
          <ion-text color="danger"><p class="ion-padding">{{ contest.error()?.message }}</p></ion-text>
        } @else if (!canEvaluate(api.user())) {
          <div class="ion-padding">
            <p>Connectez-vous pour évaluer cette équipe.</p>
            <ion-button expand="block" (click)="login()">Connexion</ion-button>
          </div>
        } @else if (contest.value(); as c) {
          <ion-card>
            <ion-card-content>
              @if (team.value(); as t) {
                <p class="who">{{ t.group.name }}</p>
              }
              <p><strong>Que voulez-vous évaluer pour cette équipe ?</strong></p>
              <p>{{ c.name }}</p>
              @if (tabletTeam()) { <p class="hint">Cette tablette suit cette équipe toute la demi-journée.</p> }
              @if (final() !== null) {
                <p class="final">Score final : {{ final() }} pts <ion-note>(meilleur match + bonus)</ion-note></p>
              }
            </ion-card-content>
          </ion-card>

          @if (mine().includes('match')) {
          <ion-list>
            <ion-list-header>
              <ion-label>
                <h2>Matchs</h2>
                <p>L'arbitre, à chaque match. Seul le meilleur match compte.</p>
              </ion-label>
            </ion-list-header>
            @if (teamId()) {
              @if (team.hasValue()) {
                @for (p of team.value().participations; track p.id) {
                  <ion-item button (click)="open('match', p.match.id, matchLabel(p.match, $index))" detail="true">
                    <ion-label>
                      <h3>
                        @if (p.match.tableNumber) { Table {{ p.match.tableNumber }} · }
                        {{ p.match.scheduledAt ? (p.match.scheduledAt | date: 'HH:mm') : 'Match ' + ($index + 1) }}
                      </h3>
                      @if (best()?.id === p.id) { <p>Meilleur match</p> }
                    </ion-label>
                    @if (pending('match', p.match.id)) {
                      <ion-badge slot="end" color="warning">en attente d'envoi</ion-badge>
                    } @else if (p.score !== null) {
                      <ion-badge slot="end" [color]="best()?.id === p.id ? 'success' : 'medium'">{{ p.score }} pts{{ p.timeSeconds ? ' · ' + time(p.timeSeconds) : '' }}</ion-badge>
                    } @else if (local('match', p.match.id); as l) {
                      <ion-badge slot="end" color="tertiary">{{ l.score }} pts (tablette)</ion-badge>
                    } @else {
                      <ion-note slot="end">À noter</ion-note>
                    }
                  </ion-item>
                } @empty {
                  <ion-item><ion-note>Aucun match programmé pour cette équipe.</ion-note></ion-item>
                }
              } @else if (team.isLoading()) {
                <div class="ion-text-center ion-padding"><ion-spinner></ion-spinner></div>
              }
            } @else {
              <ion-item button (click)="open('match')" detail="true">
                <ion-label><h3>Feuille de match</h3><p>Missions, pénalités et chrono</p></ion-label>
              </ion-item>
            }
          </ion-list>

          }

          @if (mine().includes('attitude')) {
            <div class="ion-padding-horizontal">
              <ion-button expand="block" color="secondary" class="done" (click)="open('attitude')">
                <span class="wrap">Évaluation des matchs terminée : l'arbitre passe à l'évaluation de l'attitude de l'équipe</span>
              </ion-button>
            </div>
          }

          @if (bonuses().length) {
            <ion-list>
              <ion-list-header><ion-label><h2>Bonus</h2><p>Évalués une seule fois pour l'équipe.</p></ion-label></ion-list-header>
              @for (b of bonuses(); track b.part) {
                <ion-item button (click)="open(b.part)" detail="true">
                  <ion-label class="ion-text-wrap">
                    <h3>{{ b.title }}</h3>
                    <p>{{ b.who }}</p>
                  </ion-label>
                  @if (pending(b.part)) {
                    <ion-badge slot="end" color="warning">en attente d'envoi</ion-badge>
                  } @else if (bonusScore(b.part) !== null) {
                    <ion-badge slot="end" color="success">{{ bonusScore(b.part) }} pts</ion-badge>
                  } @else if (local(b.part); as l) {
                    <ion-badge slot="end" color="tertiary">{{ l.score }} pts (tablette)</ion-badge>
                  } @else if (teamId()) {
                    <ion-note slot="end">À évaluer</ion-note>
                  }
                </ion-item>
              }
            </ion-list>
          }

          @if (kept().length) {
            <ion-list>
              <ion-list-header><ion-label><h2>Scores gardés sur cette tablette</h2><p>Une copie de chaque score enregistré ici, même sans réseau.</p></ion-label></ion-list-header>
              @for (k of kept(); track k.savedAt) {
                <ion-item>
                  <ion-label>
                    <h3>{{ k.what }}</h3>
                    <p>{{ k.savedAt | date: 'HH:mm' }} · @if (k.sent) { envoyé } @else { en attente d’envoi }</p>
                  </ion-label>
                  <ion-note slot="end">{{ k.score }} pts</ion-note>
                </ion-item>
              }
            </ion-list>
          }
        }
      </div>
    </ion-content>
  `,
  styles: `
    .final { font-size: 1.15rem; font-weight: bold; margin-top: 8px; color: var(--ion-color-dark); }
    .done { text-transform: none; font-size: 1rem; height: auto; min-height: 48px; --padding-top: 10px; --padding-bottom: 10px; margin: 8px 0 16px; }
    .wrap { white-space: normal; line-height: 1.3; }
    .who { color: var(--ion-color-medium-shade); }
    .hint { color: var(--ion-color-medium-shade); font-size: 0.85rem; }
  `,
})
export class EvaluatePage implements ViewWillEnter {
  api = inject(ApiService);
  private router = inject(Router);

  contestId = input.required<string>();
  team = resource({
    params: () => this.teamId() || undefined,
    loader: ({ params }) => this.api.get<TeamDetail>(`/teams/${params}`),
  });
  // Query params (tournament mode).
  teamParam = input<string>(undefined, { alias: 'team' });
  teamName = input<string>();
  tournament = input<string>();
  teamId = computed(() => Number(this.teamParam()) || null);

  contest = resource({
    params: () => this.contestId(),
    loader: ({ params }): Promise<Contest | BuiltinContest> => {
      const builtin = builtinContest(params);
      return builtin ? Promise.resolve(builtin) : this.api.get<Contest>(`/contests/${params}`);
    },
  });

  parts = computed<EvalPart[]>(() => (this.contest.hasValue() ? partsOf(this.contest.value().sheet) : ['match']));
  canEvaluate = canEvaluate;
  /** Parts this person scores: referee = matches + attitude; bonus evaluator = poster / oral + technology; admin = all. */
  mine = computed(() => partsFor(this.api.user()).filter((p) => this.parts().includes(p)));
  bonuses = computed(() => EVAL_PARTS.filter((p) => p.part !== 'match' && this.mine().includes(p.part)));
  /** Attached to this tablet (referees): the app opens on this team. */
  tabletTeam = computed(() => {
    const t = this.api.tabletTeam();
    return t && t.teamId === this.teamId() ? t : null;
  });
  /** The team name comes with its code from the tournament page (« A1 · Les Astronautes »). */
  title = computed(() => {
    if (this.teamName()) return this.teamName()!;
    const t = this.team.hasValue() ? this.team.value() : null;
    return t ? [teamCode(t.group, t), t.name].filter(Boolean).join(' · ') : 'Évaluation';
  });
  /** Scores of this team kept on the tablet, newest first. */
  kept = computed(() => this.api.localScores().filter((k) => k.teamId === this.teamId() && String(k.tournamentId) === this.tournament()));
  backUrl = computed(() => (this.tournament() ? `/tournament/${this.tournament()}?mode=referee` : '/training'));

  best = computed(() => {
    if (!this.team.hasValue()) return null;
    const tie = this.contest.hasValue() && !!this.contest.value().sheet.timeTiebreak;
    const scored = this.team.value().participations.filter((p) => p.score !== null);
    return [...scored].sort((a, b) => compareResults(a, b, tie))[0] ?? null;
  });

  final = computed(() => {
    if (!this.team.hasValue()) return null;
    return finalScore(this.best()?.score ?? null, (this.team.value().evaluations ?? []).map((e) => e.score));
  });

  /** Back from the sheet: show the new scores. */
  ionViewWillEnter() {
    if (this.team.hasValue()) this.team.reload();
    // A referee's tablet follows the team it opened.
    if (this.api.user()?.role === 'REFEREE' && this.teamId() && this.tournament()) {
      this.api.setTabletTeam({ tournamentId: Number(this.tournament()), teamId: this.teamId()!, teamName: this.teamName() ?? '', contestId: Number(this.contestId()) });
    }
  }

  local(part: EvalPart, matchId = 0) {
    return this.kept().find((k) => (k.part ?? 'match') === part && k.matchId === matchId) ?? null;
  }

  matchLabel(m: Match, index: number) {
    return [m.tableNumber ? `Table ${m.tableNumber}` : '', m.scheduledAt ? new Date(m.scheduledAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : `Match ${index + 1}`]
      .filter(Boolean)
      .join(' · ');
  }

  changeTeam() {
    this.api.setTabletTeam(null);
    void this.router.navigate(['/tournament', this.tournament()], { queryParams: { mode: 'referee' }, replaceUrl: true });
  }

  login() {
    void this.router.navigate(['/login'], { queryParams: { redirect: this.router.url } });
  }

  bonusScore(part: EvalPart): number | null {
    if (!this.team.hasValue()) return null;
    return this.team.value().evaluations?.find((e) => e.part === part)?.score ?? null;
  }

  pending(part: EvalPart, matchId = 0) {
    const teamId = this.teamId();
    return !!teamId && this.api.outbox().some((s) => s.teamId === teamId && (s.part ?? 'match') === part && s.matchId === matchId);
  }

  time = formatTime;

  open(part: EvalPart, matchId?: number, matchLabel?: string) {
    const queryParams: Record<string, string | number> = { part };
    if (matchLabel) queryParams['matchLabel'] = matchLabel;
    if (this.teamId()) Object.assign(queryParams, { team: this.teamId()!, teamName: this.teamName() ?? '', tournament: this.tournament() ?? '' });
    if (matchId) queryParams['match'] = matchId;
    void this.router.navigate(['/sheet', this.contestId()], { queryParams });
  }
}
