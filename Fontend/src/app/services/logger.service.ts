import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  error(message: string, ...args: any[]): void {
    if (!environment.production) {
      console.error(message, ...args);
    }
    // In production: could send to logging service (e.g., Sentry, LogRocket, etc.)
  }

  warn(message: string, ...args: any[]): void {
    if (!environment.production) {
      console.warn(message, ...args);
    }
    // In production: could send to logging service
  }

  info(message: string, ...args: any[]): void {
    if (!environment.production) {
      console.info(message, ...args);
    }
    // In production: could send to logging service
  }

  debug(message: string, ...args: any[]): void {
    if (!environment.production) {
      console.debug(message, ...args);
    }
    // In production: could send to logging service
  }

  log(message: string, ...args: any[]): void {
    if (!environment.production) {
      console.log(message, ...args);
    }
    // In production: could send to logging service
  }
}

