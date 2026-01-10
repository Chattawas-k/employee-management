import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './kpi-card.component.html',
  styleUrls: ['./kpi-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KpiCardComponent {
  @Input() title: string = '';
  @Input() value: string | number = 0;
  @Input() unit: string = '';
  @Input() icon: 'users' | 'clock' | 'user-check' | 'message' | 'currency' | 'trending-up' | 'alert' | 'tag' = 'users';
  @Input() iconColor: 'blue' | 'orange' | 'green' | 'purple' | 'red' | 'indigo' = 'blue';
  @Input() badge?: string;
  @Input() badgeColor?: 'red' | 'yellow' | 'green';
  @Input() isLoading: boolean = false;

  get iconColorClasses(): string {
    const colors = {
      blue: 'bg-blue-100 text-blue-600',
      orange: 'bg-orange-100 text-orange-600',
      green: 'bg-green-100 text-green-600',
      purple: 'bg-purple-100 text-purple-600',
      red: 'bg-red-100 text-red-600',
      indigo: 'bg-indigo-100 text-indigo-600'
    };
    return colors[this.iconColor] || colors.blue;
  }

  get badgeColorClasses(): string {
    if (!this.badgeColor) return 'bg-gray-100 text-gray-700';
    const colors = {
      red: 'bg-red-100 text-red-700',
      yellow: 'bg-yellow-100 text-yellow-700',
      green: 'bg-green-100 text-green-700'
    };
    return colors[this.badgeColor] || colors.red;
  }

  formatValue(): string {
    if (typeof this.value === 'number') {
      if (this.unit === '฿' || this.unit.includes('บาท')) {
        return this.value.toLocaleString('th-TH');
      }
      return this.value.toString();
    }
    return this.value;
  }
}
