import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonBadge,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { cloudOfflineOutline, settingsOutline } from 'ionicons/icons';
import { ApiService } from '../api.service';

@Component({
  selector: 'app-home',
  imports: [RouterLink, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonContent, IonBadge, IonText],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Contest Manager</ion-title>
        <ion-buttons slot="end">
          @if (!api.online()) {
            <ion-icon name="cloud-offline-outline" aria-label="Hors ligne" class="ion-padding-end"></ion-icon>
          }
          <ion-button routerLink="/settings" aria-label="Réglages">
            <ion-icon slot="icon-only" name="settings-outline"></ion-icon>
            @if (api.outbox().length) {
              <ion-badge color="warning">{{ api.outbox().length }}</ion-badge>
            }
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div class="home">
        <img src="assets/legacy/logo.png" alt="" class="logo" />
        <ion-button expand="block" size="large" routerLink="/tournaments" [queryParams]="{ mode: 'referee' }">
          Je suis arbitre
        </ion-button>
        <ion-button expand="block" size="large" routerLink="/tournaments" [queryParams]="{ mode: 'team' }">
          Je suis une équipe
        </ion-button>
        <ion-button expand="block" size="large" fill="outline" routerLink="/training">
          Feuille de mission (entraînement)
        </ion-button>
        @if (api.user()?.role === 'TEACHER') {
          <ion-button expand="block" fill="outline" routerLink="/teacher">Espace enseignant</ion-button>
        } @else if (!api.user()) {
          <ion-button expand="block" fill="clear" routerLink="/login" [queryParams]="{ redirect: '/teacher' }">Espace enseignant</ion-button>
        }
        @if (api.user()?.role === 'ADMIN') {
          <ion-button expand="block" fill="clear" routerLink="/admin">Administration</ion-button>
        } @else {
          <ion-button expand="block" fill="clear" routerLink="/login" [queryParams]="{ redirect: '/admin' }">
            Administration
          </ion-button>
        }
        @if (api.user(); as u) {
          <ion-text color="medium"><p class="ion-text-center">Connecté : {{ u.username }}</p></ion-text>
        }
      </div>
    </ion-content>
  `,
  styles: `
    .home { max-width: 480px; margin: 0 auto; display: flex; flex-direction: column; gap: 12px; }
    .logo { max-height: 140px; object-fit: contain; margin: 12px auto 24px; }
  `,
})
export class HomePage {
  api = inject(ApiService);

  constructor() {
    addIcons({ cloudOfflineOutline, settingsOutline });
  }
}
