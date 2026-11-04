import { Component, inject, resource, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  AlertController,
  IonBackButton,
  IonBadge,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonSegment,
  IonSegmentButton,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToolbar,
  ToastController,
  ViewWillEnter,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { copyOutline, trashOutline, keyOutline, downloadOutline, cloudUploadOutline } from 'ionicons/icons';
import { validateSheet, type Sheet } from '@contest/scoring';
import { ApiService, type Contest, type Role, type Tournament, type User } from '../api.service';

@Component({
  selector: 'app-admin',
  imports: [
    DatePipe,
    FormsModule,
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonButton,
    IonIcon,
    IonContent,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonList,
    IonItem,
    IonNote,
    IonBadge,
    IonInput,
    IonSelect,
    IonSelectOption,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="dark">
        <ion-buttons slot="start"><ion-back-button defaultHref="/"></ion-back-button></ion-buttons>
        <ion-title>Administration</ion-title>
        <ion-buttons slot="end"><ion-button (click)="logout()">Déconnexion</ion-button></ion-buttons>
      </ion-toolbar>
      <ion-toolbar>
        <ion-segment [value]="tab()" (ionChange)="tab.set($any($event.detail.value))">
          <ion-segment-button value="contests"><ion-label>Concours</ion-label></ion-segment-button>
          <ion-segment-button value="tournaments"><ion-label>Tournois</ion-label></ion-segment-button>
          <ion-segment-button value="users"><ion-label>Utilisateurs</ion-label></ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div class="narrow">
        @switch (tab()) {
          @case ('contests') {
            <p>Un concours = une feuille de mission (missions, barème, chrono). Les groupes de tournoi y sont rattachés.</p>
            <ion-button routerLink="/admin/contest/new">Nouveau concours</ion-button>
            <ion-button fill="outline" (click)="fileInput.click()"><ion-icon slot="start" name="cloud-upload-outline"></ion-icon>Importer (fichier JSON)</ion-button>
            <input #fileInput type="file" accept=".json,application/json" hidden (change)="importFile(fileInput)" />
            <ion-list>
              @for (c of contests.hasValue() ? contests.value() : []; track c.id) {
                <ion-item>
                  <ion-label [routerLink]="['/admin/contest', c.id]" class="clickable">
                    <h2>{{ c.name }}</h2>
                    <p>{{ c.season }} · {{ c.sheet.missions.length }} missions</p>
                  </ion-label>
                  <ion-badge slot="end" [color]="c.published ? 'success' : 'medium'">{{ c.published ? 'Publié' : 'Brouillon' }}</ion-badge>
                  <ion-button slot="end" fill="clear" (click)="exportFile(c)" aria-label="Exporter en fichier JSON"><ion-icon slot="icon-only" name="download-outline"></ion-icon></ion-button>
                  <ion-button slot="end" fill="clear" (click)="duplicate(c)" aria-label="Dupliquer"><ion-icon slot="icon-only" name="copy-outline"></ion-icon></ion-button>
                  <ion-button slot="end" fill="clear" color="danger" (click)="remove('/contests/' + c.id, c.name)" aria-label="Supprimer"><ion-icon slot="icon-only" name="trash-outline"></ion-icon></ion-button>
                </ion-item>
              }
            </ion-list>
          }
          @case ('tournaments') {
            <ion-button (click)="createTournament()">Nouveau tournoi</ion-button>
            <ion-list>
              @for (t of tournaments.hasValue() ? tournaments.value() : []; track t.id) {
                <ion-item>
                  <ion-label [routerLink]="['/admin/tournament', t.id]" class="clickable">
                    <h2>{{ t.name }}</h2>
                    <p>{{ t.date | date: 'd MMM y' }} {{ t.location }}</p>
                  </ion-label>
                  <ion-button slot="end" fill="clear" color="danger" (click)="remove('/tournaments/' + t.id, t.name)" aria-label="Supprimer"><ion-icon slot="icon-only" name="trash-outline"></ion-icon></ion-button>
                </ion-item>
              }
            </ion-list>
          }
          @case ('users') {
            <form class="new-user" (ngSubmit)="createUser()">
              <ion-input label="Identifiant" labelPlacement="stacked" name="u" [(ngModel)]="newUser.username" required></ion-input>
              <ion-input label="Mot de passe (6+)" labelPlacement="stacked" name="p" type="password" [(ngModel)]="newUser.password" required></ion-input>
              <ion-select label="Rôle" labelPlacement="stacked" name="r" [(ngModel)]="newUser.role" interface="popover">
                <ion-select-option value="REFEREE">Arbitre</ion-select-option>
                <ion-select-option value="ADMIN">Admin</ion-select-option>
                <ion-select-option value="TEACHER">Enseignant</ion-select-option>
              </ion-select>
              <ion-button type="submit">Ajouter</ion-button>
            </form>
            <ion-list>
              @for (u of users.hasValue() ? users.value() : []; track u.id) {
                <ion-item>
                  <ion-label>{{ u.username }}</ion-label>
                  <ion-note slot="end">{{ roleLabel[u.role] }}</ion-note>
                  <ion-button slot="end" fill="clear" (click)="resetPassword(u)" aria-label="Changer le mot de passe"><ion-icon slot="icon-only" name="key-outline"></ion-icon></ion-button>
                  <ion-button slot="end" fill="clear" color="danger" [disabled]="u.id === api.user()?.id" (click)="remove('/users/' + u.id, u.username)" aria-label="Supprimer"><ion-icon slot="icon-only" name="trash-outline"></ion-icon></ion-button>
                </ion-item>
              }
            </ion-list>
          }
        }
      </div>
    </ion-content>
  `,
  styles: `
    .clickable { cursor: pointer; }
    .new-user { display: grid; grid-template-columns: 1fr 1fr 140px auto; gap: 8px; align-items: end; }
    @media (max-width: 600px) { .new-user { grid-template-columns: 1fr; } }
  `,
})
export class AdminPage implements ViewWillEnter {
  api = inject(ApiService);
  private router = inject(Router);
  private alerts = inject(AlertController);
  private toasts = inject(ToastController);

  tab = signal<'contests' | 'tournaments' | 'users'>('contests');
  contests = resource({ loader: () => this.api.get<Contest[]>('/contests?all=1') });
  tournaments = resource({ loader: () => this.api.get<Tournament[]>('/tournaments') });
  users = resource({ loader: () => this.api.get<User[]>('/users') });
  roleLabel: Record<Role, string> = { ADMIN: 'Admin', REFEREE: 'Arbitre', TEACHER: 'Enseignant' };
  newUser: { username: string; password: string; role: Role } = { username: '', password: '', role: 'REFEREE' };

  constructor() {
    addIcons({ copyOutline, trashOutline, keyOutline, downloadOutline, cloudUploadOutline });
  }

  ionViewWillEnter() {
    this.reload();
  }

  private reload() {
    this.contests.reload();
    this.tournaments.reload();
    this.users.reload();
  }

  logout() {
    this.api.logout();
    void this.router.navigateByUrl('/');
  }

  async duplicate(c: Contest) {
    await this.run(() => this.api.send('POST', `/contests/${c.id}/duplicate`), 'Concours dupliqué');
  }

  /**
   * Creates a contest from a JSON file chosen on the device (docs/concours/*.json, or a file exported here).
   * Accepts a full contest { name, season, description, sheet } or a bare sheet { durationSeconds, missions... }
   * (then the file name becomes the contest name). Imported contests start as drafts.
   */
  async importFile(input: HTMLInputElement) {
    const file = input.files?.[0];
    input.value = ''; // allow re-importing the same file
    if (!file) return;
    let body: { name: string; season: string; description?: string; published: boolean; sheet: Sheet };
    try {
      const data = JSON.parse(await file.text());
      const full = data && typeof data === 'object' && 'sheet' in data;
      const sheet = (full ? data.sheet : data) as Sheet;
      const errors = validateSheet(sheet);
      if (errors.length) throw new Error(errors.join(' '));
      body = {
        name: (full && typeof data.name === 'string' && data.name.trim()) || file.name.replace(/\.json$/i, ''),
        season: (full && typeof data.season === 'string' && data.season) || '',
        ...(full && typeof data.description === 'string' ? { description: data.description } : {}),
        published: false,
        sheet,
      };
    } catch (e) {
      const message = e instanceof SyntaxError ? "Ce fichier n'est pas un JSON valide." : (e as Error).message;
      await (await this.toasts.create({ message: `Import impossible : ${message}`, duration: 5000, color: 'danger' })).present();
      return;
    }
    await this.run(() => this.api.send('POST', '/contests', body), `« ${body.name} » importé (brouillon : à publier dans l'éditeur)`);
  }

  /** Downloads a contest as a JSON file that the Import button accepts (backup, copy to another server). */
  exportFile(c: Contest) {
    const { name, season, description, published, sheet } = c;
    const blob = new Blob([JSON.stringify({ name, season, description, published, sheet }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${name.replace(/[\\/:*?"<>|]+/g, '-')}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  async remove(path: string, name: string) {
    if (confirm(`Supprimer « ${name} » ? Cette action est définitive.`)) await this.run(() => this.api.send('DELETE', path), 'Supprimé');
  }

  async createTournament() {
    const alert = await this.alerts.create({
      header: 'Nouveau tournoi',
      inputs: [
        { name: 'name', placeholder: 'Nom (ex. Défi robotique 2026)' },
        { name: 'date', type: 'date' },
        { name: 'location', placeholder: 'Lieu' },
      ],
      buttons: [
        { text: 'Annuler', role: 'cancel' },
        {
          text: 'Créer',
          handler: (d: { name: string; date: string; location: string }) => {
            if (!d.name.trim()) return false;
            void this.run(
              () => this.api.send('POST', '/tournaments', { name: d.name.trim(), date: d.date || undefined, location: d.location || undefined }),
              'Tournoi créé',
            );
            return true;
          },
        },
      ],
    });
    await alert.present();
  }

  async createUser() {
    const ok = await this.run(() => this.api.send('POST', '/users', this.newUser), 'Utilisateur créé');
    if (ok) this.newUser = { username: '', password: '', role: 'REFEREE' };
  }

  async resetPassword(u: User) {
    const alert = await this.alerts.create({
      header: `Mot de passe de ${u.username}`,
      inputs: [{ name: 'password', type: 'password', placeholder: 'Nouveau mot de passe (6+)' }],
      buttons: [
        { text: 'Annuler', role: 'cancel' },
        {
          text: 'Changer',
          handler: (d: { password: string }) => {
            void this.run(() => this.api.send('PUT', `/users/${u.id}`, { username: u.username, role: u.role, password: d.password }), 'Mot de passe changé');
          },
        },
      ],
    });
    await alert.present();
  }

  private async run(action: () => Promise<unknown>, success: string): Promise<boolean> {
    try {
      await action();
      this.reload();
      await (await this.toasts.create({ message: success, duration: 2000, color: 'success' })).present();
      return true;
    } catch (e) {
      await (await this.toasts.create({ message: (e as Error).message, duration: 4000, color: 'danger' })).present();
      return false;
    }
  }
}
