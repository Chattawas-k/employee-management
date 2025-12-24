import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-error-alert',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './error-alert.component.html',
  styleUrls: ['./error-alert.component.scss']
})
export class ErrorAlertComponent {
  @Input() message: string | null = null;
  @Input() variant: 'error' | 'warning' | 'info' | 'success' = 'error';
  @Input() dismissible: boolean = true;
  @Output() onDismiss = new EventEmitter<void>();

  handleDismiss(): void {
    this.onDismiss.emit();
  }

  get variantClasses(): string {
    const variants = {
      error: 'bg-red-50 border-red-200 text-red-700',
      warning: 'bg-amber-50 border-amber-200 text-amber-700',
      info: 'bg-blue-50 border-blue-200 text-blue-700',
      success: 'bg-green-50 border-green-200 text-green-700'
    };
    return variants[this.variant];
  }

  get iconName(): string {
    const icons = {
      error: 'alert-circle',
      warning: 'alert-triangle',
      info: 'info',
      success: 'check-circle'
    };
    return icons[this.variant];
  }
}

