import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-summary-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './summary-card.component.html',
  styleUrls: ['./summary-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SummaryCardComponent {
  @Input() title: string = '';
  @Input() value: string | number = 0;
  @Input() unit: string = '';
  @Input() icon: 'check' | 'pulse' | 'user-check' = 'check';
  @Input() valueClass: string = '';
  @Input() iconBgClass: string = '';
  @Input() iconClass: string = '';
}

