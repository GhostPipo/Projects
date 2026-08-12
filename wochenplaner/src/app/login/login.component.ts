import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { TaskService } from '../services/task.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  username: string = '';
  password: string = '';
  errorMessage: string = '';

  constructor(private authService: AuthService, private taskService: TaskService, private router: Router) {}

  ngOnInit() {
    // Wenn bereits eingeloggt, weiterleiten
    if (this.authService.getToken()) {
      console.log('LoginComponent: Bereits eingeloggt, Weiterleitung zu /task');
      this.router.navigate(['/task']);
    }
  }

  onLogin() {
    if (this.authService.login(this.username, this.password)) {
      // Nach erfolgreichem Login: Tasks neu laden für den aktuellen Benutzer
      this.taskService.refreshTasksForCurrentUser();
      this.router.navigate(['/task']);
    } else {
      this.errorMessage = 'Login fehlgeschlagen. Bitte gültige Daten eingeben.';
    }
  }
}