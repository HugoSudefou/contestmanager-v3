import { Component, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonInput,
  IonInputPasswordToggle,
  IonList,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { ApiService } from '../api.service';

@Component({
  selector: 'app-login',
  imports: [
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonList,
    IonInput,
    IonInputPasswordToggle,
    IonButton,
    IonText,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start"><ion-back-button defaultHref="/"></ion-back-button></ion-buttons>
        <ion-title>Connexion</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div class="narrow">
        @if (error()) {
          <ion-text color="danger"><p>{{ error() }}</p></ion-text>
        }
        <ion-card>
          <ion-card-header><ion-card-title>Arbitre</ion-card-title></ion-card-header>
          <ion-card-content>
            <p>Pour noter les matchs et le bonus Attitude de votre équipe. Pas de mot de passe.</p>
            <ion-button expand="block" size="large" [disabled]="busy()" (click)="referee()">Je suis arbitre</ion-button>
          </ion-card-content>
        </ion-card>

        <ion-card>
          <ion-card-header><ion-card-title>Bonus pédagogique et technologique</ion-card-title></ion-card-header>
          <ion-card-content>
            <p>Conseillers pédagogiques et référents numériques : affiche, présentation orale, bonus technologique.</p>
            <form (ngSubmit)="bonus()">
              <ion-input label="Mot de passe" labelPlacement="stacked" type="password" name="bonusPassword" [(ngModel)]="bonusPassword" required>
                <ion-input-password-toggle slot="end"></ion-input-password-toggle>
              </ion-input>
              <ion-button type="submit" expand="block" [disabled]="busy() || !bonusPassword">Entrer</ion-button>
            </form>
          </ion-card-content>
        </ion-card>

        <ion-card>
          <ion-card-header><ion-card-title>Administration et enseignants</ion-card-title></ion-card-header>
          <ion-card-content>
            <form (ngSubmit)="submit()">
              <ion-list>
                <ion-input label="Identifiant" labelPlacement="stacked" name="username" [(ngModel)]="username" autocomplete="username" required></ion-input>
                <ion-input label="Mot de passe" labelPlacement="stacked" type="password" name="password" [(ngModel)]="password" autocomplete="current-password" required>
                  <ion-input-password-toggle slot="end"></ion-input-password-toggle>
                </ion-input>
              </ion-list>
              <ion-button type="submit" expand="block" fill="outline" [disabled]="busy()">Se connecter</ion-button>
            </form>
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  `,
})
export class LoginPage {
  private api = inject(ApiService);
  private router = inject(Router);
  redirect = input<string>('/');
  username = '';
  password = '';
  bonusPassword = '';
  error = signal('');
  busy = signal(false);

  submit() {
    return this.run(() => this.api.login(this.username.trim(), this.password));
  }

  referee() {
    return this.run(() => this.api.refereeLogin());
  }

  bonus() {
    return this.run(() => this.api.bonusLogin(this.bonusPassword.trim()));
  }

  private async run(signIn: () => Promise<unknown>) {
    this.busy.set(true);
    this.error.set('');
    try {
      await signIn();
      await this.router.navigateByUrl(this.redirect() || '/', { replaceUrl: true });
    } catch (e) {
      this.error.set((e as Error).message);
    } finally {
      this.busy.set(false);
    }
  }
}
