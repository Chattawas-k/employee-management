import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AvailabilityStatusKey, normalizeAvailabilityStatus } from '../../utils/availability-status.util';

export type CalloutVariant = 'success' | 'info' | 'warning' | 'danger' | 'neutral';
export type CalloutIcon = 'bell' | 'user-plus' | 'ban' | 'pause' | 'info' | 'check';
export type CalloutPreset = 'manual' | 'queue';

@Component({
  selector: 'app-callout-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './callout-card.component.html',
  styleUrls: ['./callout-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalloutCardComponent {
  // Preset mode:
  // - manual: use title/subtitle/variant/icon/action props directly
  // - queue: decide which callout to show from availabilityStatus + isMyTurn
  @Input() preset: CalloutPreset = 'manual';

  @Input() title: string = '';
  @Input() subtitle: string = '';
  @Input() variant: CalloutVariant = 'info';
  @Input() icon: CalloutIcon = 'info';

  @Input() actionLabel: string | null = null;
  @Input() actionIcon: CalloutIcon | null = null;
  @Input() actionButtonClass: string = 'bg-green-600 hover:bg-green-700 text-white';

  // Queue preset inputs
  @Input() availabilityStatus: string | null = null;
  @Input() isMyTurn: boolean | null = null;
  @Input() queuesRemaining: number | null = null;
  @Input() queueActionLabel: string = 'รับลูกค้า';
  @Input() queueActionIcon: CalloutIcon = 'user-plus';
  @Input() queueActionButtonClass: string = 'bg-green-600 hover:bg-green-700 text-white';

  @Output() action = new EventEmitter<void>();

  get shouldRender(): boolean {
    if (this.preset !== 'queue') return true;
    return this.queueConfig !== null;
  }

  get resolvedTitle(): string {
    return this.preset === 'queue' ? (this.queueConfig?.title ?? '') : this.title;
  }

  get resolvedSubtitle(): string {
    return this.preset === 'queue' ? (this.queueConfig?.subtitle ?? '') : this.subtitle;
  }

  get resolvedVariant(): CalloutVariant {
    return this.preset === 'queue' ? (this.queueConfig?.variant ?? 'info') : this.variant;
  }

  get resolvedIcon(): CalloutIcon {
    return this.preset === 'queue' ? (this.queueConfig?.icon ?? 'info') : this.icon;
  }

  get resolvedActionLabel(): string | null {
    if (this.preset !== 'queue') return this.actionLabel;
    return this.queueConfig?.showAction ? this.queueActionLabel : null;
  }

  get resolvedActionIcon(): CalloutIcon | null {
    if (this.preset !== 'queue') return this.actionIcon;
    return this.queueConfig?.showAction ? this.queueActionIcon : null;
  }

  get resolvedActionButtonClass(): string {
    if (this.preset !== 'queue') return this.actionButtonClass;
    return this.queueActionButtonClass;
  }

  get containerClass(): string {
    switch (this.resolvedVariant) {
      case 'success':
        return 'bg-emerald-100 text-green-900 border-green-500';
      case 'warning':
        return 'bg-yellow-400 text-yellow-900 border-yellow-500';
      case 'danger':
        return 'bg-red-200 text-red-900 border-red-500';
      case 'neutral':
        return 'bg-gray-200 text-gray-900 border-gray-500';
      case 'info':
      default:
        return 'bg-blue-200 text-blue-900 border-blue-500';
    }
  }

  get iconWrapClass(): string {
    switch (this.resolvedVariant) {
      case 'success':
        return 'bg-white border-green-200';
      case 'warning':
        return 'bg-white border-yellow-200';
      case 'danger':
        return 'bg-white border-red-200';
      case 'neutral':
        return 'bg-white border-gray-200';
      case 'info':
      default:
        return 'bg-white border-blue-200';
    }
  }

  get iconClass(): string {
    switch (this.resolvedVariant) {
      case 'success':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'danger':
        return 'text-red-600';
      case 'neutral':
        return '';
      case 'info':
      default:
        return 'text-blue-600';
    }
  }

  private get queueConfig(): { title: string; subtitle: string; variant: CalloutVariant; icon: CalloutIcon; showAction: boolean } | null {
    const status: AvailabilityStatusKey = normalizeAvailabilityStatus(this.availabilityStatus ?? 'available');
    const myTurn = !!this.isMyTurn;
    const remaining = typeof this.queuesRemaining === 'number' ? this.queuesRemaining : null;

    // If not available => show status banner
    if (status !== 'available') {
      switch (status) {
        case 'busy':
          return {
            title: 'คุณกำลังติดลูกค้า',
            subtitle: 'สถานะของคุณจะเปลี่ยนเป็น "พร้อมรับงาน" อัตโนมัติเมื่องานเสร็จ',
            variant: 'warning',
            icon: 'info',
            showAction: false,
          };
        case 'lunchBreak':
          return {
            title: 'คุณกำลังพักเที่ยง',
            subtitle: 'คุณจะไม่ได้รับคิวใหม่ระหว่างพักเที่ยง',
            variant: 'warning',
            icon: 'pause',
            showAction: false,
          };
        case 'unavailable':
          return {
            title: 'คุณตั้งสถานะเป็น "ไม่พร้อมรับงาน"',
            subtitle: 'คุณจะไม่ได้รับคิวใหม่จนกว่าจะเปลี่ยนสถานะกลับมาเป็น "พร้อมรับงาน"',
            variant: 'neutral',
            icon: 'ban',
            showAction: false,
          };
        case 'leave':
          return {
            title: 'คุณตั้งสถานะเป็น "ลา"',
            subtitle: 'คุณจะไม่ได้รับคิวใหม่จนกว่าจะเปลี่ยนสถานะกลับมาเป็น "พร้อมรับงาน"',
            variant: 'danger',
            icon: 'ban',
            showAction: false,
          };
        case 'offsiteCustomer':
          return {
            title: 'คุณตั้งสถานะเป็น "พบลูกค้านอกสถานที่"',
            subtitle: 'คุณจะไม่ได้รับคิวใหม่จนกว่าจะเปลี่ยนสถานะกลับมาเป็น "พร้อมรับงาน"',
            variant: 'info',
            icon: 'info',
            showAction: false,
          };
        default:
          return null;
      }
    }

    // Available + my turn => show accept customer card
    if (myTurn) {
      return {
        title: 'ถึงคิวคุณแล้ว เชิญรับลูกค้าได้เลย!',
        subtitle: 'มีลูกค้ากำลังรอรับบริการอยู่ที่หน้าร้าน',
        variant: 'success',
        icon: 'bell',
        showAction: true,
      };
    }

    // Available + in queue but not my turn => show remaining queue info
    if (remaining !== null && remaining > 0) {
      return {
        title: `รออีก ${remaining} คิว`,
        subtitle: 'เตรียมตัวให้พร้อม เมื่อถึงคิวจะแสดงปุ่มรับลูกค้า',
        variant: 'info',
        icon: 'info',
        showAction: false,
      };
    }

    // Available + not in queue (or unknown) => show nothing
    return null;
  }

  onActionClick(): void {
    this.action.emit();
  }
}

