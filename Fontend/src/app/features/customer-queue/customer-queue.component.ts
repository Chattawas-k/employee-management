import { ChangeDetectionStrategy, Component, signal, OnInit, OnDestroy, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SummaryCardComponent } from '../../shared/components/summary-card/summary-card.component';
import { CalloutCardComponent } from '../../shared/components/callout-card/callout-card.component';
import { OpenJobDialogComponent } from '../../shared/components/open-job-dialog/open-job-dialog.component';
import { QueueService } from '../../services/queue.service';
import { TaskService } from '../../services/task.service';
import { AuthService } from '../../services/auth.service';
import { SignalRService } from '../../services/signalr.service';
import { ToastService } from '../../services/toast.service';
import { QueueDto, QueueSummaryJobDto, MyQueueInfoResponse } from '../../models/queue.model';
import { JobPriority, JobStatus } from '../../models/task.model';
import { getEmployeeIdFromToken } from '../../utils/jwt.util';
import { forkJoin, of, Subscription } from 'rxjs';
import { catchError, finalize, switchMap, map } from 'rxjs/operators';
import { AvailabilityStatusKey, getAvailabilityStatusLabel, normalizeAvailabilityStatus } from '../../shared/utils/availability-status.util';
import { MyStatusStore } from '../../services/my-status.store';
import { ReceiveCustomerService } from '../../services/receive-customer.service';

interface ReadyQueueStaff {
  queue: number;
  name: string;
  avatar: string;
  status: string;
  servedToday: number;
  isNext?: boolean;
  isAvatarLetter?: boolean;
}

interface BusyStaff {
  name: string;
  avatar: string;
  status: string;
  startTime: number;
  duration: string;
  startTimeFormatted: string;
  jobId: string;
  isAvatarLetter?: boolean;
}

