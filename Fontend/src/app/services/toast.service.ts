import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Toast } from '../shared/components/toast/toast.component';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastsSubject = new BehaviorSubject<Toast[]>([]);
  public toasts$: Observable<Toast[]> = this.toastsSubject.asObservable();

  show(toast: Omit<Toast, 'id'>): void {
    const newToast: Toast = {
      ...toast,
      id: this.generateId(),
      duration: toast.duration ?? 5000
    };

    const currentToasts = this.toastsSubject.value;
    this.toastsSubject.next([...currentToasts, newToast]);
  }

  success(message: string, title?: string, duration?: number): void {
    this.show({
      type: 'success',
      message,
      title,
      duration,
      icon: 'check-circle'
    });
  }

  error(message: string, title?: string, duration?: number): void {
    this.show({
      type: 'error',
      message,
      title,
      duration: duration ?? 7000,
      icon: 'alert-circle'
    });
  }

  warning(message: string, title?: string, duration?: number): void {
    this.show({
      type: 'warning',
      message,
      title,
      duration,
      icon: 'alert-triangle'
    });
  }

  info(message: string, title?: string, duration?: number): void {
    this.show({
      type: 'info',
      message,
      title,
      duration,
      icon: 'info'
    });
  }

  remove(id: string): void {
    const currentToasts = this.toastsSubject.value;
    this.toastsSubject.next(currentToasts.filter(t => t.id !== id));
  }

  clear(): void {
    this.toastsSubject.next([]);
  }

  private generateId(): string {
    return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

