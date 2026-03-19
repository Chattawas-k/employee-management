import { ChangeDetectionStrategy, Component, signal, computed, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskColumnComponent, Task } from '../../shared/components/task-column/task-column.component';
import { ConfirmationDialogComponent } from '../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { CalloutCardComponent } from '../../shared/components/callout-card/callout-card.component';
import { SalesReportDialogComponent } from '../../shared/components/sales-report-dialog/sales-report-dialog.component';
import { TaskDetailDialogComponent } from '../../shared/components/task-detail-dialog/task-detail-dialog.component';
import { RejectTaskDialogComponent } from '../../shared/components/reject-task-dialog/reject-task-dialog.component';
import { TaskService } from '../../services/task.service';
import { AuthService } from '../../services/auth.service';
import { SignalRService } from '../../services/signalr.service';
import { JobDto, JobStatus, JobPriority, UpdateJobStatusRequest, UpdateJobStatusReportDto, JobGetResponse, MyTaskStatusLogDto } from '../../models/task.model';
import { getEmployeeIdFromToken } from '../../utils/jwt.util';
import { catchError, finalize, switchMap, map } from 'rxjs/operators';
import { of, Subscription } from 'rxjs';
import { ToastService } from '../../services/toast.service';
import { MyStatusStore } from '../../services/my-status.store';
import { ReceiveCustomerService } from '../../services/receive-customer.service';

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
    CalloutCardComponent,
    SalesReportDialogComponent,
    TaskDetailDialogComponent,
    RejectTaskDialogComponent
  ]
})
export class MyTasksComponent implements OnInit, OnDestroy {
  // Centralized status (same across pages)
  private myStatusStore = inject(MyStatusStore);
  private receiveCustomerService = inject(ReceiveCustomerService);
  queueInfo = this.myStatusStore.myQueueInfo;
  availabilityStatus = this.myStatusStore.availabilityStatus;
  
  constructor(
    private taskService: TaskService,
    private authService: AuthService,
    private toastService: ToastService,
    private signalRService: SignalRService
  ) {}
  isMyTurn = this.myStatusStore.isMyTurn;
  private signalRSub = new Subscription();
  currentUser = signal('สมศักดิ์ รักงาน (Bob)');
  
  // Queue related UI is driven by MyStatusStore now

  showStartDialog = signal(false);
  showRejectDialog = signal(false);
  showSalesReportDialog = signal(false);
  showTaskDetailDialog = signal(false);
  selectedTask = signal<Task | null>(null);
  isLoading = signal(false);
  startDialogContext = signal<'existingTask' | 'walkInJob'>('existingTask');

  todoTasks = signal<Task[]>([]);
  inProgressTasks = signal<Task[]>([]);
  completedTasks = signal<Task[]>([]);

  isAvailable = computed(() => this.availabilityStatus() === 'available');
  // Show receive customer button only when employee is NOT ready to receive a new job
  canReceiveCustomer = computed(() => {
    const status = this.availabilityStatus();
    return status === 'lunchBreak' || status === 'unavailable' || status === 'leave' || status === 'offsiteCustomer';
  });

  async ngOnInit(): Promise<void> {
    this.loadTasks();
    this.myStatusStore.init();

    // Start SignalR connection for real-time updates
    try {
      await this.signalRService.startConnection();
      
      // Subscribe to real-time notifications
      this.signalRSub.add(this.signalRService.jobStatusChanged$.subscribe(() => this.loadTasks()));
      this.signalRSub.add(this.signalRService.queueUpdated$.subscribe(() => this.loadTasks()));
      this.signalRSub.add(this.signalRService.employeeStatusChanged$.subscribe(() => this.myStatusStore.requestRefresh()));
      this.signalRSub.add(this.signalRService.jobAssigned$.subscribe(({ jobTitle }) => {
        this.toastService.success(`ได้รับงานใหม่: ${jobTitle}`);
        this.loadTasks();
      }));
    } catch (error) {
      console.error('Failed to start SignalR connection:', error);
      // Continue without real-time updates if SignalR fails
    }
  }

