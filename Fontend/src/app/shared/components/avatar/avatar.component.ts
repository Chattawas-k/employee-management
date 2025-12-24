import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './avatar.component.html',
  styleUrls: ['./avatar.component.scss']
})
export class AvatarComponent {
  @Input() src?: string;
  @Input() alt: string = '';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() className: string = '';

  getAvatarClasses(): string {
    const sizes: Record<string, string> = {
      sm: 'w-8 h-8',
      md: 'w-10 h-10',
      lg: 'w-12 h-12'
    };
    return `${sizes[this.size] || sizes['md']} rounded-full overflow-hidden ${this.className}`;
  }

  getInitials(): string {
    if (!this.alt) return '?';
    const parts = this.alt.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return this.alt[0]?.toUpperCase() || '?';
  }
}

