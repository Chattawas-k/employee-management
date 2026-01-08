import { ChangeDetectionStrategy, Component, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskColumnComponent, Task } from '../../shared/components/task-column/task-column.component';
import { ConfirmationDialogComponent } from '../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { SalesReportDialogComponent } from '../../shared/components/sales-report-dialog/sales-report-dialog.component';
import { TaskDetailDialogComponent } from '../../shared/components/task-detail-dialog/task-detail-dialog.component';
import { OpenJobDialogComponent } from '../../shared/components/open-job-dialog/open-job-dialog.component';
import { RejectTaskDialogComponent } from '../../shared/components/reject-task-dialog/reject-task-dialog.component';
import { TaskService } from '../../services/task.service';
import { AuthService } from '../../services/auth.service';
import { SignalRService } from '../../services/signalr.service';
import { QueueService } from '../../services/queue.service';
import { JobDto, JobStatus, JobPriority, UpdateJobStatusRequest, UpdateJobStatusReportDto } from '../../models/task.model';
import { MyQueueInfoResponse } from '../../models/queue.model';
import { getEmployeeIdFromToken } from '../../utils/jwt.util';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { ToastService } from '../../services/toast.service';

export type AvailabilityStatus = 'available' | 'busy' | 'break' | 'unavailable';

@Component({
  selector: 'app-my-tasks',
  standalone: true,
  templateUrl: './my-tasks.component.html',
  styleUrls: ['./my-tasks.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    TaskColumnComponent,
    ConfirmationDialogComponent,
    SalesReportDialogComponent,
    TaskDetailDialogComponent,
    OpenJobDialogComponent,
    RejectTaskDialogComponent
  ]
})
export class MyTasksComponent implements OnInit, OnDestroy {
  availabilityStatus = signal<AvailabilityStatus>('available');
  
  constructor(
    private taskService: TaskService,
    private authService: AuthService,
    private toastService: ToastService,
    private signalRService: SignalRService,
    private queueService: QueueService
  ) {}
  statusBannerInfo = signal<{ title: string; subtitle: string; borderColor: string; backgroundColor: string; iconContainerBg: string; iconBorder: string; iconColor: string; } | null>(null);
  
  isMyTurn = signal(false);
  currentUser = signal('สมศักดิ์ รักงาน (Bob)');
  
  queuesRemaining = signal(0);
  myQueuePosition = signal(0);
  currentlyServing = signal<{
    name: string;
    avatarUrl: string;
    queuePosition: number;
  } | null>(null);

  showStartDialog = signal(false);
  showRejectDialog = signal(false);
  showSalesReportDialog = signal(false);
  showTaskDetailDialog = signal(false);
  showOpenJobDialog = signal(false);
  selectedTask = signal<Task | null>(null);
  isLoading = signal(false);

  todoTasks = signal<Task[]>([]);
  inProgressTasks = signal<Task[]>([]);
  completedTasks = signal<Task[]>([]);

  isAvailable = computed(() => this.availabilityStatus() === 'available');
  // Show receive customer button only when status is 'break' or 'unavailable'
  canReceiveCustomer = computed(() => {
    const status = this.availabilityStatus();
    return status === 'break' || status === 'unavailable';
  });

  async ngOnInit(): Promise<void> {
    // Initialize status banner info based on availability status
    this.updateStatusBanner();
    this.loadTasks();
    this.loadQueueInfo();

    // Start SignalR connection for real-time updates
    try {
      await this.signalRService.startConnection();
      
      // Subscribe to real-time notifications
      this.signalRService.onJobStatusChanged(() => {
        // When job status changes, reload tasks to update availability status
        this.loadTasks();
      });

      this.signalRService.onQueueUpdated(() => {
        // When queue status changes, reload tasks and queue info
        this.loadTasks();
        // Reload queue info which will update availabilityStatus and banner
        this.loadQueueInfo(); // This will update availabilityStatus from queue status and call updateStatusBanner()
      });

      this.signalRService.onEmployeeStatusChanged(() => {
        // When employee status changes, reload queue info to sync status
        this.loadQueueInfo(); // This will update availabilityStatus from queue status and call updateStatusBanner()
      });

      this.signalRService.onJobAssigned((jobId, jobTitle, customer) => {
        // Show notification when new job is assigned
        this.toastService.success(`ได้รับงานใหม่: ${jobTitle}`);
        // Refresh tasks to show the new job
        this.loadTasks();
      });
    } catch (error) {
      console.error('Failed to start SignalR connection:', error);
      // Continue without real-time updates if SignalR fails
    }
  }

