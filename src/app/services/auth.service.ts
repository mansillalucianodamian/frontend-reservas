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

    private getStorage(): Storage {
        if (typeof window !== 'undefined') {
            if (sessionStorage.getItem(this.tokenKey)) {
                return sessionStorage;
            }
        }
        return localStorage;
    }

    // 🔹 Guardar token
    setToken(token: string, rememberMe: boolean = true): void {
        const storage = rememberMe ? localStorage : sessionStorage;
        const otherStorage = rememberMe ? sessionStorage : localStorage;
        
        otherStorage.removeItem(this.tokenKey);
        storage.setItem(this.tokenKey, token);
        this.loggedInSubject.next(true);
    }

    // 🔹 Obtener token
    getToken(): string | null {
        return this.getStorage().getItem(this.tokenKey);
    }

    // 🔹 Guardar datos de usuario
    setUser(user: any, rememberMe: boolean = true): void {
        const storage = rememberMe ? localStorage : sessionStorage;
        const otherStorage = rememberMe ? sessionStorage : localStorage;
        
        otherStorage.removeItem(this.userKey);
        storage.setItem(this.userKey, JSON.stringify(user));
    }

    // 🔹 Obtener datos de usuario
    getUser(): any | null {
        const user = this.getStorage().getItem(this.userKey);
        return user ? JSON.parse(user) : null;
    }

    // 🔹 Cerrar sesión
    logout(): void {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.userKey);
        sessionStorage.removeItem(this.tokenKey);
        sessionStorage.removeItem(this.userKey);
        this.loggedInSubject.next(false);
    }

    // 🔹 Helper privado
    private hasToken(): boolean {
        return !!this.getToken();
    }

    // 🔹 Verificar sesión
    isLoggedIn(): boolean {
        return this.hasToken();
    }
}







