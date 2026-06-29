import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private tokenKey = 'token';
    private userKey = 'user';

    // 🔹 Estado de sesión
    private loggedInSubject = new BehaviorSubject<boolean>(this.hasToken());
    isLoggedIn$ = this.loggedInSubject.asObservable();

    // 🔹 Guardar token
    setToken(token: string): void {
        localStorage.setItem(this.tokenKey, token);
        this.loggedInSubject.next(true);
    }

    // 🔹 Obtener token
    getToken(): string | null {
        return localStorage.getItem(this.tokenKey);
    }

    // 🔹 Guardar datos de usuario
    setUser(user: any): void {
        localStorage.setItem(this.userKey, JSON.stringify(user));
    }

    // 🔹 Obtener datos de usuario
    getUser(): any | null {
        const user = localStorage.getItem(this.userKey);
        return user ? JSON.parse(user) : null;
    }

    // 🔹 Cerrar sesión
    logout(): void {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.userKey);
        this.loggedInSubject.next(false);
    }

    // 🔹 Helper privado
    private hasToken(): boolean {
        return !!localStorage.getItem(this.tokenKey);
    }

    // 🔹 Verificar sesión
    isLoggedIn(): boolean {
        return this.hasToken();
    }
}







