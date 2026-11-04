import { Component, inject, input, signal, viewChild, OnInit } from '@angular/core';
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
  IonCheckbox,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,



  IonModal,
  IonNote,
  IonSelect,
  IonSelectOption,
  IonSpinner,

  IonTextarea,
  IonTitle,
  IonToggle,
  IonToolbar,
  ToastController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowDownOutline, arrowUpOutline, closeOutline, copyOutline, imageOutline, trashOutline } from 'ionicons/icons';
import { validateSheet, type ItemDef, type MissionDef, type RuleDef, type Sheet } from '@contest/scoring';
import { ApiService, type Contest } from '../api.service';

type Form = Omit<Contest, 'id' | 'description'> & { description: string };

const uid = (prefix: string) => prefix + Math.random().toString(36).slice(2, 7);

const newItem = (type: ItemDef['type']): ItemDef =>
  type === 'check'
    ? { id: uid('i'), type, label: '', points: 10 }
    : type === 'counter'
      ? { id: uid('i'), type, label: '', points: 5, max: 4 }
      : { id: uid('i'), type, label: '', options: [{ label: 'Réussi', points: 20 }, { label: 'Partiel', points: 10 }] };

const newMission = (n: number): MissionDef => ({ id: uid('m'), title: `Mission ${n}`, items: [newItem('check')] });

/** Moves an element of `list` by `delta` positions, in place. */
const move = <T,>(list: T[], index: number, delta: number) => {
  const to = index + delta;
  if (to < 0 || to >= list.length) return;
  [list[index], list[to]] = [list[to], list[index]];
};