  ngOnDestroy(): void {
    this.signalRSub.unsubscribe();
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

  // Queue status for callouts is managed centrally by MyStatusStore to keep all pages in sync.

  private mapTasksFromApi(jobs: JobDto[]): void {
    const todo: Task[] = [];
    const inProgress: Task[] = [];
    const completed: Task[] = [];

    // Get today's date at midnight (start of day) in local timezone
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.getTime();

    jobs.forEach(job => {
      // Skip jobs with invalid IDs
      if (!job.id || job.id === '00000000-0000-0000-0000-000000000000') {
        console.warn('Skipping job with invalid ID:', job);
        return;
      }

      const task = this.mapJobDtoToTask(job);
      
      // Handle both enum and string status from API
      const statusStr = typeof job.status === 'string' ? job.status.toLowerCase() : this.getStatusString(job.status as JobStatus);
      
      if (statusStr === 'pending' || statusStr === 'assigned') {
        todo.push(task);
      } else if (statusStr === 'inprogress' || statusStr === 'in-progress') {
        inProgress.push(task);
      } else if (statusStr === 'closedwon' || statusStr === 'closedlost' || statusStr === 'cancelled') {
        // Only include completed tasks that were completed today
        if (task.completedAt) {
          const completedDate = new Date(task.completedAt);
          completedDate.setHours(0, 0, 0, 0);
          const completedDateStart = completedDate.getTime();
          
          // Check if completed date is today
          if (completedDateStart === todayStart) {
            completed.push(task);
          }
        }
      }
    });

    this.todoTasks.set(todo);
    this.inProgressTasks.set(inProgress);
    this.completedTasks.set(completed);

    // Status is derived centrally; keep this component focused on task lists.
    this.myStatusStore.requestRefresh();
  }

  private getStatusString(status: JobStatus): string {
    switch (status) {
      case JobStatus.Pending:
        return 'pending';
      case JobStatus.Assigned:
        return 'assigned';
      case JobStatus.InProgress:
        return 'inprogress';
      case JobStatus.ClosedWon:
        return 'closedwon';
      case JobStatus.ClosedLost:
        return 'closedlost';
      case JobStatus.Cancelled:
        return 'cancelled';
      default:
        return 'pending';
    }
  }

  private mapJobGetResponseToTask(job: JobGetResponse): Task {
    const priorityText = this.getPriorityText(job.priority);
    const priorityClass = this.getPriorityClass(job.priority);
    const status = this.mapJobStatusToTaskStatus(job.status);
    
    // Get timestamps from status logs
    const createdLog = this.findStatusLog(job.statusLogs, ['pending', 'assigned', 'created']);
    const startedLog = this.findStatusLog(job.statusLogs, ['inprogress', 'started']);
    const completedLog = this.findStatusLog(job.statusLogs, ['closedwon', 'closedlost', 'done', 'completed', 'cancelled', 'rejected']);
    
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
      buttonClass = 'bg-green-600 hover:bg-green-700 text-white';
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
      jobRunningCode: job.jobRunningCode ?? null,
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
      rejectionReason: job.statusLogs.find((log: MyTaskStatusLogDto) => log.status.includes('Cancelled'))?.status.split(':')[1]?.trim(),
      salesReportData
    };
  }

