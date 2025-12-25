import { ChangeDetectionStrategy, Component, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';

interface CurrentStaff {
  name: string;
  role: string;
  avatarUrl: string;
}

interface UpcomingStaff {
  queueNumber: number;
  name: string;
  role: string;
  department: string;
  avatarUrl: string;
  status: 'พร้อมรับงาน' | 'ติดลูกค้า';
  statusClass: string;
  currentTasks: number;
}

@Component({
  selector: 'app-staff-queue',
  templateUrl: './staff-queue.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  standalone: true
})
export class StaffQueueComponent {
  menuClick = output<void>();

  nowServing = signal<CurrentStaff>({
    name: 'สมศักดิ์ รักงาน (Bob)',
    role: 'พนักงานขาย',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
  });

  upcomingQueue = signal<UpcomingStaff[]>([
    {
      queueNumber: 2,
      name: 'เอกชัย มุ่งมั่น (Ethan)',
      role: 'พนักงานขาย',
      department: 'ห้องครัว',
      avatarUrl: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?q=80&w=200&auto=format&fit=crop',
      status: 'พร้อมรับงาน',
      statusClass: 'bg-green-100 text-green-800',
      currentTasks: 0
    },
    {
      queueNumber: 3,
      name: 'เฟื่องฟ้า ใจงาม (Fiona)',
      role: 'พนักงานขาย',
      department: 'ห้องนอน',
      avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=200&auto=format&fit=crop',
      status: 'พร้อมรับงาน',
      statusClass: 'bg-green-100 text-green-800',
      currentTasks: 0
    },
    {
      queueNumber: 4,
      name: 'เกริกพล เดชานนท์ (George)',
      role: 'พนักงานขาย',
      department: 'ห้องนั่งเล่น',
      avatarUrl: 'https://images.unsplash.com/photo-1624561172888-ac93c696e10c?q=80&w=200&auto=format&fit=crop',
      status: 'พร้อมรับงาน',
      statusClass: 'bg-green-100 text-green-800',
      currentTasks: 0
    },
    {
      queueNumber: 5,
      name: 'หทัยรัตน์ วงศ์ษา (Hannah)',
      role: 'พนักงานขาย',
      department: 'ห้องนอน',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop',
      status: 'พร้อมรับงาน',
      statusClass: 'bg-green-100 text-green-800',
      currentTasks: 0
    },
    {
      queueNumber: 6,
      name: 'ไอริณ ชาญชัย (Ivy)',
      role: 'พนักงานขาย',
      department: 'ห้องครัว',
      avatarUrl: 'https://images.unsplash.com/photo-1597589827317-4c6d6e0a90bd?q=80&w=200&auto=format&fit=crop',
      status: 'พร้อมรับงาน',
      statusClass: 'bg-green-100 text-green-800',
      currentTasks: 0
    },
    {
      queueNumber: 7,
      name: 'จักรภพ คงมั่น (Jack)',
      role: 'พนักงานขาย',
      department: 'ห้องนั่งเล่น',
      avatarUrl: 'https://images.unsplash.com/photo-1564564321837-a57b7070ac4f?q=80&w=200&auto=format&fit=crop',
      status: 'พร้อมรับงาน',
      statusClass: 'bg-green-100 text-green-800',
      currentTasks: 0
    },
    {
      queueNumber: 8,
      name: 'กานดา สุขใจ (Karen)',
      role: 'พนักงานขาย',
      department: 'ห้องนอน',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
      status: 'พร้อมรับงาน',
      statusClass: 'bg-green-100 text-green-800',
      currentTasks: 0
    }
  ]);
}