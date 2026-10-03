import { Component, inject, input, resource } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { ApiService, type Tournament } from '../api.service';

@Component({
  selector: 'app-tournaments',
  imports: [DatePipe, RouterLink, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonContent, IonList, IonItem, IonLabel, IonNote, IonSpinner, IonText],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start"><ion-back-button defaultHref="/"></ion-back-button></ion-buttons>
        <ion-title>Choisissez le tournoi</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="narrow">
        @if (tournaments.isLoading()) {
          <div class="ion-text-center ion-padding"><ion-spinner></ion-spinner></div>
        } @else if (tournaments.error()) {
          <ion-text color="danger"><p class="ion-padding">{{ tournaments.error()?.message }}</p></ion-text>
        } @else {
          <ion-list>
            @for (t of tournaments.value(); track t.id) {
              <ion-item button [routerLink]="['/tournament', t.id]" [queryParams]="{ mode: mode() }">
                <ion-label>
                  <h2>{{ t.name }}</h2>
                  <p>{{ t.location }}</p>
                </ion-label>
                <ion-note slot="end">{{ t.date | date: 'd MMM y' }}</ion-note>
              </ion-item>
            } @empty {
              <ion-item><ion-label>Aucun tournoi pour l'instant.</ion-label></ion-item>
            }
          </ion-list>
        }
      </div>
    </ion-content>
  `,
})
export class TournamentsPage {
  private api = inject(ApiService);
  mode = input<'referee' | 'team'>('team');
  tournaments = resource({ loader: () => this.api.get<Tournament[]>('/tournaments') });
}
