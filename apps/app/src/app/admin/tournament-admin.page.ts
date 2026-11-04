import { compareResults } from '@contest/scoring';
import { Component, inject, input, resource, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AlertController,
  IonBackButton,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonModal,
  IonLabel,
  IonList,
  IonNote,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonTextarea,
  IonTitle,
  IonToolbar,
  ToastController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { createOutline, trashOutline } from 'ionicons/icons';
import { ApiService, FINALS_GROUP, formatTime, roundName, type Contest, type Group, type Team, type TournamentDetail } from '../api.service';
import { StudentsEditorComponent } from '../students-editor.component';
import { readWorkbook, type ImportEntry } from './import-workbook';

interface MatchDraft { tableNumber?: number; scheduledAt?: string; teamIds: number[] }

@Component({
  selector: 'app-tournament-admin',
  imports: [
    DatePipe,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonButton,
    IonIcon,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonList,
    IonItem,
    IonLabel,
    IonNote,
    IonInput,
    IonModal,
    StudentsEditorComponent,
    IonTextarea,
    IonSelect,
    IonSelectOption,
    IonSpinner,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="dark">
        <ion-buttons slot="start"><ion-back-button defaultHref="/admin"></ion-back-button></ion-buttons>
        <ion-title>{{ data.hasValue() ? data.value().name : 'Tournoi' }}</ion-title>
        <ion-buttons slot="end"><ion-button (click)="editTournament()">Modifier</ion-button></ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      @if (!data.hasValue()) {
        <div class="ion-text-center"><ion-spinner></ion-spinner></div>
      } @else {
        <div class="narrow">
          <ion-card>
            <ion-card-content>
              <p>Un groupe = des équipes qui jouent la même feuille de mission (ex. « CM1-CM2 » sur le concours Cycle 3).</p>
              <div class="row">
                <ion-input class="grow" label="Nouveau groupe" labelPlacement="stacked" [(ngModel)]="newGroup.name" placeholder="CM1-CM2"></ion-input>
                <ion-select class="grow" label="Concours" labelPlacement="stacked" interface="popover" [(ngModel)]="newGroup.contestId">
                  @for (c of contests.hasValue() ? contests.value() : []; track c.id) { <ion-select-option [value]="c.id">{{ c.name }}</ion-select-option> }
                </ion-select>
                <ion-button [disabled]="!newGroup.name || !newGroup.contestId" (click)="createGroup()">Ajouter</ion-button>
              </div>
            </ion-card-content>
          </ion-card>

          <ion-card>
            <ion-card-content>
              <h3>Importer les inscriptions (Excel)</h3>
              <p>Classeur avec les onglets <code>ecole</code>, <code>classe</code> (enseignant, classe, niveau), <code>equipe</code> (élèves : nom, prénom, rôle) et <code>ecole-classe-equipe</code>. Un groupe est créé par classe, un compte enseignant par enseignant.</p>
              <label class="file-btn">
                Choisir un fichier .xlsx
                <input type="file" accept=".xlsx" hidden (change)="pickWorkbook($event)" />
              </label>
            </ion-card-content>
          </ion-card>

          <ion-card>
            <ion-card-content>
              <h3>Phase finale</h3>
              <p>Meilleure équipe de chaque groupe du concours choisi, complétée par les meilleurs scores, placées en tableau. Le gagnant de chaque match passe au tour suivant dès que les deux scores sont saisis (en cas d'égalité, faites rejouer et ressaisissez).</p>
              <div class="row">
                <ion-select class="grow" label="Concours" labelPlacement="stacked" interface="popover" [(ngModel)]="finals.contestId">
                  @for (c of contests.hasValue() ? contests.value() : []; track c.id) { <ion-select-option [value]="c.id">{{ c.name }}</ion-select-option> }
                </ion-select>
                <ion-select label="Équipes" labelPlacement="stacked" interface="popover" [(ngModel)]="finals.size">
                  @for (n of [2, 4, 8, 16]; track n) { <ion-select-option [value]="n">{{ n }}</ion-select-option> }
                </ion-select>
                <ion-input label="Début" labelPlacement="stacked" type="datetime-local" [(ngModel)]="finals.startAt"></ion-input>
                <ion-input class="num" label="Min / tour" labelPlacement="stacked" type="number" [(ngModel)]="finals.minutesPerRound"></ion-input>
                <ion-button [disabled]="!finals.contestId" (click)="generateFinals()">Générer</ion-button>
              </div>
            </ion-card-content>
          </ion-card>

          @for (g of data.value()!.groups; track g.id) {
            <ion-card>
              <ion-card-header>
                <div class="row">
                  <ion-card-title class="grow">{{ g.name }}</ion-card-title>
                  <ion-select interface="popover" [value]="g.contestId" (ionChange)="setContest(g, $event.detail.value)" aria-label="Concours du groupe">
                    @for (c of contests.hasValue() ? contests.value() : []; track c.id) { <ion-select-option [value]="c.id">{{ c.name }}</ion-select-option> }
                  </ion-select>
                  <ion-button fill="clear" (click)="renameGroup(g)" aria-label="Renommer"><ion-icon slot="icon-only" name="create-outline"></ion-icon></ion-button>
                  <ion-button fill="clear" color="danger" (click)="remove('/groups/' + g.id, g.name)" aria-label="Supprimer le groupe"><ion-icon slot="icon-only" name="trash-outline"></ion-icon></ion-button>
                </div>
              </ion-card-header>
              <ion-card-content>
                <h3>Équipes ({{ g.teams.length }})</h3>
                <ion-list>
                  @for (t of ranking(g); track t.team.id) {
                    <ion-item>
                      <ion-label>{{ t.team.name }} <ion-note>{{ t.team.school?.name }}</ion-note></ion-label>
                      <ion-note slot="end">{{ t.best === null ? '—' : t.best + ' pts' + (t.tie && t.timeSeconds ? ' · ' + time(t.timeSeconds) : '') }}</ion-note>
                      <ion-button slot="end" fill="clear" size="small" (click)="toggleStudents(t.team.id)">Élèves</ion-button>
                      <ion-button slot="end" fill="clear" (click)="editTeam(t.team)" aria-label="Modifier"><ion-icon slot="icon-only" name="create-outline"></ion-icon></ion-button>
                      <ion-button slot="end" fill="clear" color="danger" (click)="remove('/teams/' + t.team.id, t.team.name)" aria-label="Supprimer"><ion-icon slot="icon-only" name="trash-outline"></ion-icon></ion-button>
                    </ion-item>
                    @if (openStudents().includes(t.team.id)) {
                      <div class="students"><app-students-editor [teamId]="t.team.id"></app-students-editor></div>
                    }
                  }
                </ion-list>
                <ion-textarea label="Ajouter des équipes (une par ligne, « Nom ; École » possible)" labelPlacement="stacked" [autoGrow]="true" [(ngModel)]="teamDrafts[g.id]"></ion-textarea>
                <ion-button size="small" [disabled]="!teamDrafts[g.id]?.trim()" (click)="addTeams(g)">Ajouter les équipes</ion-button>

                <h3>Matchs ({{ g.matches.length }})</h3>
                <ion-list>
                  @for (m of g.matches; track m.id) {
                    <ion-item>
                      <ion-label class="ion-text-wrap">
                        <h3>
                          @if (m.round) { {{ roundName(m.round) }} · }
                          @if (m.tableNumber) { Table {{ m.tableNumber }} · }
                          {{ m.scheduledAt | date: 'd MMM HH:mm' }}
                        </h3>
                        <p>
                          @for (p of m.participants; track p.id; let last = $last) {
                            {{ p.team.name }} ({{ p.score ?? 'à noter' }}){{ last ? '' : ' · ' }}
                          }
                        </p>
                      </ion-label>
                      <ion-button slot="end" fill="clear" color="danger" (click)="remove('/matches/' + m.id, 'ce match')" aria-label="Supprimer le match"><ion-icon slot="icon-only" name="trash-outline"></ion-icon></ion-button>
                    </ion-item>
                  }
                </ion-list>
                <div class="row">
                  <ion-input class="num" label="Table" labelPlacement="stacked" type="number" [(ngModel)]="draft(g).tableNumber"></ion-input>
                  <ion-input label="Horaire" labelPlacement="stacked" type="datetime-local" [(ngModel)]="draft(g).scheduledAt"></ion-input>
                  <ion-select class="grow" label="Équipes" labelPlacement="stacked" [multiple]="true" [(ngModel)]="draft(g).teamIds">
                    @for (t of g.name === FINALS_GROUP ? allTeams() : g.teams; track t.id) { <ion-select-option [value]="t.id">{{ t.name }}</ion-select-option> }
                  </ion-select>
                  <ion-button [disabled]="!draft(g).teamIds.length" (click)="createMatch(g)">Ajouter le match</ion-button>
                </div>
              </ion-card-content>
            </ion-card>
          }
        </div>
      }

      <ion-modal [isOpen]="!!importState()" (didDismiss)="importState.set(null)">
        <ng-template>
          <ion-header>
            <ion-toolbar>
              <ion-title>Import des inscriptions</ion-title>
              <ion-buttons slot="end"><ion-button (click)="importState.set(null)">Fermer</ion-button></ion-buttons>
            </ion-toolbar>
          </ion-header>
          <ion-content class="ion-padding">
            @if (importState(); as st) {
              @if (st.errors.length) {
                <ion-card color="warning"><ion-card-content>
                  @for (e of st.errors; track $index) { <div>{{ e }}</div> }
                </ion-card-content></ion-card>
              }
              @if (st.result; as res) {
                <p><strong>{{ res.teams }} équipes et {{ res.students }} élèves importés.</strong></p>
                @if (res.credentials.length) {
                  <p>Comptes enseignants créés. <strong>Notez ces mots de passe maintenant, ils ne seront plus affichés.</strong></p>
                  <ion-list>
                    @for (c of res.credentials; track c.username) {
                      <ion-item><ion-label>{{ c.name }}</ion-label><ion-note slot="end">{{ c.username }} / {{ c.password }}</ion-note></ion-item>
                    }
                  </ion-list>
                  <ion-button (click)="downloadCredentials(res.credentials)">Télécharger (CSV)</ion-button>
                }
              } @else {
                <p>{{ st.entries.length }} équipes, {{ count(st.entries, 'school') }} écoles, {{ count(st.entries, 'teacher') }} enseignants, {{ studentCount(st.entries) }} élèves.</p>
                <p>Choisissez le concours joué pour chaque niveau :</p>
                @for (level of levels(st.entries); track level) {
                  <ion-select [label]="'Niveau ' + level" interface="popover" [(ngModel)]="st.levelContest[level]">
                    @for (c of contests.hasValue() ? contests.value() : []; track c.id) { <ion-select-option [value]="c.id">{{ c.name }}</ion-select-option> }
                  </ion-select>
                }
                <ion-button expand="block" [disabled]="!st.entries.length || st.busy" (click)="confirmImport()">Importer</ion-button>
              }
            }
          </ion-content>
        </ng-template>
      </ion-modal>
    </ion-content>
  `,
  styles: `
    .row { display: flex; align-items: end; gap: 8px; flex-wrap: wrap; }
    .grow { flex: 1; min-width: 160px; }
    .num { max-width: 90px; }
    .students { padding: 8px 16px 16px 32px; }
    .file-btn { display: inline-block; cursor: pointer; padding: 8px 14px; border-radius: 6px; background: var(--ion-color-primary); color: var(--ion-color-primary-contrast); }
    h3 { margin-top: 16px; }
    ion-card-header ion-select { flex: 0 1 260px; }
  `,
})
export class TournamentAdminPage {
  private api = inject(ApiService);
  private alerts = inject(AlertController);
  private toasts = inject(ToastController);
  id = input.required<string>();

  data = resource({
    params: () => this.id(),
    loader: ({ params }) => this.api.get<TournamentDetail>(`/tournaments/${params}`),
  });
  contests = resource({ loader: () => this.api.get<Contest[]>('/contests?all=1') });
  newGroup: { name: string; contestId?: number } = { name: '' };
  teamDrafts: Record<number, string> = {};
  private matchDrafts: Record<number, MatchDraft> = {};
  finals: { contestId?: number; size: number; startAt?: string; minutesPerRound: number } = { size: 4, minutesPerRound: 10 };
  openStudents = signal<number[]>([]);
  importState = signal<{
    entries: ImportEntry[];
    errors: string[];
    levelContest: Record<string, number>;
    busy?: boolean;
    result?: { teams: number; students: number; credentials: { name: string; username: string; password: string }[] };
  } | null>(null);
  FINALS_GROUP = FINALS_GROUP;
  roundName = roundName;

  constructor() {
    addIcons({ createOutline, trashOutline });
  }

  allTeams() {
    return (this.data.hasValue() ? this.data.value().groups : []).flatMap((g) => g.teams).sort((a, b) => a.name.localeCompare(b.name));
  }

  toggleStudents(teamId: number) {
    this.openStudents.update((ids) => (ids.includes(teamId) ? ids.filter((i) => i !== teamId) : [...ids, teamId]));
  }

  async pickWorkbook(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    try {
      const { entries, errors } = await readWorkbook(file);
      this.importState.set({ entries, errors, levelContest: {} });
    } catch (e) {
      await (await this.toasts.create({ message: (e as Error).message, duration: 5000, color: 'danger' })).present();
    }
  }

  levels = (entries: ImportEntry[]) => [...new Set(entries.map((e) => e.level))].sort();
  count = (entries: ImportEntry[], key: 'school' | 'teacher') => new Set(entries.map((e) => e[key])).size;
  studentCount = (entries: ImportEntry[]) => entries.reduce((n, e) => n + e.students.length, 0);

  async confirmImport() {
    const st = this.importState()!;
    this.importState.set({ ...st, busy: true });
    try {
      const result = await this.api.send<NonNullable<typeof st.result>>('POST', `/tournaments/${this.id()}/import`, {
        entries: st.entries,
        levelContest: st.levelContest,
      });
      this.importState.set({ ...st, busy: false, result });
      this.data.reload();
    } catch (e) {
      this.importState.set({ ...st, busy: false, errors: (e as Error).message.split('\n') });
    }
  }

  downloadCredentials(list: { name: string; username: string; password: string }[]) {
    const csv = ['Enseignant;Identifiant;Mot de passe', ...list.map((c) => `${c.name};${c.username};${c.password}`)].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }));
    a.download = 'comptes-enseignants.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async generateFinals() {
    const f = this.finals;
    await this.run(() =>
      this.api.send('POST', `/tournaments/${this.id()}/finals`, {
        contestId: f.contestId,
        size: Number(f.size),
        minutesPerRound: Number(f.minutesPerRound),
        startAt: f.startAt ? new Date(f.startAt).toISOString() : undefined,
      }),
    );
  }

  draft(g: Group): MatchDraft {
    return (this.matchDrafts[g.id] ??= { teamIds: [] });
  }

  /** Teams sorted by best score, unscored last. */
  time = formatTime;

  ranking(g: Group) {
    return g.teams
      .map((team) => {
        const tie = !!g.contest?.sheet?.timeTiebreak;
        const scores = g.matches.flatMap((m) => m.participants).filter((p) => p.teamId === team.id && p.score !== null);
        const top = [...scores].sort((a, b) => compareResults(a, b, tie))[0];
        return { team, best: top ? top.score : null, timeSeconds: top?.timeSeconds ?? null, tie };
      })
      .sort((a, b) => compareResults({ score: a.best, timeSeconds: a.timeSeconds }, { score: b.best, timeSeconds: b.timeSeconds }, a.tie) || a.team.name.localeCompare(b.team.name));
  }

  async createGroup() {
    if (await this.run(() => this.api.send('POST', '/groups', { ...this.newGroup, tournamentId: Number(this.id()) }))) {
      this.newGroup = { name: '' };
    }
  }

  setContest(g: Group, contestId: number) {
    if (contestId !== g.contestId) {
      void this.run(() => this.api.send('PUT', `/groups/${g.id}`, { name: g.name, tournamentId: g.tournamentId, contestId }));
    }
  }

  async renameGroup(g: Group) {
    const name = await this.prompt('Renommer le groupe', [{ name: 'name', value: g.name, placeholder: 'Nom' }]);
    if (name?.['name']) await this.run(() => this.api.send('PUT', `/groups/${g.id}`, { name: name['name'], tournamentId: g.tournamentId, contestId: g.contestId }));
  }

  async addTeams(g: Group) {
    const lines = this.teamDrafts[g.id].split('\n').map((l) => l.trim()).filter(Boolean);
    const ok = await this.run(async () => {
      for (const line of lines) {
        const [name, school] = line.split(';').map((s) => s.trim());
        await this.api.send('POST', '/teams', { name, schoolName: school || undefined, groupId: g.id });
      }
    });
    if (ok) this.teamDrafts[g.id] = '';
  }

  async editTeam(t: Team) {
    const d = await this.prompt("Modifier l'équipe", [
      { name: 'name', value: t.name, placeholder: 'Nom' },
      { name: 'school', value: t.school?.name ?? '', placeholder: 'École' },
    ]);
    if (d?.['name']) {
      await this.run(() =>
        this.api.send('PUT', `/teams/${t.id}`, { name: d['name'], schoolName: d['school'] || undefined, teacherId: t.teacherId, groupId: t.groupId }),
      );
    }
  }

  async createMatch(g: Group) {
    const d = this.draft(g);
    const body = {
      groupId: g.id,
      teamIds: d.teamIds,
      tableNumber: d.tableNumber ? Number(d.tableNumber) : undefined,
      scheduledAt: d.scheduledAt ? new Date(d.scheduledAt).toISOString() : undefined,
    };
    if (await this.run(() => this.api.send('POST', '/matches', body))) this.matchDrafts[g.id] = { teamIds: [] };
  }

  async editTournament() {
    const t = this.data.value()!;
    const d = await this.prompt('Modifier le tournoi', [
      { name: 'name', value: t.name, placeholder: 'Nom' },
      { name: 'date', type: 'date', value: t.date?.slice(0, 10) ?? '' },
      { name: 'location', value: t.location ?? '', placeholder: 'Lieu' },
    ]);
    if (d?.['name']) {
      await this.run(() =>
        this.api.send('PUT', `/tournaments/${t.id}`, { name: d['name'], date: d['date'] || undefined, location: d['location'] || undefined }),
      );
    }
  }

  async remove(path: string, name: string) {
    if (confirm(`Supprimer ${name} ? Les éléments rattachés (équipes, matchs, scores) seront aussi supprimés.`)) {
      await this.run(() => this.api.send('DELETE', path));
    }
  }

  private async prompt(header: string, inputs: { name: string; value?: string; placeholder?: string; type?: 'date' }[]) {
    const alert = await this.alerts.create({ header, inputs, buttons: [{ text: 'Annuler', role: 'cancel' }, { text: 'OK', role: 'ok' }] });
    await alert.present();
    const { data, role } = await alert.onDidDismiss<{ values: Record<string, string> }>();
    return role === 'ok' ? data?.values : undefined;
  }

  private async run(action: () => Promise<unknown>): Promise<boolean> {
    try {
      await action();
      return true;
    } catch (e) {
      await (await this.toasts.create({ message: (e as Error).message, duration: 4000, color: 'danger' })).present();
      return false;
    } finally {
      this.data.reload();
    }
  }
}