  private mapJobDtoToTask(job: JobDto): Task {
    const priorityText = this.getPriorityText(job.priority);
    const priorityClass = this.getPriorityClass(job.priority);
    const status = this.mapJobStatusToTaskStatus(job.status);
    
    // Get timestamps from status logs
    const createdLog = this.findStatusLog(job.statusLogs, ['pending', 'assigned', 'created']);
    const startedLog = this.findStatusLog(job.statusLogs, ['inprogress', 'started']);
    const completedLog = this.findStatusLog(job.statusLogs, ['closedwon', 'closedlost', 'done', 'completed', 'cancelled', 'rejected']);
    
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
      buttonClass = 'bg-green-600 hover:bg-green-700 text-white';
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
      jobRunningCode: job.jobRunningCode ?? null,
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
      rejectionReason: job.statusLogs.find((log: MyTaskStatusLogDto) => log.status.includes('Cancelled'))?.status.split(':')[1]?.trim(),
      salesReportData
    };
  }

  private mapJobStatusToTaskStatus(status: JobStatus | string): 'pending' | 'in-progress' | 'completed' | 'rejected' {
    // Handle string status from API (camelCase)
    if (typeof status === 'string') {
      const lowerStatus = status.toLowerCase();
      if (lowerStatus === 'pending' || lowerStatus === 'assigned') return 'pending';
      if (lowerStatus === 'inprogress' || lowerStatus === 'in-progress') return 'in-progress';
      if (lowerStatus === 'closedwon' || lowerStatus === 'closedlost') return 'completed';
      if (lowerStatus === 'cancelled') return 'rejected';
      return 'pending';
    }

    // Handle enum status
    switch (status) {
      case JobStatus.Pending:
      case JobStatus.Assigned:
        return 'pending';
      case JobStatus.InProgress:
        return 'in-progress';
      case JobStatus.ClosedWon:
      case JobStatus.ClosedLost:
        return 'completed';
      case JobStatus.Cancelled:
        return 'rejected';
      default:
        return 'pending';
    }
  }

  private findStatusLog(logs: MyTaskStatusLogDto[] | undefined, keywords: string[]): MyTaskStatusLogDto | undefined {
    if (!logs || logs.length === 0) return undefined;
    const normalizedKeywords = keywords.map(keyword => keyword.toLowerCase());
    return logs.find(log => {
      const logStatus = (log.status ?? '').toString().toLowerCase();
      return normalizedKeywords.some(keyword => logStatus.includes(keyword));
    });
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

  acceptCustomer() {
    this.receiveCustomerService.open();
  }

  private mapCreateJobResponseToTask(createResponse: any): Task {
    return {
      id: createResponse.id,
      jobNumber: createResponse.jobNumber,
      jobRunningCode: createResponse.jobRunningCode ?? null,
      createdAt: createResponse.createdDate,
      priority: this.getPriorityText(createResponse.priority),
      priorityClass: this.getPriorityClass(createResponse.priority),
      buttonText: 'เริ่มงาน',
      buttonIcon: 'refresh',
      buttonClass: 'bg-indigo-600 hover:bg-indigo-700 text-white',
      startedAt: null,
      completedAt: null,
      jobTitle: createResponse.title,
      customerName: createResponse.customer,
      details: createResponse.description,
      status: 'pending'
    };
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
    // Set the basic task info first for immediate display
    this.selectedTask.set(task);
    this.showTaskDetailDialog.set(true);
    
    // Load full details from API
    if (!task.id || task.id === '00000000-0000-0000-0000-000000000000') {
      console.warn('Invalid task ID:', task);
      return;
    }

    this.isLoading.set(true);
    this.taskService.getJobById(task.id).pipe(
      catchError(error => {
        console.error('Error loading task details:', error);
        this.toastService.error('เกิดข้อผิดพลาดในการโหลดรายละเอียดงาน');
        return of(null);
      }),
      finalize(() => this.isLoading.set(false))
    ).subscribe(response => {
      if (response) {
        // Map the full job details to Task format
        const fullTask = this.mapJobGetResponseToTask(response);
        this.selectedTask.set(fullTask);
      }
    });
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
    // For walk-in flow, reject should cancel immediately (no extra form)
    if (this.startDialogContext() === 'walkInJob') {
      const task = this.selectedTask();
      this.showStartDialog.set(false);
      if (task?.id) {
        this.cancelJob(task.id, 'ปฏิเสธงาน');
      }
      this.selectedTask.set(null);
      this.startDialogContext.set('existingTask');
      return;
    }

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
      status: JobStatus.Cancelled,
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
    const reasonIds: string[] = Array.isArray(reportData.reasonIds) ? reportData.reasonIds : [];
    let reasons: string[] = [];
    if (Array.isArray(reportData.reasons)) {
      reasons = reportData.reasons;
    } else if (reportData.reasons && typeof reportData.reasons === 'object') {
      // Legacy format (controlName -> boolean)
      const reasonControls = reportData.reasons;
      const legacyMap: { [key: string]: string } = {
        wantsToDecide: 'ขอไปตัดสินใจก่อน',
        waitingForPromo: 'รอโปรโมชั่น',
        comparing: 'เปรียบเทียบกับที่อื่น',
        consultingFamily: 'ปรึกษาครอบครัว/เพื่อน',
        needsMoreInfo: 'ต้องการข้อมูลเพิ่มเติม',
        waitingForStock: 'รอสินค้าเข้า',
        financialApproval: 'รออนุมัติทางการเงิน',
        undecidedOnSpec: 'ยังไม่แน่ใจเรื่องสี/ขนาด',
        seasonalTiming: 'รอฤกษ์/ช่วงเวลาที่เหมาะสม',
        wantsToSeeSample: 'ต้องการดูสินค้าตัวอย่าง',
        priceTooHigh: 'ราคาสูงไป',
        productMismatch: 'สินค้าไม่ตรงความต้องการ',
        badService: 'ไม่พอใจบริการ',
        foundCheaper: 'เจอที่อื่นถูกกว่า',
        longDelivery: 'ระยะเวลาจัดส่งนานไป',
        outOfStock: 'สินค้าหมด/เลิกผลิต',
        negativeReview: 'เห็นรีวิวไม่ดี',
        competitorOffer: 'ข้อเสนอของคู่แข่งดีกว่า',
        changedMind: 'เปลี่ยนใจ/ไม่ต้องการแล้ว',
        budgetCut: 'งบประมาณไม่พอ'
      };
      Object.keys(reasonControls).forEach(key => {
        if (reasonControls[key] && legacyMap[key]) {
          reasons.push(legacyMap[key]);
        }
      });
    }

    // reportData.interestedProducts can be either:
    // 1. An array of category names (from sales-report-dialog with ProductCategory master data)
    // 2. An object with controlName keys (legacy format)
    const productCategories: string[] = [];
    if (reportData.interestedProducts) {
      if (Array.isArray(reportData.interestedProducts)) {
        // New format: array of category names
        productCategories.push(...reportData.interestedProducts);
      } else if (typeof reportData.interestedProducts === 'object') {
        // Legacy format: object with controlName keys (for backward compatibility)
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
    }

    // For successful sales, store saleValue in description field (backend expects numeric value here)
    // If saleValue exists and status is success, use it; otherwise use additionalInfo
    let descriptionValue = reportData.additionalInfo || '';
    if (reportData.status?.toLowerCase() === 'success' && reportData.saleValue && reportData.saleValue > 0) {
      // Store saleValue as the primary value in description for successful sales
      descriptionValue = reportData.saleValue.toString();
      // Append additionalInfo if it exists
      if (reportData.additionalInfo && reportData.additionalInfo.trim()) {
        descriptionValue += ` | ${reportData.additionalInfo}`;
      }
    }

    const report: UpdateJobStatusReportDto = {
      customerName: reportData.customerName || taskToMove.customerName || '',
      customerContact: reportData.contactInfo || '',
      salesStatus: reportData.status?.toLowerCase() || 'success',
      reasonIds,
      reasons,
      productCategory: productCategories.join(', '),
      description: descriptionValue
    };

    // Determine status based on sales status
    const finalStatus = reportData.status?.toLowerCase() === 'success' ? JobStatus.ClosedWon : JobStatus.ClosedLost;
    
    this.isLoading.set(true);
    this.taskService.updateJobStatus(taskToMove.id, {
      id: taskToMove.id,
      status: finalStatus,
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
    // For walk-in flow, closing dialog should not leave a dangling Pending job
    if (this.startDialogContext() === 'walkInJob') {
      const task = this.selectedTask();
      this.showStartDialog.set(false);
      if (task?.id) {
        this.cancelJob(task.id, 'ยกเลิกเริ่มงาน');
      }
      this.selectedTask.set(null);
      this.startDialogContext.set('existingTask');
      return;
    }

    this.showStartDialog.set(false);
    this.selectedTask.set(null);
  }

  private cancelJob(jobId: string, reason: string): void {
    if (!jobId || jobId === '00000000-0000-0000-0000-000000000000') return;

    this.isLoading.set(true);
    this.taskService.updateJobStatus(jobId, {
      id: jobId,
      status: JobStatus.Cancelled,
      rejectReason: reason
    }).pipe(
      catchError(error => {
        console.error('Error cancelling job:', error);
        this.toastService.error('เกิดข้อผิดพลาดในการยกเลิกงาน');
        return of(null);
      }),
      finalize(() => {
        this.isLoading.set(false);
        setTimeout(() => this.loadTasks(), 200);
      })
    ).subscribe(response => {
      if (response) {
        this.toastService.success('ยกเลิกงานเรียบร้อย');
      }
    });
  }

  closeSalesReportDialog() {
    this.showSalesReportDialog.set(false);
    this.selectedTask.set(null);
  }
}

