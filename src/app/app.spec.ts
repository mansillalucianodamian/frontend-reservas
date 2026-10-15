import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { AuthService } from './services/auth.service';
import { PwaService } from './services/pwa.service';

describe('App', () => {
  const fakeAuthService = {
    isLoggedIn$: of(false),
    getUser: () => null,
    logout: () => {}
  };

  const fakePwaService = {
    canInstall: false,
    installApp: () => {}
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: AuthService, useValue: fakeAuthService },
        { provide: PwaService, useValue: fakePwaService }
      ]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});
