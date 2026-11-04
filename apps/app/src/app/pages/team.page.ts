import { Component, computed, inject, input, resource } from '@angular/core';
import { DatePipe } from '@angular/common';
import {
  IonBackButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonNote,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { ApiService, formatTime, type Match, type Team, type Tournament } from '../api.service';

interface TeamDetail extends Team {
  group: { id: number; name: string; tournament: Tournament; contest: { id: number; name: string } };
  participations: { id: number; score: number | null; timeSeconds: number | null; match: Match }[];
}

@Component({
  selector: 'app-team',
  imports: [
    DatePipe,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonList,
    IonListHeader,
    IonItem,
    IonLabel,
    IonNote,
    IonSpinner,
    IonText,
    IonRefresher,
    IonRefresherContent,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start"><ion-back-button defaultHref="/"></ion-back-button></ion-buttons>
        <ion-title>{{ team.hasValue() ? team.value().name : 'Équipe' }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="team.reload(); $any($event).target.complete()">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>
      <div class="narrow">
        @if (team.isLoading() && !team.hasValue()) {
          <div class="ion-text-center ion-padding"><ion-spinner></ion-spinner></div>
        } @else if (team.error()) {
          <ion-text color="danger"><p class="ion-padding">{{ team.error()?.message }}</p></ion-text>
        } @else if (team.value(); as t) {
          <ion-card>
            <ion-card-header>
              <ion-card-subtitle>{{ t.group.tournament.name }} · {{ t.group.name }}</ion-card-subtitle>
              <ion-card-title>{{ t.name }}</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              @if (t.school) { <p>{{ t.school.name }}</p> }
              <p>Feuille de mission : {{ t.group.contest.name }}</p>
              <p><strong>Meilleur score : {{ best() ?? '—' }}</strong></p>
            </ion-card-content>
          </ion-card>

          <ion-list>
            <ion-list-header>Matchs</ion-list-header>
            @for (p of t.participations; track p.id) {
              <ion-item>
                <ion-label>
                  <h3>
                    @if (p.match.tableNumber) { Table {{ p.match.tableNumber }} · }
                    {{ p.match.scheduledAt | date: 'EEEE d MMM, HH:mm' }}
                  </h3>
                  <p>{{ opponents(p.match) }}</p>
                </ion-label>
                <ion-note slot="end">
                  @if (p.score === null) { À jouer } @else { {{ p.score }} pts · {{ time(p.timeSeconds) }} }
                </ion-note>
              </ion-item>
            } @empty {
              <ion-item><ion-note>Aucun match programmé.</ion-note></ion-item>
            }
          </ion-list>
        }
      </div>
    </ion-content>
  `,
})
export class TeamPage {
  private api = inject(ApiService);
  id = input.required<string>();

  team = resource({
    params: () => this.id(),
    loader: ({ params }) => this.api.get<TeamDetail>(`/teams/${params}`),
  });

  best = computed(() => {
    if (!this.team.hasValue()) return null;
    const scores = this.team.value().participations.map((p) => p.score).filter((s) => s !== null);
    return scores.length ? Math.max(...scores) : null;
  });

  opponents(m: Match) {
    const others = m.participants.filter((p) => p.teamId !== Number(this.id())).map((p) => p.team.name);
    return others.length ? 'Avec ' + others.join(', ') : 'Seule sur la table';
  }

  time(s: number | null) {
    return s ? formatTime(s) : 'non chronométré';
  }
}
