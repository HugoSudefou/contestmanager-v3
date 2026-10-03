import { Component, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
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
      <form class="narrow" (ngSubmit)="submit()">
        <ion-list>
          <ion-input label="Identifiant" labelPlacement="stacked" name="username" [(ngModel)]="username" autocomplete="username" required></ion-input>
          <ion-input label="Mot de passe" labelPlacement="stacked" type="password" name="password" [(ngModel)]="password" autocomplete="current-password" required>
            <ion-input-password-toggle slot="end"></ion-input-password-toggle>
          </ion-input>
        </ion-list>
        @if (error()) {
          <ion-text color="danger"><p>{{ error() }}</p></ion-text>
        }
        <ion-button type="submit" expand="block" [disabled]="busy()">Se connecter</ion-button>
      </form>
    </ion-content>
  `,
})
export class LoginPage {
  private api = inject(ApiService);
  private router = inject(Router);
  redirect = input<string>('/');
  username = '';
  password = '';
  error = signal('');
  busy = signal(false);

  async submit() {
    this.busy.set(true);
    this.error.set('');
    try {
      await this.api.login(this.username.trim(), this.password);
      await this.router.navigateByUrl(this.redirect() || '/', { replaceUrl: true });
    } catch (e) {
      this.error.set((e as Error).message);
    } finally {
      this.busy.set(false);
    }
  }
}
