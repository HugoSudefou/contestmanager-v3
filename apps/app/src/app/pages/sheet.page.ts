import { Component, OnDestroy, computed, inject, input, resource, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  AlertController,
  IonBackButton,
  IonBadge,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonCheckbox,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonNote,
  IonRadio,
  IonRadioGroup,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
  ToastController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { addOutline, pauseOutline, playOutline, refreshOutline, removeOutline } from 'ionicons/icons';
import { computeSheet, type Answers, type ItemValue } from '@contest/scoring';
import { ApiService, formatTime, practiceHistory, type Contest } from '../api.service';

@Component({
  selector: 'app-sheet',
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonButton,
    IonIcon,
    IonContent,
    IonFooter,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonList,
    IonItem,
    IonLabel,
    IonNote,
    IonCheckbox,
    IonRadioGroup,
    IonRadio,
    IonBadge,
    IonModal,
    IonSpinner,
    IonText,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start"><ion-back-button [defaultHref]="backUrl()"></ion-back-button></ion-buttons>
        <ion-title>{{ teamName() || (contest.hasValue() && contest.value().name) || 'Feuille de mission' }}</ion-title>
        <ion-buttons slot="end">
          @if (!running() && elapsed() > 0) {
            <ion-button (click)="resetTimer()" aria-label="Remettre le chrono à zéro"><ion-icon slot="icon-only" name="refresh-outline"></ion-icon></ion-button>
          }
          <ion-button (click)="toggleTimer()" [color]="finished() ? 'danger' : undefined" aria-label="Chrono">
            <ion-icon slot="start" [name]="running() ? 'pause-outline' : 'play-outline'"></ion-icon>
            {{ clock() }}
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
      @if (result(); as r) {
        <ion-toolbar color="light">
          <div class="total">
            <span>Pénalités : {{ penalties() }} (−{{ r.penalties }})</span>
            <strong>Total : {{ r.total }} pts</strong>
          </div>
        </ion-toolbar>
      }
    </ion-header>

    <ion-content>
      @if (contest.isLoading()) {
        <div class="ion-text-center ion-padding"><ion-spinner></ion-spinner></div>
      } @else if (contest.error()) {
        <ion-text color="danger"><p class="ion-padding">{{ contest.error()?.message }}</p></ion-text>
      } @else if (contest.value(); as c) {
        <div class="narrow">
          @if (c.description) {
            <ion-card>
              <ion-card-content>
                <details class="intro">
                  <summary>Présentation du défi</summary>
                  <p>{{ c.description }}</p>
                </details>
              </ion-card-content>
            </ion-card>
          }
          <ion-card>
            <ion-item lines="none">
              <ion-label>
                <h2>Pénalités</h2>
                <p>{{ c.sheet.penaltyPoints }} points retirés par pénalité@if (c.sheet.maxPenalties) { (maximum {{ c.sheet.maxPenalties }})}</p>
              </ion-label>
              <div class="counter" slot="end">
                <ion-button fill="outline" (click)="penalties.set(Math.max(0, penalties() - 1))" aria-label="Retirer une pénalité"><ion-icon slot="icon-only" name="remove-outline"></ion-icon></ion-button>
                <span class="count">{{ penalties() }}</span>
                <ion-button fill="outline" (click)="penalties.set(c.sheet.maxPenalties ? Math.min(c.sheet.maxPenalties, penalties() + 1) : penalties() + 1)" [disabled]="!!c.sheet.maxPenalties && penalties() >= c.sheet.maxPenalties" aria-label="Ajouter une pénalité"><ion-icon slot="icon-only" name="add-outline"></ion-icon></ion-button>
              </div>
            </ion-item>
          </ion-card>

          @for (m of c.sheet.missions; track m.id; let i = $index) {
            <ion-card>
              @if (api.imageUrl(m.image); as img) {
                <img [src]="img" alt="" class="mission-img" (click)="zoom.set(img)" />
              }
              <ion-card-header>
                <ion-card-subtitle>
                  <ion-badge [color]="result()?.missions?.[i]?.error ? 'warning' : 'primary'">{{ result()?.missions?.[i]?.points ?? 0 }} pts</ion-badge>
                </ion-card-subtitle>
                <ion-card-title>{{ m.title }}</ion-card-title>
              </ion-card-header>
              <ion-card-content>
                @if (m.description) {
                  <p class="desc">{{ m.description }}</p>
                }
                <ion-list>
                  @for (item of m.items; track item.id) {
                    @switch (item.type) {
                      @case ('check') {
                        <ion-item>
                          @if (api.imageUrl(item.image); as img) {
                            <img slot="start" [src]="img" alt="" class="thumb" (click)="zoom.set(img)" />
                          }
                          <ion-checkbox justify="space-between" [checked]="value(m.id, item.id) === true" (ionChange)="set(m.id, item.id, $event.detail.checked)">
                            <span class="wrap">{{ item.label }}</span> <ion-note>{{ item.points }} pts</ion-note>
                          </ion-checkbox>
                        </ion-item>
                      }
                      @case ('counter') {
                        <ion-item>
                          @if (api.imageUrl(item.image); as img) {
                            <img slot="start" [src]="img" alt="" class="thumb" (click)="zoom.set(img)" />
                          }
                          <ion-label class="ion-text-wrap">
                            {{ item.label }}
                            <p>{{ item.points }} pts × {{ count(m.id, item.id) }} (max {{ item.max }})</p>
                          </ion-label>
                          <div class="counter" slot="end">
                            <ion-button fill="outline" [disabled]="count(m.id, item.id) === 0" (click)="set(m.id, item.id, count(m.id, item.id) - 1)" aria-label="Moins"><ion-icon slot="icon-only" name="remove-outline"></ion-icon></ion-button>
                            <span class="count">{{ count(m.id, item.id) }}</span>
                            <ion-button fill="outline" [disabled]="count(m.id, item.id) >= item.max" (click)="set(m.id, item.id, count(m.id, item.id) + 1)" aria-label="Plus"><ion-icon slot="icon-only" name="add-outline"></ion-icon></ion-button>
                          </div>
                        </ion-item>
                      }
                      @case ('choice') {
                        <ion-radio-group [allowEmptySelection]="true" [value]="value(m.id, item.id)" (ionChange)="set(m.id, item.id, $event.detail.value ?? null)">
                          <ion-item lines="none"><ion-label class="ion-text-wrap"><strong>{{ item.label }}</strong></ion-label></ion-item>
                          @for (o of item.options; track $index) {
                            <ion-item>
                              <ion-radio [value]="$index" justify="space-between">
                                <span class="wrap">{{ o.label }}</span> <ion-note>{{ o.points }} pts</ion-note>
                              </ion-radio>
                            </ion-item>
                          }
                        </ion-radio-group>
                      }
                    }
                  }
                </ion-list>
                @if (result()?.missions?.[i]?.error; as err) {
                  <ion-text color="warning"><p class="error">{{ err }}</p></ion-text>
                }
              </ion-card-content>
            </ion-card>
          }
        </div>
      }

      <ion-modal [isOpen]="!!zoom()" (didDismiss)="zoom.set(null)">
        <ng-template>
          <ion-content (click)="zoom.set(null)">
            <img [src]="zoom()" alt="" class="zoomed" />
          </ion-content>
        </ng-template>
      </ion-modal>
    </ion-content>

    <ion-footer>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-button color="medium" (click)="reset()">Réinitialiser</ion-button></ion-buttons>
        <ion-buttons slot="end">
          <ion-button fill="solid" color="primary" [disabled]="!contest.hasValue() || saving()" (click)="save()">
            {{ matchId() ? 'Envoyer le score' : 'Enregistrer' }}
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-footer>
  `,
  styles: `
    .intro summary { cursor: pointer; font-weight: 600; }
    .intro p { white-space: pre-line; margin: 8px 0 0; }
    .total { display: flex; justify-content: space-between; padding: 0 16px; font-size: 1.1rem; }
    .mission-img { width: 100%; max-height: 220px; object-fit: cover; cursor: zoom-in; }
    .thumb { width: 56px; height: 56px; object-fit: cover; border-radius: 4px; cursor: zoom-in; }
    .counter { display: flex; align-items: center; gap: 4px; }
    .count { min-width: 2ch; text-align: center; font-size: 1.3rem; font-weight: bold; }
    .wrap { white-space: normal; margin-right: 8px; }
    .desc { white-space: pre-line; margin-bottom: 8px; }
    .error { font-weight: bold; }
    .zoomed { width: 100%; height: 100%; object-fit: contain; }
  `,
})
export class SheetPage implements OnDestroy {
  api = inject(ApiService);
  private router = inject(Router);
  private alerts = inject(AlertController);
  private toasts = inject(ToastController);
  protected Math = Math;

  contestId = input.required<string>();
  // Referee mode when these come from the tournament page.
  match = input<string>();
  team = input<string>();
  teamName = input<string>();
  tournament = input<string>();
  matchId = computed(() => Number(this.match()) || null);

  contest = resource({
    params: () => this.contestId(),
    loader: ({ params }) => this.api.get<Contest>(`/contests/${params}`),
  });

  answers = signal<Answers>({});
  penalties = signal(0);
  elapsed = signal(0);
  running = signal(false);
  saving = signal(false);
  zoom = signal<string | null>(null);
  private timer?: ReturnType<typeof setInterval>;
  /** Wall-clock start of the current run and seconds already counted before it (pause / resume). */
  private startedAt = 0;
  private counted = 0;

  result = computed(() => {
    const c = this.contest.hasValue() ? this.contest.value() : null;
    return c ? computeSheet(c.sheet, this.answers(), this.penalties()) : null;
  });
  duration = computed(() => (this.contest.hasValue() ? this.contest.value().sheet.durationSeconds : 0));
  finished = computed(() => this.elapsed() >= this.duration() && this.duration() > 0);
  clock = computed(() => formatTime(this.elapsed()));
  backUrl = computed(() => (this.tournament() ? `/tournament/${this.tournament()}?mode=referee` : '/training'));

  constructor() {
    addIcons({ addOutline, removeOutline, playOutline, pauseOutline, refreshOutline });
  }

  value(missionId: string, itemId: string): ItemValue {
    return this.answers()[missionId]?.[itemId] ?? null;
  }

  count(missionId: string, itemId: string): number {
    const v = this.value(missionId, itemId);
    return typeof v === 'number' ? v : 0;
  }

  set(missionId: string, itemId: string, value: ItemValue) {
    this.answers.update((a) => ({ ...a, [missionId]: { ...a[missionId], [itemId]: value } }));
  }

  toggleTimer() {
    if (this.running()) return this.stopTimer();
    if (this.finished()) this.elapsed.set(0);
    this.running.set(true);
    // Count from the wall clock (setInterval drifts): the time can split two teams with equal scores.
    this.counted = this.elapsed();
    this.startedAt = Date.now();
    this.timer = setInterval(() => {
      const s = this.counted + Math.floor((Date.now() - this.startedAt) / 1000);
      this.elapsed.set(this.duration() > 0 ? Math.min(s, this.duration()) : s);
      if (this.finished()) {
        this.stopTimer();
        navigator.vibrate?.(800);
      }
    }, 250);
  }

  /** Free stopwatch: back to 00:00 without touching the answers (e.g. before the timed full run). */
  resetTimer() {
    this.stopTimer();
    this.elapsed.set(0);
  }

  private stopTimer() {
    clearInterval(this.timer);
    this.running.set(false);
  }

  async reset() {
    const alert = await this.alerts.create({
      header: 'Réinitialiser la feuille ?',
      message: 'Toutes les cases, les pénalités et le chrono seront remis à zéro.',
      buttons: [
        { text: 'Annuler', role: 'cancel' },
        {
          text: 'Réinitialiser',
          role: 'destructive',
          handler: () => {
            this.stopTimer();
            this.answers.set({});
            this.penalties.set(0);
            this.elapsed.set(0);
          },
        },
      ],
    });
    await alert.present();
  }

  async save() {
    this.stopTimer();
    const r = this.result()!;
    const summary = `Score : ${r.total} pts · Temps : ${this.elapsed() > 0 ? this.clock() : 'non chronométré'}`;
    const warnings = r.missions.filter((m) => m.error).length;
    const message = warnings ? `${summary}\n⚠ ${warnings} mission(s) avec une erreur de saisie.` : summary;

    if (this.matchId()) {
      const alert = await this.alerts.create({
        header: `Envoyer le score de ${this.teamName()} ?`,
        message,
        buttons: [{ text: 'Annuler', role: 'cancel' }, { text: 'Envoyer', handler: () => void this.sendScore(r.total) }],
      });
      return alert.present();
    }

    const alert = await this.alerts.create({
      header: 'Enregistrer le score',
      message,
      inputs: [{ name: 'team', placeholder: "Nom de l'équipe" }],
      buttons: [
        { text: 'Annuler', role: 'cancel' },
        {
          text: 'Enregistrer',
          handler: (data: { team: string }) => {
            if (!data.team?.trim()) return false;
            const c = this.contest.value()!;
            practiceHistory.add({
              contestId: c.id,
              contestName: c.name,
              team: data.team.trim(),
              total: r.total,
              timeSeconds: this.elapsed(),
              date: new Date().toISOString(),
            });
            void this.toast('Score enregistré sur ce téléphone');
            return true;
          },
        },
      ],
    });
    await alert.present();
  }

  private async sendScore(total: number) {
    this.saving.set(true);
    try {
      const sent = await this.api.submitScore({
        matchId: this.matchId()!,
        teamId: Number(this.team()),
        answers: this.answers(),
        penalties: this.penalties(),
        timeSeconds: this.elapsed(),
        label: `${this.teamName()} · match ${this.matchId()} · ${total} pts`,
      });
      await this.toast(sent ? 'Score envoyé' : 'Hors ligne : score gardé, il sera envoyé au retour du réseau', sent ? 'success' : 'warning');
      await this.router.navigateByUrl(this.backUrl(), { replaceUrl: true });
    } catch (e) {
      await this.toast((e as Error).message, 'danger');
    } finally {
      this.saving.set(false);
    }
  }

  private async toast(message: string, color?: string) {
    await (await this.toasts.create({ message, color, duration: 3000, position: 'top' })).present();
  }

  ngOnDestroy() {
    clearInterval(this.timer);
  }
}