@Component({
  selector: 'app-contest-editor',
  imports: [
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
    IonInput,
    IonTextarea,
    IonSelect,
    IonSelectOption,
    IonToggle,
    IonCheckbox,
    IonNote,
    IonSpinner,
    IonModal,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="dark">
        <ion-buttons slot="start"><ion-back-button defaultHref="/admin"></ion-back-button></ion-buttons>
        <ion-title>{{ isNew() ? 'Nouveau concours' : 'Modifier le concours' }}</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="jsonOpen.set(true)">JSON</ion-button>
          @if (!isNew()) {
            <ion-button (click)="preview()">Aperçu</ion-button>
          }
          <ion-button fill="solid" color="primary" [disabled]="saving()" (click)="save()">Enregistrer</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      @if (form(); as f) {
        <div class="narrow">
          @if (errors().length) {
            <ion-card color="danger">
              <ion-card-content>
                @for (e of errors(); track $index) { <div>{{ e }}</div> }
              </ion-card-content>
            </ion-card>
          }

          <ion-card>
            <ion-card-content>
              <div class="grid2">
                <ion-input label="Nom" labelPlacement="stacked" [(ngModel)]="f.name" placeholder="Défi robotique 2026 - Cycle 3"></ion-input>
                <ion-input label="Saison" labelPlacement="stacked" [(ngModel)]="f.season" placeholder="2025-2026"></ion-input>
                <ion-input label="Durée du match en secondes (0 = chronomètre libre)" labelPlacement="stacked" type="number" min="0" [(ngModel)]="f.sheet.durationSeconds"></ion-input>
                <ion-input label="Points retirés par pénalité" labelPlacement="stacked" type="number" min="0" [(ngModel)]="f.sheet.penaltyPoints"></ion-input>
                <ion-input label="Maximum de pénalités (vide = illimité)" labelPlacement="stacked" type="number" min="0" [(ngModel)]="f.sheet.maxPenalties"></ion-input>
              </div>
              <ion-textarea label="Description" labelPlacement="stacked" [autoGrow]="true" [(ngModel)]="f.description"></ion-textarea>
              <ion-toggle [(ngModel)]="f.sheet.timeTiebreak" justify="start">En cas d'égalité de points, départager au temps (le plus rapide gagne)</ion-toggle>
              <ion-toggle [(ngModel)]="f.published" justify="start">Publié (visible dans l'appli)</ion-toggle>
            </ion-card-content>
          </ion-card>

          @for (m of f.sheet.missions; track m.id; let mi = $index) {
            <ion-card class="mission">
              <ion-card-header>
                <div class="row">
                  <ion-card-title>{{ mi + 1 }}. {{ m.title || 'Sans titre' }}</ion-card-title>
                  <span class="spacer"></span>
                  <ion-button fill="clear" size="small" (click)="move(f.sheet.missions, mi, -1)" aria-label="Monter"><ion-icon slot="icon-only" name="arrow-up-outline"></ion-icon></ion-button>
                  <ion-button fill="clear" size="small" (click)="move(f.sheet.missions, mi, 1)" aria-label="Descendre"><ion-icon slot="icon-only" name="arrow-down-outline"></ion-icon></ion-button>
                  <ion-button fill="clear" size="small" (click)="duplicateMission(mi)" aria-label="Dupliquer"><ion-icon slot="icon-only" name="copy-outline"></ion-icon></ion-button>
                  <ion-button fill="clear" size="small" color="danger" (click)="removeMission(mi)" aria-label="Supprimer"><ion-icon slot="icon-only" name="trash-outline"></ion-icon></ion-button>
                </div>
              </ion-card-header>
              <ion-card-content>
                <div class="grid-img">
                  <div>
                    <ion-input label="Titre" labelPlacement="stacked" [(ngModel)]="m.title"></ion-input>
                    <ion-textarea label="Explication / règles (optionnel)" labelPlacement="stacked" [autoGrow]="true" [(ngModel)]="m.description"></ion-textarea>
                  </div>
                  <div class="img-box">
                    @if (api.imageUrl(m.image); as img) {
                      <img [src]="img" alt="" />
                      <ion-button size="small" fill="clear" color="danger" (click)="m.image = undefined">Retirer</ion-button>
                    } @else {
                      <label class="upload">
                        <ion-icon name="image-outline"></ion-icon> Image
                        <input type="file" accept="image/*" hidden (change)="upload($event, m)" />
                      </label>
                    }
                  </div>
                </div>

                <h3>Lignes de score</h3>
                @for (it of m.items; track it.id; let ii = $index) {
                  <div class="item">
                    <div class="item-head">
                      <ion-select label="Type" labelPlacement="stacked" interface="popover" [value]="it.type" (ionChange)="changeType(m, ii, $event.detail.value)">
                        <ion-select-option value="check">Case à cocher</ion-select-option>
                        <ion-select-option value="counter">Compteur</ion-select-option>
                        <ion-select-option value="choice">Choix unique</ion-select-option>
                      </ion-select>
                      <ion-input class="grow" label="Libellé" labelPlacement="stacked" [(ngModel)]="it.label"></ion-input>
                      @switch (it.type) {
                        @case ('check') {
                          <ion-input class="num" label="Points" labelPlacement="stacked" type="number" [(ngModel)]="it.points"></ion-input>
                        }
                        @case ('counter') {
                          <ion-input class="num" label="Points / unité" labelPlacement="stacked" type="number" [(ngModel)]="it.points"></ion-input>
                          <ion-input class="num" label="Maximum" labelPlacement="stacked" type="number" min="1" [(ngModel)]="it.max"></ion-input>
                        }
                      }
                      <label class="upload small" [title]="it.image ? 'Changer l’image' : 'Ajouter une image'">
                        @if (api.imageUrl(it.image); as img) { <img [src]="img" alt="" /> } @else { <ion-icon name="image-outline"></ion-icon> }
                        <input type="file" accept="image/*" hidden (change)="upload($event, it)" />
                      </label>
                      <ion-button fill="clear" size="small" (click)="move(m.items, ii, -1)" aria-label="Monter"><ion-icon slot="icon-only" name="arrow-up-outline"></ion-icon></ion-button>
                      <ion-button fill="clear" size="small" (click)="move(m.items, ii, 1)" aria-label="Descendre"><ion-icon slot="icon-only" name="arrow-down-outline"></ion-icon></ion-button>
                      <ion-button fill="clear" size="small" color="danger" (click)="removeItem(m, ii)" aria-label="Supprimer la ligne"><ion-icon slot="icon-only" name="trash-outline"></ion-icon></ion-button>
                    </div>
                    @if (it.type === 'choice') {
                      <div class="options">
                        @for (o of it.options; track $index; let oi = $index) {
                          <div class="row">
                            <ion-input class="grow" [label]="'Choix ' + (oi + 1)" labelPlacement="stacked" [(ngModel)]="o.label"></ion-input>
                            <ion-input class="num" label="Points" labelPlacement="stacked" type="number" [(ngModel)]="o.points"></ion-input>
                            <ion-button fill="clear" size="small" color="danger" (click)="it.options.splice(oi, 1)" aria-label="Retirer ce choix"><ion-icon slot="icon-only" name="close-outline"></ion-icon></ion-button>
                          </div>
                        }
                        <ion-button size="small" fill="outline" (click)="it.options.push({ label: '', points: 0 })">+ Choix</ion-button>
                      </div>
                    }
                  </div>
                }
                <div class="row">
                  <ion-button size="small" (click)="m.items.push(newItem('check'))">+ Case à cocher</ion-button>
                  <ion-button size="small" (click)="m.items.push(newItem('counter'))">+ Compteur</ion-button>
                  <ion-button size="small" (click)="m.items.push(newItem('choice'))">+ Choix unique</ion-button>
                </div>

                <details class="advanced" [open]="!!m.maxObjects || !!m.rules?.length">
                  <summary>Options avancées</summary>
                  <ion-toggle justify="start" [checked]="!!m.maxObjects" (ionChange)="toggleMaxObjects(m, $event.detail.checked)">
                    Limiter le nombre total d'objets (sinon la mission vaut 0)
                  </ion-toggle>
                  @if (m.maxObjects; as lim) {
                    <div class="limit">
                      <ion-input class="num" label="Maximum" labelPlacement="stacked" type="number" min="1" [(ngModel)]="lim.max"></ion-input>
                      @for (it of m.items; track it.id) {
                        <ion-checkbox justify="start" [checked]="lim.items.includes(it.id)" (ionChange)="toggleIn(lim.items, it.id, $event.detail.checked)">{{ it.label || '(sans libellé)' }}</ion-checkbox>
                      }
                    </div>
                  }

                  <h4>Règles bonus / combinaisons</h4>
                  <ion-note>Ex. : « si choix 1 = Réussi ET choix 2 = Réussi alors +10 points ». Points négatifs possibles.</ion-note>
                  @for (r of m.rules ?? []; track $index; let ri = $index) {
                    <div class="rule">
                      <div class="row">
                        <ion-input class="grow" label="Nom de la règle" labelPlacement="stacked" [(ngModel)]="r.label"></ion-input>
                        <ion-input class="num" label="Points ajoutés" labelPlacement="stacked" type="number" [(ngModel)]="r.add"></ion-input>
                        <ion-button fill="clear" size="small" color="danger" (click)="m.rules!.splice(ri, 1)" aria-label="Supprimer la règle"><ion-icon slot="icon-only" name="trash-outline"></ion-icon></ion-button>
                      </div>
                      @for (c of r.when; track $index; let ci = $index) {
                        <div class="row">
                          <ion-note>{{ ci === 0 ? 'Si' : 'et' }}</ion-note>
                          <ion-select class="grow" interface="popover" [(ngModel)]="c.item" (ionChange)="c.equals = defaultEquals(m, c.item)" placeholder="Ligne">
                            @for (it of m.items; track it.id) {
                              <ion-select-option [value]="it.id">{{ it.label || '(sans libellé)' }}</ion-select-option>
                            }
                          </ion-select>
                          @switch (itemOf(m, c.item)?.type) {
                            @case ('check') {
                              <ion-select interface="popover" [(ngModel)]="c.equals">
                                <ion-select-option [value]="true">est cochée</ion-select-option>
                                <ion-select-option [value]="false">n'est pas cochée</ion-select-option>
                              </ion-select>
                            }
                            @case ('choice') {
                              <ion-select interface="popover" [(ngModel)]="c.equals">
                                @for (o of $any(itemOf(m, c.item)).options; track $index) {
                                  <ion-select-option [value]="$index">= {{ o.label }}</ion-select-option>
                                }
                              </ion-select>
                            }
                            @case ('counter') {
                              <ion-input class="num" type="number" label="vaut" [(ngModel)]="c.equals"></ion-input>
                            }
                          }
                          <ion-button fill="clear" size="small" color="danger" (click)="r.when.splice(ci, 1)" aria-label="Retirer la condition"><ion-icon slot="icon-only" name="close-outline"></ion-icon></ion-button>
                        </div>
                      }
                      <ion-button size="small" fill="outline" (click)="r.when.push({ item: m.items[0].id, equals: defaultEquals(m, m.items[0].id) })">+ Condition</ion-button>
                    </div>
                  }
                  <ion-button size="small" fill="outline" (click)="addRule(m)">+ Règle</ion-button>
                </details>
              </ion-card-content>
            </ion-card>
          }
          <ion-button expand="block" fill="outline" (click)="f.sheet.missions.push(newMission(f.sheet.missions.length + 1))">+ Ajouter une mission</ion-button>
        </div>

        <ion-modal [isOpen]="jsonOpen()" (didDismiss)="jsonOpen.set(false)">
          <ng-template>
            <ion-header>
              <ion-toolbar>
                <ion-title>Import / export JSON</ion-title>
                <ion-buttons slot="end"><ion-button (click)="jsonOpen.set(false)">Fermer</ion-button></ion-buttons>
              </ion-toolbar>
            </ion-header>
            <ion-content class="ion-padding">
              <p>Copiez ce texte pour sauvegarder la feuille, ou collez-en une autre puis « Appliquer ».</p>
              <ion-textarea class="json" [value]="json()" (ionInput)="jsonDraft = $any($event).detail.value" [rows]="18"></ion-textarea>
              <ion-button (click)="applyJson()">Appliquer</ion-button>
            </ion-content>
          </ng-template>
        </ion-modal>
      } @else {
        <div class="ion-text-center"><ion-spinner></ion-spinner></div>
      }
    </ion-content>
  `,
  styles: `
    .row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .spacer { flex: 1; }
    .grow { flex: 1; min-width: 160px; }
    .num { max-width: 110px; }
    .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0 16px; }
    .grid-img { display: grid; grid-template-columns: 1fr 160px; gap: 16px; }
    .img-box img { width: 100%; border-radius: 6px; }
    .upload { display: inline-flex; align-items: center; gap: 4px; cursor: pointer; border: 1px dashed var(--ion-color-medium); border-radius: 6px; padding: 8px; }
    .upload.small { padding: 4px; width: 44px; height: 44px; justify-content: center; }
    .upload.small img { width: 100%; height: 100%; object-fit: cover; }
    .item { border-left: 3px solid var(--ion-color-primary); padding-left: 8px; margin: 8px 0; }
    .item-head { display: flex; align-items: end; gap: 8px; flex-wrap: wrap; }
    .item-head ion-select { max-width: 160px; }
    .options { padding-left: 24px; }
    .advanced { margin-top: 12px; }
    .advanced summary { cursor: pointer; font-weight: bold; }
    .limit, .rule { padding-left: 16px; margin: 8px 0; }
    .rule { border-left: 3px solid var(--ion-color-secondary); }
    .json { font-family: monospace; font-size: 12px; }
    @media (max-width: 600px) { .grid2, .grid-img { grid-template-columns: 1fr; } }
  `,
})
export class ContestEditorPage implements OnInit {
  api = inject(ApiService);
  private router = inject(Router);
  private toasts = inject(ToastController);

  id = input.required<string>();
  isNew = () => this.id() === 'new';
  form = signal<Form | null>(null);
  errors = signal<string[]>([]);
  private content = viewChild.required(IonContent);
  saving = signal(false);
  jsonOpen = signal(false);
  jsonDraft = '';

  newItem = newItem;
  newMission = newMission;
  move = move;

  constructor() {
    addIcons({ arrowUpOutline, arrowDownOutline, copyOutline, trashOutline, closeOutline, imageOutline });
  }

  async ngOnInit() {
    if (this.isNew()) {
      this.form.set({
        name: '',
        season: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
        description: '',
        published: false,
        sheet: { durationSeconds: 180, penaltyPoints: 5, missions: [newMission(1)] },
      });
      return;
    }
    try {
      const c = await this.api.get<Contest>(`/contests/${this.id()}`);
      this.form.set({ name: c.name, season: c.season, description: c.description ?? '', published: c.published, sheet: c.sheet });
    } catch (e) {
      this.errors.set([(e as Error).message]);
    }
  }

  json() {
    return JSON.stringify(this.form()?.sheet, null, 2);
  }

  applyJson() {
    try {
      const sheet = JSON.parse(this.jsonDraft || this.json()) as Sheet;
      const errors = validateSheet(sheet);
      if (errors.length) return this.errors.set(errors);
      this.form.update((f) => f && { ...f, sheet });
      this.errors.set([]);
      this.jsonOpen.set(false);
    } catch {
      this.errors.set(['JSON invalide.']);
      this.jsonOpen.set(false);
    }
  }

  itemOf(m: MissionDef, id: string) {
    return m.items.find((i) => i.id === id);
  }

  defaultEquals(m: MissionDef, id: string): boolean | number {
    const t = this.itemOf(m, id)?.type;
    return t === 'check' ? true : t === 'choice' ? 0 : 1;
  }

  changeType(m: MissionDef, index: number, type: ItemDef['type']) {
    const old = m.items[index];
    if (old.type === type) return;
    m.items[index] = { ...newItem(type), id: old.id, label: old.label, image: old.image } as ItemDef;
  }

  removeItem(m: MissionDef, index: number) {
    const [removed] = m.items.splice(index, 1);
    if (m.maxObjects) m.maxObjects.items = m.maxObjects.items.filter((id) => id !== removed.id);
    m.rules = m.rules?.map((r) => ({ ...r, when: r.when.filter((c) => c.item !== removed.id) }));
  }

  duplicateMission(index: number) {
    const missions = this.form()!.sheet.missions;
    const copy = structuredClone(missions[index]);
    // New ids so the copy's answers never collide with the original.
    const ids = new Map(copy.items.map((i) => [i.id, uid('i')]));
    copy.id = uid('m');
    copy.title += ' (copie)';
    copy.items.forEach((i) => (i.id = ids.get(i.id)!));
    if (copy.maxObjects) copy.maxObjects.items = copy.maxObjects.items.map((id) => ids.get(id) ?? id);
    copy.rules?.forEach((r) => r.when.forEach((c) => (c.item = ids.get(c.item) ?? c.item)));
    missions.splice(index + 1, 0, copy);
  }

  removeMission(index: number) {
    const m = this.form()!.sheet.missions[index];
    if (confirm(`Supprimer la mission « ${m.title} » ?`)) this.form()!.sheet.missions.splice(index, 1);
  }

  toggleMaxObjects(m: MissionDef, on: boolean) {
    m.maxObjects = on ? { max: 4, items: m.items.filter((i) => i.type === 'counter').map((i) => i.id) } : undefined;
  }

  toggleIn(list: string[], id: string, on: boolean) {
    const i = list.indexOf(id);
    if (on && i < 0) list.push(id);
    if (!on && i >= 0) list.splice(i, 1);
  }

  addRule(m: MissionDef) {
    const first = m.items[0];
    const rule: RuleDef = { label: '', add: 10, when: [{ item: first.id, equals: this.defaultEquals(m, first.id) }] };
    (m.rules ??= []).push(rule);
  }

  async upload(event: Event, target: { image?: string }) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    try {
      target.image = await this.api.upload(file);
      this.form.update((f) => f && { ...f });
    } catch (e) {
      await this.toast((e as Error).message, 'danger');
    }
  }

  preview() {
    void this.router.navigate(['/sheet', this.id()]);
  }

  async save() {
    const f = this.form()!;
    // ion-input type=number still yields strings: normalise before validating.
    const sheet = JSON.parse(JSON.stringify(f.sheet), (key, v) =>
      ['points', 'max', 'add', 'durationSeconds', 'penaltyPoints', 'maxPenalties'].includes(key) && v !== '' && v !== null ? Number(v) : v,
    ) as Sheet;
    if (!sheet.timeTiebreak) delete sheet.timeTiebreak;
    if ((sheet.maxPenalties as unknown) === '' || sheet.maxPenalties === null || sheet.maxPenalties === 0) delete sheet.maxPenalties;
    sheet.missions.forEach((m) => m.rules?.forEach((r) => r.when.forEach((c) => typeof c.equals === 'string' && (c.equals = Number(c.equals)))));
    const errors = [...(f.name.trim() ? [] : ['Le nom est obligatoire.']), ...validateSheet(sheet)];
    this.errors.set(errors);
    if (errors.length) return void this.content().scrollToTop(300);

    this.saving.set(true);
    try {
      const body = { ...f, sheet, description: f.description || undefined };
      const saved = this.isNew()
        ? await this.api.send<Contest>('POST', '/contests', body)
        : await this.api.send<Contest>('PUT', `/contests/${this.id()}`, body);
      await this.toast('Concours enregistré', 'success');
      if (this.isNew()) await this.router.navigate(['/admin/contest', saved.id], { replaceUrl: true });
    } catch (e) {
      this.errors.set((e as Error).message.split('\n'));
      void this.content().scrollToTop(300);
    } finally {
      this.saving.set(false);
    }
  }

  private async toast(message: string, color: string) {
    await (await this.toasts.create({ message, color, duration: 2500 })).present();
  }
}
