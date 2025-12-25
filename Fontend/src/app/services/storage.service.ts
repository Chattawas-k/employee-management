import { Injectable } from '@angular/core';
import { LoggerService } from './logger.service';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  constructor(private logger: LoggerService) {}

  setItem<T>(key: string, value: T): void {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        this.logger.error('Storage quota exceeded. Unable to save data.', error);
        // Could implement a cleanup strategy here
      } else {
        this.logger.error('Error saving to localStorage:', error);
      }
      throw error;
    }
  }

  getItem<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      if (item === null) {
        return null;
      }
      return JSON.parse(item) as T;
    } catch (error) {
      this.logger.error(`Error parsing localStorage item "${key}":`, error);
      // Remove corrupted data
      this.removeItem(key);
      return null;
    }
  }

  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      this.logger.error(`Error removing localStorage item "${key}":`, error);
    }
  }

  clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      this.logger.error('Error clearing localStorage:', error);
    }
  }

  key(index: number): string | null {
    try {
      return localStorage.key(index);
    } catch (error) {
      this.logger.error(`Error getting localStorage key at index ${index}:`, error);
      return null;
    }
  }

  get length(): number {
    try {
      return localStorage.length;
    } catch (error) {
      this.logger.error('Error getting localStorage length:', error);
      return 0;
    }
  }
}

