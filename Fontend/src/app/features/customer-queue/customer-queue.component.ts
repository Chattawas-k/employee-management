import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmployeeService } from '../../services/employee.service';
import { JobService } from '../../services/job.service';
import { Employee } from '../../models/employee.model';
import { Job } from '../../models/job.model';
import { SummaryCardComponent } from '../../shared/components/summary-card/summary-card.component';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { BadgeComponent } from '../../shared/components/badge/badge.component';

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
  imports: [
    CommonModule,
    SummaryCardComponent,
    AvatarComponent,
    IconComponent,
    BadgeComponent
  ],
  templateUrl: './customer-queue.component.html',
  styleUrls: ['./customer-queue.component.scss']
})
export class CustomerQueueComponent implements OnInit, OnDestroy {
  private timerId?: number;
  employees = signal<Employee[]>([]);
  jobs = signal<Job[]>([]);

  summaryData = signal<SummaryCardData[]>([
    {
      title: 'ลูกค้าที่ดูแลแล้ววันนี้',
      value: 0,
      unit: 'ท่าน',
      icon: 'check',
      valueClass: 'text-gray-800',
      iconBgClass: 'bg-indigo-100',
      iconClass: 'text-indigo-600',
    },
    {
      title: 'กำลังดูแลลูกค้า',
      value: 0,
      unit: 'ท่าน',
      icon: 'pulse',
      valueClass: 'text-red-600',
      iconBgClass: 'bg-red-100',
      iconClass: 'text-red-600',
    },
    {
      title: 'พนักงานพร้อมรับงาน',
      value: 0,
      unit: 'คน',
      icon: 'user-check',
      valueClass: 'text-green-600',
      iconBgClass: 'bg-green-100',
      iconClass: 'text-green-600',
    }
  ]);

  readyQueue = computed<ReadyQueueStaff[]>(() => {
    const employees = this.employees();
    const jobs = this.jobs();
    
    // Filter active employees and calculate served today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return employees
      .filter(emp => emp.status === 'Active')
      .map((emp, index) => {
        const servedToday = jobs.filter(j => 
          j.assigneeId === emp.id && 
          j.status === 'Done' &&
          new Date(j.createdAt || j.createdDate) >= today
        ).length;

        return {
          queue: index + 1,
          name: emp.name,
          avatar: emp.avatar || '',
          status: 'รอรับลูกค้า',
          servedToday,
          isNext: index === 0
        };
      });
  });

  busyStaff = computed<BusyStaff[]>(() => {
    const employees = this.employees();
    const jobs = this.jobs();
    
    const inProgressJobs = jobs.filter(j => 
      j.status === 'In Progress' || j.status === 'InProgress'
    );

    return inProgressJobs.map(job => {
      const employee = employees.find(e => e.id === job.assigneeId);
      const startLog = job.statusLogs?.find(l => 
        l.status === 'In Progress' || l.status === 'InProgress'
      );
      
      if (!startLog) {
        return null;
      }

      const startTime = new Date(startLog.timestamp).getTime();
      const now = Date.now();
      const elapsedMs = now - startTime;
      const totalSeconds = Math.floor(elapsedMs / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      const duration = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

      return {
        name: employee?.name || 'Unknown',
        avatar: employee?.avatar || '',
        status: 'ให้บริการอยู่',
        startTime,
        duration,
        startTimeFormatted: new Date(startLog.timestamp).toLocaleTimeString('th-TH', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        jobId: `#${job.id}`
      };
    }).filter((staff): staff is BusyStaff => staff !== null);
  });

  unavailableStaff = computed<UnavailableStaff[]>(() => {
    return this.employees()
      .filter(emp => emp.status === 'Inactive')
      .map(emp => ({
        name: emp.name,
        avatar: emp.avatar || '',
        status: 'Offline' as const,
        isAvatarLetter: !emp.avatar
      }));
  });

  constructor(
    private employeeService: EmployeeService,
    private jobService: JobService
  ) {}

  ngOnInit(): void {
    this.loadEmployees();
    this.loadJobs();
    
    this.timerId = window.setInterval(() => {
      this.updateSummaryData();
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
    }
  }

  loadEmployees(): void {
    this.employeeService.search({ status: 'Active', pageSize: 100 }).subscribe({
      next: (response) => {
        this.employees.set(response.items || []);
        this.updateSummaryData();
      },
      error: (err) => {
        console.error('Error loading employees:', err);
      }
    });
  }

  loadJobs(): void {
    // TODO: Implement getAllJobs or use today's jobs
    this.jobs.set([]);
    this.updateSummaryData();
  }

  private updateSummaryData(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const doneJobs = this.jobs().filter(j => 
      j.status === 'Done' && 
      new Date(j.createdAt || j.createdDate) >= today
    );
    
    const busyCount = this.busyStaff().length;
    const readyCount = this.readyQueue().length;

    this.summaryData.set([
      {
        title: 'ลูกค้าที่ดูแลแล้ววันนี้',
        value: doneJobs.length,
        unit: 'ท่าน',
        icon: 'check',
        valueClass: 'text-gray-800',
        iconBgClass: 'bg-indigo-100',
        iconClass: 'text-indigo-600',
      },
      {
        title: 'กำลังดูแลลูกค้า',
        value: busyCount,
        unit: 'ท่าน',
        icon: 'pulse',
        valueClass: 'text-red-600',
        iconBgClass: 'bg-red-100',
        iconClass: 'text-red-600',
      },
      {
        title: 'พนักงานพร้อมรับงาน',
        value: readyCount,
        unit: 'คน',
        icon: 'user-check',
        valueClass: 'text-green-600',
        iconBgClass: 'bg-green-100',
        iconClass: 'text-green-600',
      }
    ]);
  }
}

