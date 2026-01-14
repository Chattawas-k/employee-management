import { ChangeDetectionStrategy, Component, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmDialogOptions, ConfirmDialogService, ConfirmTone } from '../../../services/confirm-dialog.service';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-confirm-dialog-host',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './confirm-dialog-host.component.html',
  styleUrls: ['./confirm-dialog-host.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialogHostComponent {
  private confirmDialog = inject(ConfirmDialogService);

  dialog = this.confirmDialog.dialog;

  @HostListener('document:keydown.escape')
  onEsc(): void {
    if (this.dialog()) {
      this.confirmDialog.cancel();
    }
  }

  onBackdropClick(): void {
    this.confirmDialog.cancel();
  }

  onClose(): void {
    this.confirmDialog.cancel();
  }

  onCancel(): void {
    this.confirmDialog.cancel();
  }

  onConfirm(): void {
    this.confirmDialog.confirm();
  }

  getTone(d: ConfirmDialogOptions): ConfirmTone {
    return d.tone ?? 'primary';
  }

  getIconBgClass(tone: ConfirmTone): string {
    switch (tone) {
      case 'success':
        return 'bg-green-100';
      case 'warning':
        return 'bg-amber-100';
      case 'danger':
        return 'bg-red-100';
      default:
        return 'bg-indigo-100';
    }
  }

  getIconTextClass(tone: ConfirmTone): string {
    switch (tone) {
      case 'success':
        return 'text-green-600';
      case 'warning':
        return 'text-amber-600';
      case 'danger':
        return 'text-red-600';
      default:
        return 'text-indigo-600';
    }
  }

  getConfirmButtonClass(tone: ConfirmTone): string {
    switch (tone) {
      case 'success':
        return 'bg-green-600 hover:bg-green-700 text-white';
      case 'warning':
        return 'bg-amber-500 hover:bg-amber-600 text-white';
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white';
      default:
        return 'bg-indigo-600 hover:bg-indigo-700 text-white';
    }
  }
}

