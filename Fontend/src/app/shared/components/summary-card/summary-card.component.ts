import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-summary-card',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './summary-card.component.html',
  styleUrls: ['./summary-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SummaryCardComponent {
  title = input.required<string>();
  value = input.required<string | number>();
  unit = input.required<string>();
  icon = input.required<'check' | 'pulse' | 'user-check'>();
  valueClass = input<string>('');
  iconBgClass = input<string>('');
  iconClass = input<string>('');

  getIconName(): string {
    switch (this.icon()) {
      case 'check':
        return 'check-circle';
      case 'pulse':
        return 'activity';
      case 'user-check':
        return 'user-check';
      default:
        return 'circle';
    }
  }
}

