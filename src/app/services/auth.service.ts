import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private tokenKey = 'token';
    private loggedInSubject = new BehaviorSubject<boolean>(this.hasToken());
    isLoggedIn$ = this.loggedInSubject.asObservable();

    setToken(token: string): void {
        localStorage.setItem(this.tokenKey, token);
        console.log('🔑 setToken llamado, emitiendo true');
        this.loggedInSubject.next(true);
    }

    getToken(): string | null {
        return localStorage.getItem(this.tokenKey);
    }

    logout(): void {
        localStorage.removeItem(this.tokenKey);
        console.log('🚪 logout llamado, emitiendo false');
        this.loggedInSubject.next(false);
    }

    private hasToken(): boolean {
        const has = !!localStorage.getItem(this.tokenKey);
        console.log('📦 hasToken:', has);
        return has;
    }
    isLoggedIn(): boolean {
        return !!localStorage.getItem(this.tokenKey);
    }
}






