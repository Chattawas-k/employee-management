import { ChangeDetectionStrategy, Component, signal, OnInit, OnDestroy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SummaryCardComponent } from '../../shared/components/summary-card/summary-card.component';
import { QueueService } from '../../services/queue.service';
import { SignalRService } from '../../services/signalr.service';
import { ToastService } from '../../services/toast.service';
import { QueueDto, QueueSummaryJobDto } from '../../models/queue.model';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

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
  private refreshTimerId?: number;
  isLoading = signal(false);
  allJobs: QueueSummaryJobDto[] = [];

  constructor(
    private queueService: QueueService,
    private toastService: ToastService,
    private signalRService: SignalRService
  ) {}

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

  readyQueue = signal<ReadyQueueStaff[]>([]);
  busyStaff = signal<BusyStaff[]>([]);
  unavailableStaff = signal<UnavailableStaff[]>([]);

  ngOnInit(): void {
    this.loadQueueData();
    this.setupSignalR();

    // Auto-refresh every 30 seconds (fallback if SignalR fails)
    this.refreshTimerId = window.setInterval(() => {
      this.loadQueueData();
    }, 30000);

    // Update busy staff durations every second
    this.timerId = window.setInterval(() => {
      this.updateDurations();
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
    }
    if (this.refreshTimerId) {
      clearInterval(this.refreshTimerId);
    }
    this.signalRService.stopConnection();
    this.signalRService.offQueueUpdated();
    this.signalRService.offJobStatusChanged();
    this.signalRService.offEmployeeStatusChanged();
  }

  private setupSignalR(): void {
    this.signalRService.startConnection().then(() => {
      this.signalRService.onQueueUpdated(() => {
        this.loadQueueData();
      });
      this.signalRService.onJobStatusChanged(() => {
        this.loadQueueData();
      });
      this.signalRService.onEmployeeStatusChanged(() => {
        this.loadQueueData();
      });
    }).catch(err => console.error('SignalR Connection Error in CustomerQueueComponent: ', err));
  }

  loadQueueData(): void {
    this.isLoading.set(true);
    const today = new Date();

    forkJoin({
      queues: this.queueService.getQueuesByDate(today).pipe(
        catchError(error => {
          console.error('Error loading queues:', error);
          this.toastService.error('เกิดข้อผิดพลาดในการโหลดข้อมูลคิว');
          return of([]);
        })
      ),
      jobs: this.queueService.getQueueSummary(today).pipe(
        catchError(error => {
          console.error('Error loading queue summary:', error);
          this.toastService.error('เกิดข้อผิดพลาดในการโหลดข้อมูลงาน');
          return of({ jobs: [] });
        })
      )
    }).pipe(
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: ({ queues, jobs }) => {
        this.allJobs = jobs.jobs || [];
        this.mapQueueData(queues);
        this.updateSummaryData(queues, jobs.jobs || []);
      }
    });
  }

  private mapQueueData(queues: QueueDto[]): void {
    const readyQueueList: ReadyQueueStaff[] = [];
    const busyStaffList: BusyStaff[] = [];
    const unavailableStaffList: UnavailableStaff[] = [];

    // Filter and sort Available staff by master position
    const availableQueues = queues
      .filter(q => {
        const status = typeof q.status === 'string' 
          ? q.status.toLowerCase() 
          : String(q.status || '').toLowerCase();
        return status === 'active';
      })
      .sort((a, b) => a.position - b.position); // Sort by master position

    // Assign relative positions for Ready Queue display (1, 2, 3...)
    availableQueues.forEach((queue, index) => {
      const relativePosition = index + 1; // Relative position in Ready Queue
      const employeeName = queue.employeeName ? `คุณ${queue.employeeName}` : 'ไม่ระบุชื่อ';
      const avatar = this.generateAvatar(queue.employeeName || '');
      const servedToday = this.countServedToday(queue.employeeId);
      const isNext = relativePosition === 1; // First in Ready Queue is "next"

      readyQueueList.push({
        queue: relativePosition, // Use relative position, not master position
        name: employeeName,
        avatar,
        status: isNext ? 'รับลูกค้าวันนี้' : 'รอรับลูกค้า',
        servedToday,
        isNext
      });
    });

    // Process Busy and Unavailable staff
    const sortedQueues = [...queues].sort((a, b) => a.position - b.position);

    sortedQueues.forEach((queue) => {
      const employeeName = queue.employeeName ? `คุณ${queue.employeeName}` : 'ไม่ระบุชื่อ';
      const avatar = this.generateAvatar(queue.employeeName || '');
      const servedToday = this.countServedToday(queue.employeeId);

      const normalizedStatus = typeof queue.status === 'string' ? queue.status.toLowerCase() : String(queue.status || '').toLowerCase();

      if (normalizedStatus === 'busy') {
        const job = this.findActiveJobForEmployee(queue.employeeId);
        const startTime = job ? this.getJobStartTime(job) : Date.now();
        const startTimeFormatted = job ? this.formatStartTime(job) : '';
        const jobId = job?.jobNumber || '';

        busyStaffList.push({
          name: employeeName,
          avatar,
          status: 'ให้บริการอยู่',
          startTime,
          duration: '00:00',
          startTimeFormatted,
          jobId: jobId ? `#${jobId}` : ''
        });
      } else if (normalizedStatus === 'inactive') {
        const initial = queue.employeeName ? queue.employeeName.charAt(0).toUpperCase() : '?';
        unavailableStaffList.push({
          name: employeeName,
          avatar: initial,
          status: 'Offline',
          isAvatarLetter: true
        });
      }
    });

    // Also add employees with in-progress jobs but not in queue
    const queueEmployeeIds = new Set(queues.map(q => q.employeeId.toLowerCase()));
    this.allJobs.forEach(job => {
      const statusStr = this.normalizeStatus(job.status);
      const assigneeIdStr = typeof job.assigneeId === 'string' ? job.assigneeId.toLowerCase() : job.assigneeId;
      if (statusStr === 'inprogress' && !queueEmployeeIds.has(assigneeIdStr)) {
        const employeeName = job.assigneeName ? `คุณ${job.assigneeName}` : 'ไม่ระบุชื่อ';
        const avatar = this.generateAvatar(job.assigneeName || '');
        const startTime = this.getJobStartTime(job);
        const startTimeFormatted = this.formatStartTime(job);
        const jobId = job.jobNumber || '';

        busyStaffList.push({
          name: employeeName,
          avatar,
          status: 'ให้บริการอยู่',
          startTime,
          duration: '00:00',
          startTimeFormatted,
          jobId: jobId ? `#${jobId}` : ''
        });
      }
    });

    this.readyQueue.set(readyQueueList);
    this.busyStaff.set(busyStaffList);
    this.unavailableStaff.set(unavailableStaffList);
  }

  private generateAvatar(name: string): string {
    if (!name) return 'https://ui-avatars.com/api/?name=User&background=random&size=200';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&size=200`;
  }

  private countServedToday(employeeId: string): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const employeeIdLower = employeeId.toLowerCase();

    return this.allJobs.filter(job => {
      const assigneeIdStr = typeof job.assigneeId === 'string' ? job.assigneeId.toLowerCase() : job.assigneeId;
      if (assigneeIdStr !== employeeIdLower) return false;
      const statusStr = this.normalizeStatus(job.status);
      if (statusStr !== 'done') return false;
      const doneLog = job.statusLogs?.find(log => this.normalizeStatus(log.status) === 'done');
      if (!doneLog) return false;
      const jobDoneDate = new Date(doneLog.timestamp);
      jobDoneDate.setHours(0, 0, 0, 0);
      return jobDoneDate.getTime() === today.getTime();
    }).length;
  }

  private findActiveJobForEmployee(employeeId: string): QueueSummaryJobDto | undefined {
    const employeeIdLower = employeeId.toLowerCase();
    return this.allJobs.find(job => {
      const assigneeIdStr = typeof job.assigneeId === 'string' ? job.assigneeId.toLowerCase() : job.assigneeId;
      const statusStr = this.normalizeStatus(job.status);
      return assigneeIdStr === employeeIdLower && statusStr === 'inprogress';
    });
  }

  private normalizeStatus(status: string | number | any): string {
    if (typeof status === 'string') {
      return status.toLowerCase();
    }
    // Handle enum values: 1=Pending, 2=InProgress, 3=Done, 4=Rejected
    if (typeof status === 'number') {
      const statusMap: { [key: number]: string } = {
        1: 'pending',
        2: 'inprogress',
        3: 'done',
        4: 'rejected'
      };
      return statusMap[status] || 'pending';
    }
    // Handle enum names
    if (status && typeof status === 'object' && status.toString) {
      return status.toString().toLowerCase();
    }
    return String(status).toLowerCase();
  }

  private getJobStartTime(job: QueueSummaryJobDto): number {
    const inProgressLog = job.statusLogs?.find(log => 
      this.normalizeStatus(log.status) === 'inprogress'
    );
    if (inProgressLog) {
      return new Date(inProgressLog.timestamp).getTime();
    }
    // Fallback to created date
    return new Date(job.createdDate).getTime();
  }

  private formatStartTime(job: QueueSummaryJobDto): string {
    const inProgressLog = job.statusLogs?.find(log => 
      this.normalizeStatus(log.status) === 'inprogress'
    );
    const timestamp = inProgressLog ? inProgressLog.timestamp : job.createdDate;
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes} น.`;
  }

  private updateSummaryData(queues: QueueDto[], jobs: QueueSummaryJobDto[]): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // ลูกค้าที่ดูแลแล้ววันนี้ = count jobs ที่ status = Done ในวันนี้
    const servedToday = jobs.filter(job => {
      const statusStr = this.normalizeStatus(job.status);
      if (statusStr !== 'done') return false;
      const doneLog = job.statusLogs?.find(log => this.normalizeStatus(log.status) === 'done');
      if (!doneLog) return false;
      const jobDoneDate = new Date(doneLog.timestamp);
      jobDoneDate.setHours(0, 0, 0, 0);
      return jobDoneDate.getTime() === today.getTime();
    }).length;

    // กำลังดูแลลูกค้า = count jobs ที่ status = InProgress
    const inProgress = jobs.filter(job => {
      const statusStr = this.normalizeStatus(job.status);
      return statusStr === 'inprogress';
    }).length;

    // พนักงานพร้อมรับงาน = count queues ที่ status = Active
    const readyStaff = queues.filter(queue => {
      const normalizedStatus = typeof queue.status === 'string' ? queue.status.toLowerCase() : '';
      return normalizedStatus === 'active';
    }).length;

    this.summaryData.set([
      {
        title: 'ลูกค้าที่ดูแลแล้ววันนี้',
        value: servedToday,
        unit: 'ท่าน',
        icon: 'check',
        valueClass: 'text-gray-800',
        iconBgClass: 'bg-indigo-100',
        iconClass: 'text-indigo-600',
      },
      {
        title: 'กำลังดูแลลูกค้า',
        value: inProgress,
        unit: 'ท่าน',
        icon: 'pulse',
        valueClass: 'text-red-600',
        iconBgClass: 'bg-red-100',
        iconClass: 'text-red-600',
      },
      {
        title: 'พนักงานพร้อมรับงาน',
        value: readyStaff,
        unit: 'คน',
        icon: 'user-check',
        valueClass: 'text-green-600',
        iconBgClass: 'bg-green-100',
        iconClass: 'text-green-600',
      }
    ]);
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
