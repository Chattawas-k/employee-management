import { Injectable, signal } from '@angular/core';

export type ConfirmTone = 'primary' | 'success' | 'warning' | 'danger';

export interface ConfirmDialogOptions {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  tone?: ConfirmTone;
  /** Lucide icon name used by <app-icon>. Example: "play", "trash-2" */
  iconName?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ConfirmDialogService {
  dialog = signal<ConfirmDialogOptions | null>(null);

  private pendingResolve: ((value: boolean) => void) | null = null;

  open(options: ConfirmDialogOptions): Promise<boolean> {
    // If there's an existing pending confirm, cancel it.
    if (this.pendingResolve) {
      this.pendingResolve(false);
      this.pendingResolve = null;
    }

    this.dialog.set({
      cancelText: 'ยกเลิก',
      confirmText: 'ยืนยัน',
      tone: 'primary',
      iconName: 'help-circle',
      ...options,
    });

    return new Promise<boolean>((resolve) => {
      this.pendingResolve = resolve;
    });
  }

  confirm(): void {
    if (!this.pendingResolve) return;
    this.pendingResolve(true);
    this.pendingResolve = null;
    this.dialog.set(null);
  }

  cancel(): void {
    if (!this.pendingResolve) return;
    this.pendingResolve(false);
    this.pendingResolve = null;
    this.dialog.set(null);
  }
}

