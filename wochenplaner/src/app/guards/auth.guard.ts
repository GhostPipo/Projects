import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    const token = this.authService.getToken();
    console.log('AuthGuard: Token gefunden:', !!token);
    if (token) {
      console.log('AuthGuard: Zugriff erlaubt');
      return true;
    } else {
      console.log('AuthGuard: Zugriff verweigert, Weiterleitung zu /login');
      this.router.navigate(['/login']);
      return false;
    }
  }
}