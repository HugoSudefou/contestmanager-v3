import { Component, OnInit, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonButton, IonIcon, IonInput, IonNote, IonSpinner, ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { closeOutline } from 'ionicons/icons';
import { ApiService, type Student } from './api.service';

/** Edit the students of one team (admins and the team's teacher). */
@Component({
  selector: 'app-students-editor',
  imports: [FormsModule, IonInput, IonButton, IonIcon, IonNote, IonSpinner],
  template: `
    @if (students(); as list) {
      @for (s of list; track $index; let i = $index) {
        <div class="row">
          <ion-input label="Prénom" labelPlacement="stacked" [(ngModel)]="s.firstName"></ion-input>
          <ion-input label="Nom" labelPlacement="stacked" [(ngModel)]="s.lastName"></ion-input>
          <ion-input label="Rôle" labelPlacement="stacked" [(ngModel)]="s.role" placeholder="Pilote, constructeur…"></ion-input>
          <ion-button fill="clear" color="danger" (click)="list.splice(i, 1)" aria-label="Retirer l'élève"><ion-icon slot="icon-only" name="close-outline"></ion-icon></ion-button>
        </div>
      } @empty {
        <ion-note>Aucun élève.</ion-note>
      }
      <div class="actions">
        <ion-button size="small" fill="outline" (click)="list.push({ firstName: '', lastName: '', role: '' })">+ Élève</ion-button>
        <ion-button size="small" [disabled]="saving()" (click)="save()">Enregistrer les élèves</ion-button>
      </div>
    } @else {
      <ion-spinner></ion-spinner>
    }
  `,
  styles: `
    .row { display: grid; grid-template-columns: 1fr 1fr 1fr auto; gap: 8px; align-items: end; }
    .actions { display: flex; gap: 8px; margin-top: 8px; }
    @media (max-width: 600px) { .row { grid-template-columns: 1fr 1fr; } }
  `,
})
export class StudentsEditorComponent implements OnInit {
  private api = inject(ApiService);
  private toasts = inject(ToastController);
  teamId = input.required<number>();
  students = signal<Student[] | null>(null);
  saving = signal(false);

  constructor() {
    addIcons({ closeOutline });
  }

  async ngOnInit() {
    this.students.set(await this.api.get<Student[]>(`/teams/${this.teamId()}/students`));
  }

  async save() {
    const students = this.students()!
      .filter((s) => s.firstName.trim() || s.lastName.trim())
      .map((s) => ({ firstName: s.firstName.trim(), lastName: s.lastName.trim(), role: s.role?.trim() || undefined }));
    this.saving.set(true);
    try {
      this.students.set(await this.api.send<Student[]>('PUT', `/teams/${this.teamId()}/students`, { students }));
      await (await this.toasts.create({ message: 'Élèves enregistrés', duration: 2000, color: 'success' })).present();
    } catch (e) {
      await (await this.toasts.create({ message: (e as Error).message, duration: 4000, color: 'danger' })).present();
    } finally {
      this.saving.set(false);
    }
  }
}
