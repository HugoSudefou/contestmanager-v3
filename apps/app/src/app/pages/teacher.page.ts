import { Component, inject, resource } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonBackButton,
  IonButton,
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
  IonNote,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { ApiService, formatTime, type Match, type Student, type Team, type Tournament } from '../api.service';
import { StudentsEditorComponent } from '../students-editor.component';

interface TeacherTeam extends Team {
  students: Student[];
  group: { name: string; tournament: Tournament; contest: { name: string } };
  participations: { id: number; score: number | null; timeSeconds: number | null; match: Match }[];
}

@Component({
  selector: 'app-teacher',
  imports: [
    DatePipe,
    StudentsEditorComponent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonButton,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonList,
    IonItem,
    IonLabel,
    IonNote,
    IonSpinner,
    IonText,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start"><ion-back-button defaultHref="/"></ion-back-button></ion-buttons>
        <ion-title>Mes équipes</ion-title>
        <ion-buttons slot="end"><ion-button (click)="logout()">Déconnexion</ion-button></ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="narrow">
        @if (teams.isLoading()) {
          <div class="ion-text-center ion-padding"><ion-spinner></ion-spinner></div>
        } @else if (teams.error()) {
          <ion-text color="danger"><p class="ion-padding">{{ teams.error()?.message }}</p></ion-text>
        } @else {
          @for (t of teams.value(); track t.id) {
            <ion-card>
              <ion-card-header>
                <ion-card-subtitle>{{ t.group.tournament.name }} · {{ t.group.name }}</ion-card-subtitle>
                <ion-card-title>{{ t.name }}</ion-card-title>
              </ion-card-header>
              <ion-card-content>
                <p>{{ t.school?.name }} · {{ t.group.contest.name }}</p>
                <h3>Élèves</h3>
                <app-students-editor [teamId]="t.id"></app-students-editor>
                <h3>Matchs</h3>
                <ion-list>
                  @for (p of t.participations; track p.id) {
                    <ion-item>
                      <ion-label>
                        @if (p.match.tableNumber) { Table {{ p.match.tableNumber }} · }
                        {{ p.match.scheduledAt | date: 'EEEE d MMM, HH:mm' }}
                      </ion-label>
                      <ion-note slot="end">{{ p.score === null ? 'À jouer' : p.score + ' pts · ' + time(p.timeSeconds) }}</ion-note>
                    </ion-item>
                  } @empty {
                    <ion-item><ion-note>Aucun match programmé.</ion-note></ion-item>
                  }
                </ion-list>
              </ion-card-content>
            </ion-card>
          } @empty {
            <p class="ion-padding">Aucune équipe n'est rattachée à votre compte. Contactez l'organisateur.</p>
          }
        }
      </div>
    </ion-content>
  `,
})
export class TeacherPage {
  private api = inject(ApiService);
  private router = inject(Router);
  teams = resource({ loader: () => this.api.get<TeacherTeam[]>('/me/teams') });

  time(s: number | null) {
    return s ? formatTime(s) : 'non chronométré';
  }

  logout() {
    this.api.logout();
    void this.router.navigateByUrl('/');
  }
}
