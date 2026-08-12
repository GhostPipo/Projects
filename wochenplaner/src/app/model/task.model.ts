// src/app/models/task.model.ts
export interface Task {
  id: number;
  title: string;
  day: 'montag' | 'dienstag' | 'mittwoch' | 'donnerstag' | 'freitag' | 'samstag' | 'sonntag';
  duration: number; // in Minuten (für die ALPEN-Methode)
  priority: 'low' | 'medium' | 'high'; // Grün, Orange, Rot
  isDone: boolean;
  yodaText?: string; // Für die Yoda-API
  username: string; // Der Benutzer, dem diese Task gehört
}