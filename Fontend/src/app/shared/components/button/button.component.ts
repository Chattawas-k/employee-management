import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.scss']
})
export class ButtonComponent {
  @Input() variant: 'primary' | 'secondary' | 'danger' | 'warning' = 'primary';
  @Input() className: string = '';
  @Input() disabled: boolean = false;
  @Input() title: string = '';
  @Input() icon?: string;
  @Output() onClick = new EventEmitter<Event>();

  getButtonClasses(): string {
    const base = 'px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center';
    const variants: Record<string, string> = {
      primary: 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500',
      secondary: 'bg-slate-200 text-slate-700 hover:bg-slate-300 focus:ring-slate-500',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
      warning: 'bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-500'
    };
    return `${base} ${variants[this.variant]} ${this.className}`;
  }
}

