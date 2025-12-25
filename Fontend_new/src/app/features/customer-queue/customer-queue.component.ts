import { ChangeDetectionStrategy, Component, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SummaryCardComponent } from '../../shared/components/summary-card/summary-card.component';

interface ReadyQueueStaff {
  queue: number;
  name: string;
  avatar: string;
  status: string;
  servedToday: number;
  isNext?: boolean;
}

interface BusyStaff {
  name: string;
  avatar: string;
  status: string;
  startTime: number;
  duration: string;
  startTimeFormatted: string;
  jobId: string;
}

interface UnavailableStaff {
  name: string;
  avatar: string;
  status: 'Break' | 'Offline';
  isAvatarLetter?: boolean;
}

interface SummaryCardData {
  title: string;
  value: number;
  unit: string;
  icon: 'check' | 'pulse' | 'user-check';
  valueClass: string;
  iconBgClass: string;
  iconClass: string;
}

@Component({
  selector: 'app-customer-queue',
  standalone: true,
  imports: [CommonModule, SummaryCardComponent],
  templateUrl: './customer-queue.component.html',
  styleUrls: ['./customer-queue.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerQueueComponent implements OnInit, OnDestroy {
  private timerId?: number;

  summaryData = signal<SummaryCardData[]>([
    {
      title: 'ลูกค้าที่ดูแลแล้ววันนี้',
      value: 51,
      unit: 'ท่าน',
      icon: 'check',
      valueClass: 'text-gray-800',
      iconBgClass: 'bg-indigo-100',
      iconClass: 'text-indigo-600',
    },
    {
      title: 'กำลังดูแลลูกค้า',
      value: 7,
      unit: 'ท่าน',
      icon: 'pulse',
      valueClass: 'text-red-600',
      iconBgClass: 'bg-red-100',
      iconClass: 'text-red-600',
    },
    {
      title: 'พนักงานพร้อมรับงาน',
      value: 8,
      unit: 'คน',
      icon: 'user-check',
      valueClass: 'text-green-600',
      iconBgClass: 'bg-green-100',
      iconClass: 'text-green-600',
    }
  ]);

  readyQueue = signal<ReadyQueueStaff[]>([
    { queue: 1, name: 'คุณวิภา', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop', status: 'รับลูกค้าวันนี้', servedToday: 3, isNext: true },
    { queue: 2, name: 'คุณเอก', avatar: 'https://images.unsplash.com/photo-1555952517-2e8e729e0b44?q=80&w=200&auto=format&fit=crop', status: 'รอรับลูกค้า', servedToday: 2 },
    { queue: 3, name: 'คุณก้อง', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop', status: 'รอรับลูกค้า', servedToday: 4 },
    { queue: 4, name: 'คุณบี', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop', status: 'รอรับลูกค้า', servedToday: 1 },
    { queue: 5, name: 'คุณชัย', avatar: 'https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?q=80&w=200&auto=format&fit=crop', status: 'รอรับลูกค้า', servedToday: 0 },
    { queue: 6, name: 'คุณดาว', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=200&auto=format&fit=crop', status: 'รอรับลูกค้า', servedToday: 2 },
  ]);

  busyStaff = signal<BusyStaff[]>([
    { name: 'คุณสมชาย', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop', status: 'ให้บริการอยู่', startTime: 0, duration: '26:51', startTimeFormatted: '10:05 น.', jobId: '#198' },
    { name: 'คุณนนท์', avatar: 'https://images.unsplash.com/photo-1564564321837-a57b7070ac4f?q=80&w=200&auto=format&fit=crop', status: 'ให้บริการอยู่', startTime: 0, duration: '56:51', startTimeFormatted: '10:30 น.', jobId: '#199' },
    { name: 'คุณมาย์', avatar: 'https://images.unsplash.com/photo-1614283233556-f35b0c801ef1?q=80&w=200&auto=format&fit=crop', status: 'ให้บริการอยู่', startTime: 0, duration: '16:51', startTimeFormatted: '11:15 น.', jobId: '#201' },
  ]);

  unavailableStaff = signal<UnavailableStaff[]>([
    { name: 'คุณพลอย', avatar: 'https://images.unsplash.com/photo-1521119989659-a83eee488004?q=80&w=200&auto=format&fit=crop', status: 'Break' },
    { name: 'คุณอาร์ต', avatar: 'A', status: 'Offline', isAvatarLetter: true },
    { name: 'คุณแนน', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop', status: 'Break' },
  ]);

  ngOnInit(): void {
    const now = Date.now();
    this.busyStaff.update(staffList => {
      return staffList.map((staff) => {
        const durationParts = staff.duration.split(':');
        const minutes = parseInt(durationParts[0], 10);
        const seconds = parseInt(durationParts[1], 10);
        const elapsedMs = (minutes * 60 + seconds) * 1000;
        
        return {
          ...staff,
          startTime: now - elapsedMs,
        };
      });
    });

    this.timerId = window.setInterval(() => {
      this.updateDurations();
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
    }
  }

  private updateDurations(): void {
    const currentTime = Date.now();
    this.busyStaff.update(staffList => 
      staffList.map(staff => {
        if (staff.startTime === 0) return staff;
        
        const elapsedMs = currentTime - staff.startTime;
        const totalSeconds = Math.floor(elapsedMs / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        
        const formattedMinutes = minutes.toString().padStart(2, '0');
        const formattedSeconds = seconds.toString().padStart(2, '0');
        
        return { ...staff, duration: `${formattedMinutes}:${formattedSeconds}` };
      })
    );
  }
}
