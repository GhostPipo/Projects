import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor() {}

  login(username: string, password: string): boolean {
    // Fake authentication: accept any username/password
    if (username && password) {
      const fakeToken = this.generateFakeToken();
      localStorage.setItem('authToken', fakeToken);
      localStorage.setItem('currentUser', username);
      console.log('AuthService: Token gespeichert:', fakeToken);
      console.log('AuthService: Benutzer gespeichert:', username);
      this.isAuthenticatedSubject.next(true);
      return true;
    }
    return false;
  }

  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    console.log('AuthService: Token entfernt');
    this.isAuthenticatedSubject.next(false);
  }

  private hasToken(): boolean {
    const token = !!localStorage.getItem('authToken');
    console.log('AuthService: Token vorhanden:', token);
    return token;
  }

  private generateFakeToken(): string {
    return 'fake-jwt-token-' + Math.random().toString(36).substr(2, 9);
  }

  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  getCurrentUser(): string | null {
    return localStorage.getItem('currentUser');
  }
}