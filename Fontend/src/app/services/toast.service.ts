import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Toast } from '../shared/components/toast/toast.component';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastsSubject = new BehaviorSubject<Toast[]>([]);
  public toasts$: Observable<Toast[]> = this.toastsSubject.asObservable();

  /**
   * แสดง toast notification
   */
  show(toast: Omit<Toast, 'id'>): void {
    const newToast: Toast = {
      ...toast,
      id: this.generateId(),
      duration: toast.duration ?? 5000 // Default 5 seconds
    };

    const currentToasts = this.toastsSubject.value;
    this.toastsSubject.next([...currentToasts, newToast]);
  }

  /**
   * แสดง success toast
   */
  success(message: string, title?: string, duration?: number): void {
    this.show({
      type: 'success',
      message,
      title,
      duration,
      icon: 'check-circle'
    });
  }

  /**
   * แสดง error toast
   */
  error(message: string, title?: string, duration?: number): void {
    this.show({
      type: 'error',
      message,
      title,
      duration: duration ?? 7000, // Errors show longer
      icon: 'alert-circle'
    });
  }

  /**
   * แสดง warning toast
   */
  warning(message: string, title?: string, duration?: number): void {
    this.show({
      type: 'warning',
      message,
      title,
      duration,
      icon: 'alert-triangle'
    });
  }

  /**
   * แสดง info toast
   */
  info(message: string, title?: string, duration?: number): void {
    this.show({
      type: 'info',
      message,
      title,
      duration,
      icon: 'info'
    });
  }

  /**
   * แสดง job assigned notification
   */
  jobAssigned(jobTitle: string, customer: string): void {
    this.show({
      type: 'info',
      title: '📬 งานใหม่!',
      message: `${jobTitle} - ลูกค้า: ${customer}`,
      duration: 7000,
      icon: 'briefcase'
    });
  }

  /**
   * แสดง job updated notification
   */
  jobUpdated(jobTitle: string, status: string): void {
    this.show({
      type: 'info',
      title: '📝 อัพเดทงาน',
      message: `${jobTitle} - สถานะ: ${status}`,
      duration: 5000,
      icon: 'refresh-cw'
    });
  }

  /**
   * ลบ toast ตาม id
   */
  remove(id: string): void {
    const currentToasts = this.toastsSubject.value;
    this.toastsSubject.next(currentToasts.filter(t => t.id !== id));
  }

  /**
   * ลบ toast ทั้งหมด
   */
  clear(): void {
    this.toastsSubject.next([]);
  }

  /**
   * สร้าง unique ID
   */
  private generateId(): string {
    return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

