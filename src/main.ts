import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// 👇 Locale español
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { LOCALE_ID, importProvidersFrom } from '@angular/core';

// 👇 Angular Material Spinner
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

registerLocaleData(localeEs, 'es');

bootstrapApplication(App, {
  providers: [
    { provide: LOCALE_ID, useValue: 'es' }, // idioma español
    importProvidersFrom(MatProgressSpinnerModule), // 👈 habilita el spinner
    ...appConfig.providers
  ]
})
  .catch((err) => console.error(err));