  ngOnDestroy(): void {
    // Unsubscribe from SignalR notifications
    this.signalRService.offJobStatusChanged();
    this.signalRService.offQueueUpdated();
    this.signalRService.offEmployeeStatusChanged();
    this.signalRService.offJobAssigned();
  }

  loadTasks(): void {
    this.isLoading.set(true);
    this.taskService.getMyTasks().pipe(
      catchError(error => {
        console.error('Error loading tasks:', error);
        this.toastService.error('เกิดข้อผิดพลาดในการโหลดงาน');
        return of({ jobs: [] });
      }),
      finalize(() => this.isLoading.set(false))
    ).subscribe(response => {
      // Backend uses camelCase, so response will have 'jobs' property
      const jobs = response.jobs || [];
      this.mapTasksFromApi(jobs);
    });
  }

  loadQueueInfo(): void {
    this.queueService.getMyQueueInfo().pipe(
      catchError(error => {
        console.error('Error loading queue info:', error);
        // If employee is not in queue, set defaults
        this.queuesRemaining.set(0);
        this.myQueuePosition.set(0);
        this.currentlyServing.set(null);
        this.isMyTurn.set(false);
        return of(null);
      })
    ).subscribe(queueInfo => {
      if (queueInfo && queueInfo.isInQueue) {
        this.queuesRemaining.set(queueInfo.queuesRemaining);
        this.myQueuePosition.set(queueInfo.myQueuePosition);
        this.isMyTurn.set(queueInfo.queuesRemaining === 0);
        
        // Update availability status from queue info
        // Use AvailabilityStatus from API (stored in database)
        const availabilityStatusLower = queueInfo.availabilityStatus?.toLowerCase() || '';
        const currentStatus = this.availabilityStatus();
        
        if (availabilityStatusLower === 'busy') {
          // AvailabilityStatus is Busy → set to busy
          this.availabilityStatus.set('busy');
        } else if (availabilityStatusLower === 'break') {
          // AvailabilityStatus is Break → set to break
          this.availabilityStatus.set('break');
        } else if (availabilityStatusLower === 'unavailable') {
          // AvailabilityStatus is Unavailable → set to unavailable
          this.availabilityStatus.set('unavailable');
        } else if (availabilityStatusLower === 'available') {
          // AvailabilityStatus is Available → check if should be available or busy
          // If manually set to break/unavailable, keep it (but this shouldn't happen if status is Available)
          if (currentStatus === 'break' || currentStatus === 'unavailable') {
            // Keep manual status - don't change it
            // But this is unlikely since backend status is Available
          } else {
            // Check if there are in-progress tasks (sync with app.component.ts logic)
            // Use inProgressTasks signal which is updated by mapTasksFromApi()
            if (this.inProgressTasks().length > 0) {
              this.availabilityStatus.set('busy');
            } else {
              this.availabilityStatus.set('available');
            }
          }
        } else {
          // Fallback: use queueStatus for backward compatibility
          const queueStatusLower = queueInfo.queueStatus?.toLowerCase() || '';
          if (queueStatusLower === 'busy') {
            this.availabilityStatus.set('busy');
          } else if (queueStatusLower === 'active') {
            if (this.inProgressTasks().length > 0) {
              this.availabilityStatus.set('busy');
            } else {
              this.availabilityStatus.set('available');
            }
          } else {
            this.availabilityStatus.set('unavailable');
          }
        }
        
        // Always update status banner after status change or when keeping manual status
        this.updateStatusBanner();
        
        if (queueInfo.currentlyServing) {
          // Generate avatar URL if not provided
          let avatarUrl = queueInfo.currentlyServing.avatarUrl;
          if (!avatarUrl) {
            const firstChar = queueInfo.currentlyServing.name.charAt(0).toUpperCase();
            // Use a placeholder or generate avatar URL
            avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(queueInfo.currentlyServing.name)}&background=6366f1&color=fff&size=128`;
          }
          
          this.currentlyServing.set({
            name: queueInfo.currentlyServing.name,
            avatarUrl: avatarUrl,
            queuePosition: queueInfo.currentlyServing.queuePosition
          });
        } else {
          this.currentlyServing.set(null);
        }
      } else {
        // Employee not in queue
        this.queuesRemaining.set(0);
        this.myQueuePosition.set(0);
        this.currentlyServing.set(null);
        this.isMyTurn.set(false);
        // Update status banner when not in queue
        this.updateStatusBanner();
      }
    });
  }

  private mapTasksFromApi(jobs: JobDto[]): void {
    const todo: Task[] = [];
    const inProgress: Task[] = [];
    const completed: Task[] = [];

    jobs.forEach(job => {
      // Skip jobs with invalid IDs
      if (!job.id || job.id === '00000000-0000-0000-0000-000000000000') {
        console.warn('Skipping job with invalid ID:', job);
        return;
      }

      const task = this.mapJobDtoToTask(job);
      
      // Handle both enum and string status from API
      const statusStr = typeof job.status === 'string' ? job.status.toLowerCase() : this.getStatusString(job.status as JobStatus);
      
      if (statusStr === 'pending') {
        todo.push(task);
      } else if (statusStr === 'inprogress' || statusStr === 'in-progress') {
        inProgress.push(task);
      } else if (statusStr === 'done' || statusStr === 'rejected') {
        completed.push(task);
      }
    });

    this.todoTasks.set(todo);
    this.inProgressTasks.set(inProgress);
    this.completedTasks.set(completed);

    // Update availability status based on InProgress tasks
    // Only update if status is 'available' or 'busy' (don't override 'break' or 'unavailable')
    // This should sync with queue status from loadQueueInfo()
    const currentStatus = this.availabilityStatus();
    
    // Don't override manual status (break/unavailable)
    if (currentStatus === 'break' || currentStatus === 'unavailable') {
      // If manually set to break/unavailable, ensure banner is updated
      this.updateStatusBanner();
      return; // Don't update status based on tasks
    }
    
    // Only update if status is 'available' or 'busy'
    if (inProgress.length > 0) {
      // Has InProgress tasks → should be 'busy'
      if (currentStatus === 'available') {
        this.availabilityStatus.set('busy');
        this.updateStatusBanner();
      }
    } else {
      // No InProgress tasks → should be 'available' (unless manually set to 'break' or 'unavailable')
      if (currentStatus === 'busy') {
        // Only change from busy to available if queue status is also Active
        // This will be handled by loadQueueInfo() which syncs with backend
        // For now, we'll update it here but loadQueueInfo() will override if needed
        this.availabilityStatus.set('available');
        this.updateStatusBanner();
      }
    }
  }

  private getStatusString(status: JobStatus): string {
    switch (status) {
      case JobStatus.Pending:
        return 'pending';
      case JobStatus.InProgress:
        return 'inprogress';
      case JobStatus.Done:
        return 'done';
      case JobStatus.Rejected:
        return 'rejected';
      default:
        return 'pending';
    }
  }

  private mapJobDtoToTask(job: JobDto): Task {
    const priorityText = this.getPriorityText(job.priority);
    const priorityClass = this.getPriorityClass(job.priority);
    const status = this.mapJobStatusToTaskStatus(job.status);
    
    // Get timestamps from status logs
    const createdLog = job.statusLogs.find(log => log.status === 'Pending');
    const startedLog = job.statusLogs.find(log => log.status === 'InProgress');
    const completedLog = job.statusLogs.find(log => log.status === 'Done' || log.status === 'Rejected');
    
    // Pass ISO string to task card component, let it format the date
    const createdAt = createdLog ? createdLog.timestamp : job.createdDate;
    const startedAt = startedLog ? startedLog.timestamp : null;
    const completedAt = completedLog ? completedLog.timestamp : null;

    let buttonText = 'เริ่มงาน';
    let buttonIcon: 'refresh' | 'check' | 'cross' = 'refresh';
    let buttonClass = 'bg-indigo-600 hover:bg-indigo-700 text-white';

    if (status === 'in-progress') {
      buttonText = 'ปิดงาน';
      buttonIcon = 'check';
      buttonClass = 'bg-emerald-600 hover:bg-emerald-700 text-white';
    } else if (status === 'completed') {
      buttonText = 'เสร็จสิ้น';
      buttonIcon = 'check';
      buttonClass = 'bg-gray-200 text-gray-500 cursor-not-allowed';
    } else if (status === 'rejected') {
      buttonText = 'ปฏิเสธแล้ว';
      buttonIcon = 'cross';
      buttonClass = 'bg-red-100 text-red-600 cursor-not-allowed border border-red-200';
    }

    // Map sales report data
    let salesReportData: any = null;
    if (job.report) {
      salesReportData = {
        status: this.mapSalesStatus(job.report.salesStatus),
        customerName: job.report.customerName,
        contactInfo: job.report.customerContact,
        reasons: job.report.reasons,
        productCategory: job.report.productCategory,
        description: job.report.description
      };
    }

    return {
      id: job.id,
      jobNumber: job.jobNumber,
      createdAt,
      priority: priorityText,
      priorityClass,
      buttonText,
      buttonIcon,
      buttonClass,
      startedAt,
      completedAt,
      jobTitle: job.title,
      customerName: job.customer,
      details: job.description,
      status,
      rejectionReason: job.statusLogs.find(log => log.status.includes('Rejected'))?.status.split(':')[1]?.trim(),
      salesReportData
    };
  }

  private mapJobStatusToTaskStatus(status: JobStatus | string): 'pending' | 'in-progress' | 'completed' | 'rejected' {
    // Handle string status from API (camelCase)
    if (typeof status === 'string') {
      const lowerStatus = status.toLowerCase();
      if (lowerStatus === 'pending') return 'pending';
      if (lowerStatus === 'inprogress' || lowerStatus === 'in-progress') return 'in-progress';
      if (lowerStatus === 'done') return 'completed';
      if (lowerStatus === 'rejected') return 'rejected';
      return 'pending';
    }

    // Handle enum status
    switch (status) {
      case JobStatus.Pending:
        return 'pending';
      case JobStatus.InProgress:
        return 'in-progress';
      case JobStatus.Done:
        return 'completed';
      case JobStatus.Rejected:
        return 'rejected';
      default:
        return 'pending';
    }
  }

  private getPriorityText(priority: JobPriority | string): string {
    // Handle string priority from API (camelCase)
    if (typeof priority === 'string') {
      const lowerPriority = priority.toLowerCase();
      if (lowerPriority === 'urgent') return 'ด่วน';
      if (lowerPriority === 'high') return 'สูง';
      if (lowerPriority === 'normal') return 'ทั่วไป';
      if (lowerPriority === 'low') return 'ต่ำ';
      return 'ทั่วไป';
    }

    // Handle enum priority
    switch (priority) {
      case JobPriority.Urgent:
        return 'ด่วน';
      case JobPriority.High:
        return 'สูง';
      case JobPriority.Normal:
        return 'ทั่วไป';
      case JobPriority.Low:
        return 'ต่ำ';
      default:
        return 'ทั่วไป';
    }
  }

  private getPriorityClass(priority: JobPriority | string): string {
    // Handle string priority from API (camelCase)
    if (typeof priority === 'string') {
      const lowerPriority = priority.toLowerCase();
      if (lowerPriority === 'urgent') return 'border-orange-200 bg-orange-100 text-orange-700';
      if (lowerPriority === 'high') return 'border-red-200 bg-red-100 text-red-700';
      if (lowerPriority === 'normal') return 'border-blue-200 bg-blue-100 text-blue-700';
      if (lowerPriority === 'low') return 'border-gray-200 bg-gray-100 text-gray-700';
      return 'border-blue-200 bg-blue-100 text-blue-700';
    }

    // Handle enum priority
    switch (priority) {
      case JobPriority.Urgent:
        return 'border-orange-200 bg-orange-100 text-orange-700';
      case JobPriority.High:
        return 'border-red-200 bg-red-100 text-red-700';
      case JobPriority.Normal:
        return 'border-blue-200 bg-blue-100 text-blue-700';
      case JobPriority.Low:
        return 'border-gray-200 bg-gray-100 text-gray-700';
      default:
        return 'border-blue-200 bg-blue-100 text-blue-700';
    }
  }

  private mapSalesStatus(status: string): 'Success' | 'Pending' | 'Failed' {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus === 'success') return 'Success';
    if (lowerStatus === 'pending') return 'Pending';
    if (lowerStatus === 'failed') return 'Failed';
    return 'Success';
  }

  private formatDate(date: Date): string {
    const day = date.getDate();
    const month = date.toLocaleString('th-TH', { month: 'short' });
    const year = date.getFullYear() + 543;
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day} ${month} ${year} (${hours}.${minutes} น.)`;
  }

  private updateStatusBanner() {
    switch (this.availabilityStatus()) {
      case 'busy':
        this.statusBannerInfo.set({
          title: 'คุณกำลังติดลูกค้า',
          subtitle: 'สถานะของคุณจะเปลี่ยนเป็น "พร้อมรับงาน" อัตโนมัติเมื่องานเสร็จ',
          borderColor: 'border-orange-500',
          backgroundColor: 'bg-orange-50',
          iconContainerBg: 'bg-orange-100',
          iconBorder: 'border-orange-200',
          iconColor: 'text-orange-600',
        });
        break;
      case 'break':
        this.statusBannerInfo.set({
          title: 'คุณกำลังพัก',
          subtitle: 'คุณจะไม่ได้รับคิวใหม่ระหว่างพัก',
          borderColor: 'border-yellow-500',
          backgroundColor: 'bg-yellow-50',
          iconContainerBg: 'bg-yellow-100',
          iconBorder: 'border-yellow-200',
          iconColor: 'text-yellow-600',
        });
        break;
      case 'unavailable':
        this.statusBannerInfo.set({
          title: 'คุณตั้งสถานะเป็น "ไม่พร้อมรับงาน"',
          subtitle: 'คุณจะไม่ได้รับคิวใหม่จนกว่าจะเปลี่ยนสถานะกลับมาเป็น "พร้อมรับงาน"',
          borderColor: 'border-gray-500',
          backgroundColor: 'bg-gray-50',
          iconContainerBg: 'bg-gray-100',
          iconBorder: 'border-gray-200',
          iconColor: 'text-gray-600',
        });
        break;
      case 'available':
      default:
        // When status is 'available', don't show the red banner
        this.statusBannerInfo.set(null);
        break;
    }
  }


  acceptCustomer() {
    this.showOpenJobDialog.set(true);
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
      priority
    }).pipe(
      catchError(error => {
        console.error('Error creating job:', error);
        this.toastService.error('เกิดข้อผิดพลาดในการสร้างงาน');
        return of(null);
      }),
      finalize(() => {
        this.isLoading.set(false);
        this.closeOpenJobDialog();
        // Reload tasks after a short delay to ensure backend has updated
        setTimeout(() => {
          this.loadTasks();
        }, 200);
      })
    ).subscribe(response => {
      if (response) {
        this.toastService.success('สร้างงานสำเร็จ');
        this.isMyTurn.set(false);
        // availabilityStatus will be updated automatically when loadTasks() completes
      }
    });
  }

  handleTaskAction(action: { task: Task; actionType: 'start' | 'complete' | 'reject' }) {
    this.selectedTask.set(action.task);
    if (action.actionType === 'start') {
      this.showStartDialog.set(true);
    } else if (action.actionType === 'complete') {
      this.showSalesReportDialog.set(true);
    } else if (action.actionType === 'reject') {
      this.showStartDialog.set(false);
      this.showRejectDialog.set(true);
    }
  }

  showTaskDetails(task: Task) {
    this.selectedTask.set(task);
    this.showTaskDetailDialog.set(true);
  }

  closeTaskDetailDialog() {
    this.showTaskDetailDialog.set(false);
    this.selectedTask.set(null);
  }

  handleStartTaskConfirmation() {
    const taskToMove = this.selectedTask();
    if (!taskToMove || !taskToMove.id || taskToMove.id === '00000000-0000-0000-0000-000000000000') {
      this.toastService.error('ไม่พบข้อมูลงาน');
      this.closeStartDialog();
      return;
    }

    this.isLoading.set(true);
    this.taskService.updateJobStatus(taskToMove.id, {
      id: taskToMove.id,
      status: JobStatus.InProgress
    }).pipe(
      catchError(error => {
        console.error('Error starting task:', error);
        this.toastService.error('เกิดข้อผิดพลาดในการเริ่มงาน');
        return of(null);
      }),
      finalize(() => {
        this.isLoading.set(false);
        this.closeStartDialog();
        // Reload tasks after a short delay to ensure backend has updated
        setTimeout(() => {
          this.loadTasks();
        }, 200);
      })
    ).subscribe(response => {
      if (response) {
        this.toastService.success('เริ่มงานสำเร็จ');
        // availabilityStatus will be updated automatically when loadTasks() completes
      }
    });
  }

  handleRejectTask() {
    this.showStartDialog.set(false);
    this.showRejectDialog.set(true);
  }

  confirmRejectTask(rejectionData: { reason: string }) {
    const taskToReject = this.selectedTask();
    if (!taskToReject || !taskToReject.id || taskToReject.id === '00000000-0000-0000-0000-000000000000') {
      this.toastService.error('ไม่พบข้อมูลงาน');
      this.closeRejectDialog();
      return;
    }

    this.isLoading.set(true);
    this.taskService.updateJobStatus(taskToReject.id, {
      id: taskToReject.id,
      status: JobStatus.Rejected,
      rejectReason: rejectionData.reason
    }).pipe(
      catchError(error => {
        console.error('Error rejecting task:', error);
        this.toastService.error('เกิดข้อผิดพลาดในการปฏิเสธงาน');
        return of(null);
      }),
      finalize(() => {
        this.isLoading.set(false);
        this.closeRejectDialog();
        // Reload tasks after a short delay to ensure backend has updated
        setTimeout(() => {
          this.loadTasks();
        }, 200);
      })
    ).subscribe(response => {
      if (response) {
        this.toastService.success('ปฏิเสธงานสำเร็จ');
      }
    });
  }

  closeRejectDialog() {
    this.showRejectDialog.set(false);
    this.selectedTask.set(null);
  }

  confirmCompleteTask(reportData: any) {
    const taskToMove = this.selectedTask();
    if (!taskToMove || !taskToMove.id || taskToMove.id === '00000000-0000-0000-0000-000000000000') {
      this.toastService.error('ไม่พบข้อมูลงาน');
      this.closeSalesReportDialog();
      return;
    }

    // Map report data to API format
    const reasons: string[] = [];
    if (reportData.reasons) {
      const reasonControls = reportData.reasons;
      Object.keys(reasonControls).forEach(key => {
        if (reasonControls[key]) {
          // Find the label for this control name
          const allReasons = [
            { controlName: 'wantsToDecide', label: 'ขอไปตัดสินใจก่อน' },
            { controlName: 'waitingForPromo', label: 'รอโปรโมชั่น' },
            { controlName: 'comparing', label: 'เปรียบเทียบกับที่อื่น' },
            { controlName: 'consultingFamily', label: 'ปรึกษาครอบครัว/เพื่อน' },
            { controlName: 'needsMoreInfo', label: 'ต้องการข้อมูลเพิ่มเติม' },
            { controlName: 'waitingForStock', label: 'รอสินค้าเข้า' },
            { controlName: 'financialApproval', label: 'รออนุมัติทางการเงิน' },
            { controlName: 'undecidedOnSpec', label: 'ยังไม่แน่ใจเรื่องสี/ขนาด' },
            { controlName: 'seasonalTiming', label: 'รอฤกษ์/ช่วงเวลาที่เหมาะสม' },
            { controlName: 'wantsToSeeSample', label: 'ต้องการดูสินค้าตัวอย่าง' },
            { controlName: 'priceTooHigh', label: 'ราคาสูงไป' },
            { controlName: 'productMismatch', label: 'สินค้าไม่ตรงความต้องการ' },
            { controlName: 'badService', label: 'ไม่พอใจบริการ' },
            { controlName: 'foundCheaper', label: 'เจอที่อื่นถูกกว่า' },
            { controlName: 'longDelivery', label: 'ระยะเวลาจัดส่งนานไป' },
            { controlName: 'outOfStock', label: 'สินค้าหมด/เลิกผลิต' },
            { controlName: 'negativeReview', label: 'เห็นรีวิวไม่ดี' },
            { controlName: 'competitorOffer', label: 'ข้อเสนอของคู่แข่งดีกว่า' },
            { controlName: 'changedMind', label: 'เปลี่ยนใจ/ไม่ต้องการแล้ว' },
            { controlName: 'budgetCut', label: 'งบประมาณไม่พอ' }
          ];
          const reason = allReasons.find(r => r.controlName === key);
          if (reason) {
            reasons.push(reason.label);
          }
        }
      });
    }

    const productCategories: string[] = [];
    if (reportData.interestedProducts) {
      const productControls = reportData.interestedProducts;
      const productMap: { [key: string]: string } = {
        livingRoom: 'โซฟาและห้องนั่งเล่น',
        bedroom: 'ชุดห้องนอน',
        dining: 'โต๊ะอาหาร',
        kitchen: 'ชุดครัว',
        office: 'เฟอร์นิเจอร์สำนักงาน',
        outdoor: 'เฟอร์นิเจอร์นอกบ้าน',
        lighting: 'โคมไฟและของตกแต่ง',
        storage: 'ตู้และชั้นวางของ',
        kids: 'เฟอร์นิเจอร์เด็ก'
      };
      Object.keys(productControls).forEach(key => {
        if (productControls[key] && productMap[key]) {
          productCategories.push(productMap[key]);
        }
      });
    }

    const report: UpdateJobStatusReportDto = {
      customerName: reportData.customerName || taskToMove.customerName || '',
      customerContact: reportData.contactInfo || '',
      salesStatus: reportData.status?.toLowerCase() || 'success',
      reasons,
      productCategory: productCategories.join(', '),
      description: reportData.additionalInfo || ''
    };

    this.isLoading.set(true);
    this.taskService.updateJobStatus(taskToMove.id, {
      id: taskToMove.id,
      status: JobStatus.Done,
      report
    }).pipe(
      catchError(error => {
        console.error('Error completing task:', error);
        this.toastService.error('เกิดข้อผิดพลาดในการปิดงาน');
        return of(null);
      }),
      finalize(() => {
        this.isLoading.set(false);
        this.closeSalesReportDialog();
        // Reload tasks after a short delay to ensure backend has updated
        // mapTasksFromApi() will automatically update availabilityStatus based on InProgress tasks
        setTimeout(() => {
          this.loadTasks();
        }, 200);
      })
    ).subscribe(response => {
      if (response) {
        this.toastService.success('ปิดงานสำเร็จ');
      }
    });
  }

  closeStartDialog() {
    this.showStartDialog.set(false);
    this.selectedTask.set(null);
  }

  closeSalesReportDialog() {
    this.showSalesReportDialog.set(false);
    this.selectedTask.set(null);
  }
}

