// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { Task } from './task/task'; // Die Haupt-Task-Komponente
import { Plan } from './plan/plan'; // Die Haupt-Plan-Komponente (bitte Dateiname prüfen)
import { LoginComponent } from './login/login.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  // Login-Route ohne Guard
  { path: 'login', component: LoginComponent },

  // Geschützte Routen
  { path: 'task', component: Task, canActivate: [AuthGuard] },
  { path: 'plan', component: Plan, canActivate: [AuthGuard] },

  // Standard-Umleitung, wenn die App startet
  { path: '', redirectTo: 'task', pathMatch: 'full' },

  // Wildcard-Route für 404 Fehler (optional, leitet zurück zu task)
  { path: '**', redirectTo: 'task' }
];