import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

export interface Toast {
  id: string;
  message: string;
  title?: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  icon?: string;
}

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.scss']
})
export class ToastComponent implements OnInit {
  @Input() toast!: Toast;
  @Output() remove = new EventEmitter<string>();

  isVisible = false;
  isLeaving = false;

  ngOnInit(): void {
    // Animate in
    setTimeout(() => {
      this.isVisible = true;
    }, 10);

    // Auto remove after duration
    if (this.toast.duration && this.toast.duration > 0) {
      setTimeout(() => {
        this.close();
      }, this.toast.duration);
    }
  }

  close(): void {
    this.isLeaving = true;
    setTimeout(() => {
      this.remove.emit(this.toast.id);
    }, 300); // Match animation duration
  }

  get iconName(): string {
    if (this.toast.icon) return this.toast.icon;
    
    switch (this.toast.type) {
      case 'success':
        return 'check-circle';
      case 'error':
        return 'alert-circle';
      case 'warning':
        return 'alert-triangle';
      case 'info':
        return 'info';
      default:
        return 'bell';
    }
  }

  get colorClasses(): string {
    switch (this.toast.type) {
      case 'success':
        return 'bg-green-50 border-green-500 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-500 text-red-800';
      case 'warning':
        return 'bg-amber-50 border-amber-500 text-amber-800';
      case 'info':
        return 'bg-blue-50 border-blue-500 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-500 text-gray-800';
    }
  }

  get iconColorClass(): string {
    switch (this.toast.type) {
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      case 'warning':
        return 'text-amber-600';
      case 'info':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  }
}

