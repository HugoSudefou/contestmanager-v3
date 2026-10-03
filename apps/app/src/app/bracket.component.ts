import { Component, computed, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { roundName, type Match } from './api.service';

/** Final phase tree, one column per round (scrolls sideways on phones). */
@Component({
  selector: 'app-bracket',
  imports: [DatePipe],
  template: `
    <div class="bracket">
      @for (r of rounds(); track r.round) {
        <div class="round">
          <h3>{{ r.name }}</h3>
          <div class="matches">
          @for (m of r.matches; track m.id) {
            <div class="match">
              <small>Table {{ m.tableNumber }} · {{ m.scheduledAt | date: 'HH:mm' }}</small>
              @for (p of m.participants; track p.id) {
                <div class="team" [class.winner]="winnerId(m) === p.teamId">
                  <span>{{ p.team.name }}</span><strong>{{ p.score ?? '' }}</strong>
                </div>
              } @empty {
                <div class="team tbd">À déterminer</div>
              }
              @if (m.participants.length === 1) { <div class="team tbd">À déterminer</div> }
            </div>
          }
          </div>
        </div>
      }
    </div>
  `,
  styles: `
    .bracket { display: flex; gap: 12px; overflow-x: auto; padding: 8px 16px; }
    .round { min-width: 200px; display: flex; flex-direction: column; }
    .matches { flex: 1; display: flex; flex-direction: column; justify-content: space-around; gap: 8px; }
    h3 { font-size: 0.95rem; margin: 0 0 4px; text-align: center; }
    .match { border: 1px solid var(--ion-color-step-200, #ddd); border-radius: 8px; padding: 6px 8px; }
    .team { display: flex; justify-content: space-between; gap: 8px; padding: 2px 0; }
    .winner { font-weight: bold; color: var(--ion-color-success); }
    .tbd { color: var(--ion-color-medium); font-style: italic; }
  `,
})
export class BracketComponent {
  matches = input.required<Match[]>();

  rounds = computed(() => {
    const byRound = new Map<number, Match[]>();
    for (const m of this.matches()) if (m.round) byRound.set(m.round, [...(byRound.get(m.round) ?? []), m]);
    return [...byRound.entries()]
      .sort(([a], [b]) => b - a)
      .map(([round, matches]) => ({ round, name: roundName(round), matches: matches.sort((a, b) => a.bracketIndex! - b.bracketIndex!) }));
  });

  winnerId(m: Match): number | null {
    const scored = m.participants.filter((p) => p.score !== null);
    if (scored.length < 2 || scored.length !== m.participants.length) return null;
    const [first, second] = [...scored].sort((a, b) => b.score! - a.score!);
    return first.score === second.score ? null : first.teamId;
  }
}