interface UnavailableStaff {
  name: string;
  avatar: string;
  status: 'พักเที่ยง' | 'ไม่พร้อมรับงาน' | 'ลา' | 'พบลูกค้านอกสถานที่';
  statusClass: string; // CSS classes for status badge
  isAvatarLetter?: boolean;
  statusChangedTime?: string; // Formatted time when status was changed
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
  imports: [CommonModule, SummaryCardComponent, CalloutCardComponent, OpenJobDialogComponent],
  templateUrl: './customer-queue.component.html',
  styleUrls: ['./customer-queue.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerQueueComponent implements OnInit, OnDestroy {
  private timerId?: number;
  private refreshTimerId?: number;
  private signalRSub = new Subscription();
  isLoading = signal(false);
  allJobs: QueueSummaryJobDto[] = [];

  // Centralized status (same across pages)
  private myStatusStore = inject(MyStatusStore);
  private receiveCustomerService = inject(ReceiveCustomerService);
  queueInfo = this.myStatusStore.myQueueInfo;
  isMyTurn = this.myStatusStore.isMyTurn;
  availabilityStatus = this.myStatusStore.availabilityStatus;
  showOpenJobDialog = signal(false);

  constructor(
    private queueService: QueueService,
    private taskService: TaskService,
    private authService: AuthService,
    private toastService: ToastService,
    private signalRService: SignalRService
  ) {}

  summaryData = signal<SummaryCardData[]>([
    {
      title: 'ลูกค้าที่ดูแลแล้ววันนี้',
      value: 51,
      unit: 'ท่าน',
      icon: 'check',
      valueClass: '',
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
  lunchBreakStaff = signal<UnavailableStaff[]>([]);
  unavailableStaff = signal<UnavailableStaff[]>([]);
  leaveStaff = signal<UnavailableStaff[]>([]);
  offsiteCustomerStaff = signal<UnavailableStaff[]>([]);

  // Collapsible panels (default: collapsed)
  isLunchBreakCollapsed = signal(true);
  isUnavailableCollapsed = signal(true);
  isLeaveCollapsed = signal(true);
  isOffsiteCollapsed = signal(true);

  toggleLunchBreak(): void {
    this.isLunchBreakCollapsed.update(v => !v);
  }

  toggleUnavailable(): void {
    this.isUnavailableCollapsed.update(v => !v);
  }

  toggleLeave(): void {
    this.isLeaveCollapsed.update(v => !v);
  }

  toggleOffsite(): void {
    this.isOffsiteCollapsed.update(v => !v);
  }

  ngOnInit(): void {
    this.loadQueueData();
    this.myStatusStore.init();
    this.setupSignalR();

    // Auto-refresh every 30 seconds (fallback if SignalR fails)
    this.refreshTimerId = window.setInterval(() => {
      this.loadQueueData();
      this.myStatusStore.requestRefresh();
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
    this.signalRSub.unsubscribe();
  }

  private setupSignalR(): void {
    this.signalRService
      .startConnection()
      .then(() => {
        this.signalRSub.add(this.signalRService.queueUpdated$.subscribe(() => this.loadQueueData()));
        this.signalRSub.add(this.signalRService.jobStatusChanged$.subscribe(() => this.loadQueueData()));
        this.signalRSub.add(this.signalRService.employeeStatusChanged$.subscribe(() => this.loadQueueData()));
      })
      .catch(err => console.error('SignalR Connection Error in CustomerQueueComponent: ', err));
  }

  acceptCustomer() {
    this.receiveCustomerService.open();
  }

  closeOpenJobDialog() {
    this.showOpenJobDialog.set(false);
  }

  confirmOpenJob(jobData: any) {
    const token = this.authService.getToken();
    const employeeId = getEmployeeIdFromToken(token);
    
    if (!employeeId) {
      this.toastService.error('ไม่พบข้อมูลพนักงาน');
      return;
    }

    const priority = jobData.priority === 'Urgent' ? JobPriority.Urgent : JobPriority.Normal;
    
    this.isLoading.set(true);
    this.taskService.createJob({
      title: jobData.jobTitle,
      customer: jobData.customerName,
      description: jobData.details || '',
      assigneeId: employeeId,
      priority,
      channel: jobData.channel || 'Walk-in',
      productCategoryId: jobData.productCategoryId || undefined
    }).pipe(
      // After creating job, immediately update status to InProgress
      switchMap(createResponse => {
        if (!createResponse) {
          return of(null);
        }
        // Update status to InProgress automatically
        return this.taskService.updateJobStatus(createResponse.id, {
          id: createResponse.id,
          status: JobStatus.InProgress
        }).pipe(
          map(updateResponse => ({ createResponse, updateResponse }))
        );
      }),
      catchError(error => {
        console.error('Error creating or updating job:', error);
        this.toastService.error('เกิดข้อผิดพลาดในการสร้างงาน');
        return of(null);
      }),
      finalize(() => {
        this.isLoading.set(false);
        this.closeOpenJobDialog();
        // Reload queue data after a short delay to ensure backend has updated
        setTimeout(() => {
          this.loadQueueData();
          this.myStatusStore.requestRefresh();
        }, 200);
      })
    ).subscribe(response => {
      if (response) {
        this.toastService.success('สร้างงานและเริ่มงานสำเร็จ');
        this.myStatusStore.requestRefresh();
      }
    });
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
    const lunchBreakStaffList: UnavailableStaff[] = [];
    const unavailableStaffList: UnavailableStaff[] = [];
    const leaveStaffList: UnavailableStaff[] = [];
    const offsiteCustomerStaffList: UnavailableStaff[] = [];

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
      const employeeName = queue.employeeName || 'ไม่ระบุชื่อ';
      const initial = queue.employeeName ? queue.employeeName.charAt(0).toUpperCase() : '?';
      const servedToday = typeof queue.round === 'number' && queue.round >= 1 ? queue.round : 1;
      const isNext = relativePosition === 1; // First in Ready Queue is "next"

      readyQueueList.push({
        queue: relativePosition, // Use relative position, not master position
        name: employeeName,
        avatar: initial,
        status: isNext ? 'รอบ' : 'รอรับลูกค้า',
        servedToday,
        isNext,
        isAvatarLetter: true
      });
    });

    // Process Busy and Unavailable staff
    const sortedQueues = [...queues].sort((a, b) => a.position - b.position);

    sortedQueues.forEach((queue) => {
      const employeeName = queue.employeeName || 'ไม่ระบุชื่อ';
      const initial = queue.employeeName ? queue.employeeName.charAt(0).toUpperCase() : '?';
      const servedToday = typeof queue.round === 'number' && queue.round >= 1 ? queue.round : 1;

      const normalizedStatus = typeof queue.status === 'string' ? queue.status.toLowerCase() : String(queue.status || '').toLowerCase();
      const availabilityKey = normalizeAvailabilityStatus(queue.availabilityStatus);

      // Show non-available statuses in their own panels (lunchBreak / unavailable / leave / offsiteCustomer)
      if (availabilityKey !== 'available' && availabilityKey !== 'busy') {
        const statusText = getAvailabilityStatusLabel(availabilityKey) as UnavailableStaff['status'];
        const statusClass = availabilityKey === 'lunchBreak'
          ? 'bg-yellow-100 text-yellow-800'
          : availabilityKey === 'unavailable'
            ? 'bg-gray-100 '
            : availabilityKey === 'leave'
              ? 'bg-red-100 text-red-800'
              : 'bg-blue-100 text-blue-800';
        
        // Format the status changed time
        const statusChangedTime = queue.updatedDate 
          ? this.formatStatusChangedTime(queue.updatedDate)
          : undefined;

        const staffItem: UnavailableStaff = {
          name: employeeName,
          avatar: initial,
          status: statusText,
          statusClass: statusClass,
          isAvatarLetter: true,
          statusChangedTime: statusChangedTime
        };

        switch (availabilityKey) {
          case 'lunchBreak':
            lunchBreakStaffList.push(staffItem);
            break;
          case 'unavailable':
            unavailableStaffList.push(staffItem);
            break;
          case 'leave':
            leaveStaffList.push(staffItem);
            break;
          case 'offsiteCustomer':
            offsiteCustomerStaffList.push(staffItem);
            break;
        }

        return; // Skip further processing for this queue
      }

      if (normalizedStatus === 'busy' || availabilityKey === 'busy') {
        const job = this.findActiveJobForEmployee(queue.employeeId);
        const startTime = job ? this.getJobStartTime(job) : Date.now();
        const startTimeFormatted = job ? this.formatStartTime(job) : '';
        const jobId = job?.jobRunningCode || job?.jobNumber || '';

        busyStaffList.push({
          name: employeeName,
          avatar: initial,
          status: 'ให้บริการอยู่',
          startTime,
          duration: '00:00',
          startTimeFormatted,
          jobId: jobId ? `#${jobId}` : '',
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
        const employeeName = job.assigneeName || 'ไม่ระบุชื่อ';
        const initial = job.assigneeName ? job.assigneeName.charAt(0).toUpperCase() : '?';
        const startTime = this.getJobStartTime(job);
        const startTimeFormatted = this.formatStartTime(job);
        const jobId = job.jobRunningCode || job.jobNumber || '';

        busyStaffList.push({
          name: employeeName,
          avatar: initial,
          status: 'ให้บริการอยู่',
          startTime,
          duration: '00:00',
          startTimeFormatted,
          jobId: jobId ? `#${jobId}` : '',
          isAvatarLetter: true
        });
      }
    });

    this.readyQueue.set(readyQueueList);
    this.busyStaff.set(busyStaffList);
    this.lunchBreakStaff.set(lunchBreakStaffList);
    this.unavailableStaff.set(unavailableStaffList);
    this.leaveStaff.set(leaveStaffList);
    this.offsiteCustomerStaff.set(offsiteCustomerStaffList);
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
      if (statusStr !== 'closedwon' && statusStr !== 'closedlost' && statusStr !== 'cancelled') return false;
      const doneLog = job.statusLogs?.find(log => {
        const logStatus = this.normalizeStatus(log.status);
        return logStatus === 'closedwon' || logStatus === 'closedlost' || logStatus === 'cancelled';
      });
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
    // Handle enum values: 1=Pending, 2=Assigned, 3=InProgress, 4=ClosedWon, 5=ClosedLost, 6=Cancelled
    if (typeof status === 'number') {
      const statusMap: { [key: number]: string } = {
        1: 'pending',
        2: 'assigned',
        3: 'inprogress',
        4: 'closedwon',
        5: 'closedlost',
        6: 'cancelled'
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

  private formatStatusChangedTime(updatedDate: string): string {
    try {
      const date = new Date(updatedDate);
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes} น.`;
    } catch (error) {
      console.warn('Error formatting status changed time:', error);
      return '';
    }
  }

  private updateSummaryData(queues: QueueDto[], jobs: QueueSummaryJobDto[]): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // ลูกค้าที่ดูแลแล้ววันนี้ = count jobs ที่ status = Done ในวันนี้
    const servedToday = jobs.filter(job => {
      const statusStr = this.normalizeStatus(job.status);
      if (statusStr !== 'closedwon' && statusStr !== 'closedlost' && statusStr !== 'cancelled') return false;
      const doneLog = job.statusLogs?.find(log => {
        const logStatus = this.normalizeStatus(log.status);
        return logStatus === 'closedwon' || logStatus === 'closedlost' || logStatus === 'cancelled';
      });
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
        valueClass: '',
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
