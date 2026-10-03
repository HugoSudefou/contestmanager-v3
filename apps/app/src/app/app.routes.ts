import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';
import { ApiService, type Role } from './api.service';

const requireRole =
  (...roles: Role[]): CanActivateFn =>
  (_route, state) => {
    const user = inject(ApiService).user();
    return user && roles.includes(user.role)
      ? true
      : inject(Router).createUrlTree(['/login'], { queryParams: { redirect: state.url } });
  };

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/home.page').then((m) => m.HomePage) },
  { path: 'login', loadComponent: () => import('./pages/login.page').then((m) => m.LoginPage) },
  { path: 'settings', loadComponent: () => import('./pages/settings.page').then((m) => m.SettingsPage) },
  { path: 'training', loadComponent: () => import('./pages/training.page').then((m) => m.TrainingPage) },
  { path: 'tournaments', loadComponent: () => import('./pages/tournaments.page').then((m) => m.TournamentsPage) },
  {
    path: 'tournament/:id',
    loadComponent: () => import('./pages/tournament.page').then((m) => m.TournamentPage),
  },
  { path: 'team/:id', loadComponent: () => import('./pages/team.page').then((m) => m.TeamPage) },
  { path: 'sheet/:contestId', loadComponent: () => import('./pages/sheet.page').then((m) => m.SheetPage) },
  {
    path: 'admin',
    canActivate: [requireRole('ADMIN')],
    children: [
      { path: '', loadComponent: () => import('./admin/admin.page').then((m) => m.AdminPage) },
      { path: 'contest/:id', loadComponent: () => import('./admin/contest-editor.page').then((m) => m.ContestEditorPage) },
      {
        path: 'tournament/:id',
        loadComponent: () => import('./admin/tournament-admin.page').then((m) => m.TournamentAdminPage),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
