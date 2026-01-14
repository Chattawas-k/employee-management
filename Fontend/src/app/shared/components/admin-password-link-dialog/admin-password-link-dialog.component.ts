import { CommonModule } from '@angular/common';
import { Component, Input, signal, output } from '@angular/core';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-admin-password-link-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-password-link-dialog.component.html',
  styleUrls: ['./admin-password-link-dialog.component.scss']
})
export class AdminPasswordLinkDialogComponent {
  @Input() set isOpen(value: boolean) {
    this._isOpen.set(value);
  }
  get isOpen(): boolean {
    return this._isOpen();
  }
  private _isOpen = signal(false);

  @Input() title = 'ลิงก์ตั้งรหัสผ่าน';
  @Input() linkUrl = '';
  @Input() expiresAt = '';
  @Input() ttlMinutes = 30;

  close = output<void>();

  isCopying = signal(false);

  constructor(private toastService: ToastService) {}

  onClose(): void {
    this._isOpen.set(false);
    this.close.emit();
  }

  async copy(): Promise<void> {
    const text = this.linkUrl || '';
    if (!text) return;

    this.isCopying.set(true);
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback
        const el = document.createElement('textarea');
        el.value = text;
        el.setAttribute('readonly', '');
        el.style.position = 'absolute';
        el.style.left = '-9999px';
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
      }
      this.toastService.success('คัดลอกลิงก์แล้ว');
    } catch (e) {
      this.toastService.error('คัดลอกลิงก์ไม่สำเร็จ');
    } finally {
      this.isCopying.set(false);
    }
  }
}

