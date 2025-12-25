import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-work-calendar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './work-calendar.component.html',
  styleUrls: ['./work-calendar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WorkCalendarComponent {}

