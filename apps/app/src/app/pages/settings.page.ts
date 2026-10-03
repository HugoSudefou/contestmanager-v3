import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonNote,
  IonTitle,
  IonToolbar,
  ToastController,
} from '@ionic/angular';
import { ApiService, type ScoreSubmission } from '../api.service';

@Component({
  selector: 'app-settings',
  imports: [
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonContent,
    IonList,
    IonListHeader,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonNote,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start"><ion-back-button defaultHref="/"></ion-back-button></ion-buttons>
        <ion-title>Réglages</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div class="narrow">
        <ion-list>
          <ion-list-header>Serveur</ion-list-header>
          <ion-item>
            <ion-input label="Adresse de l'API" labelPlacement="stacked" [(ngModel)]="url" placeholder="http://192.168.1.10:3000"></ion-input>
          </ion-item>
          <ion-item lines="none">
            <ion-note>{{ api.online() ? 'En ligne' : 'Hors ligne' }}</ion-note>
            <ion-button slot="end" (click)="save()">Enregistrer</ion-button>
          </ion-item>
        </ion-list>

        <ion-list>
          <ion-list-header>Session</ion-list-header>
          <ion-item>
            <ion-label>{{ api.user()?.username ?? 'Non connecté' }}</ion-label>
            @if (api.user()) {
              <ion-button slot="end" fill="outline" (click)="api.logout()">Déconnexion</ion-button>
            }
          </ion-item>
        </ion-list>

        <ion-list>
          <ion-list-header>Scores en attente d'envoi ({{ api.outbox().length }})</ion-list-header>
          @for (s of api.outbox(); track $index) {
            <ion-item>
              <ion-label>{{ s.label }}</ion-label>
              <ion-button slot="end" fill="clear" color="danger" (click)="discard(s)">Supprimer</ion-button>
            </ion-item>
          } @empty {
            <ion-item><ion-note>Aucun, tout est synchronisé.</ion-note></ion-item>
          }
          @if (api.outbox().length) {
            <ion-button expand="block" (click)="api.flush()">Envoyer maintenant</ion-button>
            @if (!api.user()) {
              <ion-note>Connectez-vous en arbitre pour envoyer ces scores.</ion-note>
            }
          }
        </ion-list>
      </div>
    </ion-content>
  `,
})
export class SettingsPage {
  api = inject(ApiService);
  private toast = inject(ToastController);
  url = this.api.baseUrl();

  async save() {
    this.api.setBaseUrl(this.url);
    const ok = await this.api.get('/tournaments').then(
      () => true,
      () => false,
    );
    (await this.toast.create({ message: ok ? 'Serveur joignable' : 'Serveur injoignable', duration: 2000 })).present();
  }

  discard(s: ScoreSubmission) {
    if (confirm(`Supprimer définitivement le score « ${s.label} » ?`)) this.api.discardPending(s);
  }
}
