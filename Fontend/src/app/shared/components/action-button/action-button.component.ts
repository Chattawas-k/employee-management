import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-action-button',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './action-button.component.html',
  styleUrls: ['./action-button.component.scss']
})
export class ActionButtonComponent {
  @Input() variant: 'edit' | 'delete' | 'view' = 'edit';
  @Input() title: string = '';
  @Input() disabled: boolean = false;
  @Output() onClick = new EventEmitter<Event>();

  get buttonClass(): string {
    const base = 'p-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
    const variants: Record<string, string> = {
      edit: 'text-indigo-600 hover:bg-indigo-50 focus:ring-indigo-500',
      delete: 'text-red-500 hover:bg-red-50 focus:ring-red-500',
      view: 'text-blue-600 hover:bg-blue-50 focus:ring-blue-500'
    };
    return `${base} ${variants[this.variant]}`;
  }

  get icon(): string {
    const icons: Record<string, string> = {
      edit: 'edit-2',
      delete: 'trash-2',
      view: 'eye'
    };
    return icons[this.variant] || 'edit-2';
  }

  get defaultTitle(): string {
    const titles: Record<string, string> = {
      edit: 'แก้ไข',
      delete: 'ลบ',
      view: 'ดู'
    };
    return titles[this.variant] || 'ดำเนินการ';
  }

  handleClick(event: Event): void {
    if (!this.disabled) {
      this.onClick.emit(event);
    }
  }
}

