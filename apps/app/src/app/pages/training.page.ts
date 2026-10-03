import { Component, inject, resource, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
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
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
  ViewWillEnter,
} from '@ionic/angular';
import { ApiService, formatTime, practiceHistory, type Contest } from '../api.service';

@Component({
  selector: 'app-training',
  imports: [DatePipe, RouterLink, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonButton, IonContent, IonList, IonListHeader, IonItem, IonLabel, IonNote, IonSpinner, IonText],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start"><ion-back-button defaultHref="/"></ion-back-button></ion-buttons>
        <ion-title>Entraînement</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="narrow">
        <ion-list>
          <ion-list-header>Choisissez la feuille de mission</ion-list-header>
          @if (contests.isLoading()) {
            <div class="ion-text-center ion-padding"><ion-spinner></ion-spinner></div>
          } @else if (contests.error()) {
            <ion-text color="danger"><p class="ion-padding">{{ contests.error()?.message }}</p></ion-text>
          }
          @for (c of contests.hasValue() ? contests.value() : []; track c.id) {
            <ion-item button [routerLink]="['/sheet', c.id]">
              <ion-label>
                <h2>{{ c.name }}</h2>
                <p>{{ c.season }} · {{ c.sheet.missions.length }} missions · {{ time(c.sheet.durationSeconds) }}</p>
              </ion-label>
            </ion-item>
          }
        </ion-list>

        <ion-list>
          <ion-list-header>
            Mes scores (sur ce téléphone)
            @if (history().length) { <ion-button (click)="clear()">Effacer</ion-button> }
          </ion-list-header>
          @for (r of history(); track $index) {
            <ion-item>
              <ion-label>
                <h3>{{ r.team }}</h3>
                <p>{{ r.contestName }} · {{ r.date | date: 'd MMM HH:mm' }}</p>
              </ion-label>
              <ion-note slot="end">{{ r.total }} pts · {{ time(r.timeSeconds) }}</ion-note>
            </ion-item>
          } @empty {
            <ion-item><ion-note>Aucun score enregistré.</ion-note></ion-item>
          }
        </ion-list>
      </div>
    </ion-content>
  `,
})
export class TrainingPage implements ViewWillEnter {
  private api = inject(ApiService);
  contests = resource({ loader: () => this.api.get<Contest[]>('/contests') });
  history = signal(practiceHistory.list());
  time = formatTime;

  ionViewWillEnter() {
    this.history.set(practiceHistory.list());
  }

  clear() {
    if (!confirm("Effacer tout l'historique d'entraînement ?")) return;
    practiceHistory.clear();
    this.history.set([]);
  }
}
