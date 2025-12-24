import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
import { importProvidersFrom } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { LucideAngularModule } from 'lucide-angular';
import { provideHttpClient } from '@angular/common/http';
import * as Icons from './app/config/icons.config';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    importProvidersFrom(BrowserAnimationsModule),
    importProvidersFrom(LucideAngularModule.pick(Icons))
  ]
}).catch(err => console.error(err));

