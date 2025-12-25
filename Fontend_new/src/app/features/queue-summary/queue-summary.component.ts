import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-queue-summary',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './queue-summary.component.html',
  styleUrls: ['./queue-summary.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QueueSummaryComponent {}

