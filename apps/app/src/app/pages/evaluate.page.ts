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
import { ApiService, formatTime, type BuiltinContest, type Contest, type Match, type Team } from '../api.service';
import { builtinContest } from '../builtin-contests';

interface TeamDetail extends Team {
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
        <ion-title>{{ teamName() || (contest.hasValue() && contest.value().name) || 'Évaluation' }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="narrow">
        @if (contest.isLoading() && !contest.hasValue()) {
          <div class="ion-text-center ion-padding"><ion-spinner></ion-spinner></div>
        } @else if (contest.error()) {
          <ion-text color="danger"><p class="ion-padding">{{ contest.error()?.message }}</p></ion-text>
        } @else if (contest.value(); as c) {
          <ion-card>
            <ion-card-content>
              <p><strong>{{ teamName() ? 'Que voulez-vous évaluer pour cette équipe ?' : 'Que voulez-vous évaluer ?' }}</strong></p>
              <p>{{ c.name }}</p>
              @if (final() !== null) {
                <p class="final">Score final : {{ final() }} pts <ion-note>(meilleur match + bonus)</ion-note></p>
              }
            </ion-card-content>
          </ion-card>

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
                  <ion-item button (click)="open('match', p.match.id)" detail="true">
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

          @if (parts().includes('attitude')) {
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
                  } @else if (teamId()) {
                    <ion-note slot="end">À évaluer</ion-note>
                  }
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
  bonuses = computed(() => EVAL_PARTS.filter((p) => p.part !== 'match' && this.parts().includes(p.part)));
  backUrl = computed(() => (this.tournament() ? `/tournament/${this.tournament()}?mode=referee` : '/training'));

  best = computed(() => {
    if (!this.team.hasValue()) return null;
    const tie = this.contest.hasValue() && !!this.contest.value().sheet.timeTiebreak;
    const scored = this.team.value().participations.filter((p) => p.score !== null);
    return [...scored].sort((a, b) => compareResults(a, b, tie))[0] ?? null;
  });

  final = computed(() => {
    if (!this.team.hasValue()) return null;
    return finalScore(this.best()?.score ?? null, this.bonuses().map((b) => this.bonusScore(b.part)));
  });

  /** Back from the sheet: show the new scores. */
  ionViewWillEnter() {
    if (this.team.hasValue()) this.team.reload();
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

  open(part: EvalPart, matchId?: number) {
    const queryParams: Record<string, string | number> = { part };
    if (this.teamId()) Object.assign(queryParams, { team: this.teamId()!, teamName: this.teamName() ?? '', tournament: this.tournament() ?? '' });
    if (matchId) queryParams['match'] = matchId;
    void this.router.navigate(['/sheet', this.contestId()], { queryParams });
  }
}
