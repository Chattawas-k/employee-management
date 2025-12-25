import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-summary-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './summary-card.component.html',
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
}
