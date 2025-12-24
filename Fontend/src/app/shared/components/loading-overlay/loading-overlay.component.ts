import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-loading-overlay',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './loading-overlay.component.html',
  styleUrls: ['./loading-overlay.component.scss']
})
export class LoadingOverlayComponent {
  @Input() isLoading: boolean = false;
  @Input() message: string = 'กำลังโหลดข้อมูล...';
  @Input() variant: 'fullscreen' | 'inline' = 'inline';
}

