import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  ToastController,
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
import { ApiService, canScoreBonus } from '../api.service';

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
        @if (api.tabletTeam(); as t) {
          <!-- The tablet follows one team all the half-day: straight back to it. -->
          <ion-button expand="block" size="large" (click)="openTabletTeam()">
            <span class="wrap">Arbitre · {{ t.teamName }}</span>
          </ion-button>
        } @else {
          <ion-button expand="block" size="large" (click)="referee()">
            Je suis arbitre
          </ion-button>
        }
        <ion-button expand="block" fill="outline" (click)="bonus()">
          Bonus pédagogique et technologique
        </ion-button>
        <ion-button expand="block" size="large" routerLink="/tournaments" [queryParams]="{ mode: 'team' }">
          Classement et équipes
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
    .home { max-width: 480px; margin: 0 auto; display: flex; flex-direction: column; }
    .home > * + * { margin-top: 12px; }
    .wrap { white-space: normal; }
    .logo { max-height: 140px; object-fit: contain; margin: 12px auto 24px; }
  `,
})
export class HomePage {
  api = inject(ApiService);
  private router = inject(Router);
  private toasts = inject(ToastController);

  /** Referees sign in with no password, then pick their team. */
  async referee() {
    try {
      if (this.api.user()?.role !== 'REFEREE' && this.api.user()?.role !== 'ADMIN') await this.api.refereeLogin();
    } catch (e) {
      // Offline or server unreachable: the tournament list still opens from the cache.
      await (await this.toasts.create({ message: (e as Error).message, duration: 3000, position: 'top', color: 'warning' })).present();
    }
    await this.router.navigate(['/tournaments'], { queryParams: { mode: 'referee' } });
  }

  /** Educational advisers / digital referents: password first, then the tournament's teams. */
  bonus() {
    const target = '/tournaments?mode=referee';
    if (canScoreBonus(this.api.user())) void this.router.navigateByUrl(target);
    else void this.router.navigate(['/login'], { queryParams: { redirect: target } });
  }

  openTabletTeam() {
    const t = this.api.tabletTeam()!;
    void this.router.navigate(['/evaluate', t.contestId], { queryParams: { team: t.teamId, teamName: t.teamName, tournament: t.tournamentId } });
  }

  constructor() {
    addIcons({ cloudOfflineOutline, settingsOutline });
  }
}
