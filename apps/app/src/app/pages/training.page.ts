import { Component, signal } from '@angular/core';
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
  IonTitle,
  IonToolbar,
  ViewWillEnter,
} from '@ionic/angular';
import { formatTime, practiceHistory } from '../api.service';
import { BUILTIN_CONTESTS } from '../builtin-contests';

@Component({
  selector: 'app-training',
  imports: [DatePipe, RouterLink, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonButton, IonContent, IonList, IonListHeader, IonItem, IonLabel, IonNote],
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
          @for (c of contests; track c.id) {
            <ion-item button [routerLink]="['/sheet', c.id]">
              <ion-label>
                <h2>{{ c.name }}</h2>
                <p>{{ c.season }} · {{ c.sheet.missions.length }} missions · {{ c.sheet.durationSeconds ? time(c.sheet.durationSeconds) : 'chrono libre' }}</p>
              </ion-label>
            </ion-item>
          }
          <ion-item lines="none"><ion-note>Ces feuilles sont intégrées à l'appli : elles fonctionnent sans connexion. Les scores restent sur cet appareil.</ion-note></ion-item>
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
  /** Embedded in the app: no server, no network needed (classes train before the tournament). */
  contests = BUILTIN_CONTESTS;
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
