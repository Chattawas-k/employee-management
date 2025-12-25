import { ChangeDetectionStrategy, Component, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskColumnComponent, Task } from '../../shared/components/task-column/task-column.component';
import { ConfirmationDialogComponent } from '../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { SalesReportDialogComponent } from '../../shared/components/sales-report-dialog/sales-report-dialog.component';
import { TaskDetailDialogComponent } from '../../shared/components/task-detail-dialog/task-detail-dialog.component';
import { OpenJobDialogComponent } from '../../shared/components/open-job-dialog/open-job-dialog.component';
import { RejectTaskDialogComponent } from '../../shared/components/reject-task-dialog/reject-task-dialog.component';
import { TaskService } from '../../services/task.service';
import { AuthService } from '../../services/auth.service';
import { JobDto, JobStatus, JobPriority, UpdateJobStatusRequest, UpdateJobStatusReportDto, JobFormData, SalesReportFormData, TaskSalesReportData, PartialJobFormData } from '../../models/task.model';
import { getEmployeeIdFromToken } from '../../utils/jwt.util';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { ToastService } from '../../services/toast.service';
import { LoggerService } from '../../services/logger.service';

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
export class MyTasksComponent implements OnInit {
  private taskService = inject(TaskService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private logger = inject(LoggerService);

  availabilityStatus = signal<AvailabilityStatus>('available');
  statusBannerInfo = signal<{ title: string; subtitle: string; borderColor: string; iconContainerBg: string; iconBorder: string; iconColor: string; } | null>(null);
  
  isMyTurn = signal(true);
  currentUser = signal('สมศักดิ์ รักงาน (Bob)');
  
  queuesRemaining = signal(1);
  myQueuePosition = signal(2);
  currentlyServing = signal({
    name: 'สมศักดิ์ รักงาน (Bob)',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop',
    queuePosition: 1
  });

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

  ngOnInit(): void {
    // Initialize status banner info based on availability status
    this.updateStatusBanner();
    this.loadTasks();
  }

  loadTasks(): void {
    this.isLoading.set(true);
    this.taskService.getMyTasks().pipe(
      catchError(error => {
        this.logger.error('Error loading tasks:', error);
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

  private mapTasksFromApi(jobs: JobDto[]): void {
    const todo: Task[] = [];
    const inProgress: Task[] = [];
    const completed: Task[] = [];

    jobs.forEach(job => {
      // Skip jobs with invalid IDs
      if (!job.id || job.id === '00000000-0000-0000-0000-000000000000') {
        this.logger.warn('Skipping job with invalid ID:', job);
        return;
      }

      const task = this.mapJobDtoToTask(job);
      
      // Handle both enum and string status from API
      const statusStr = typeof job.status === 'string' ? job.status.toLowerCase() : this.getStatusString(job.status as JobStatus);
      
      if (statusStr === 'pending') {
        todo.push(task);
      } else if (statusStr === 'inprogress' || statusStr === 'in-progress') {
        inProgress.push(task);
        // Update availability status if there are in-progress tasks
        if (this.availabilityStatus() === 'available') {
          this.availabilityStatus.set('busy');
          this.updateStatusBanner();
        }
      } else if (statusStr === 'done' || statusStr === 'rejected') {
        completed.push(task);
      }
    });

    this.todoTasks.set(todo);
    this.inProgressTasks.set(inProgress);
    this.completedTasks.set(completed);
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
    
    const createdAt = createdLog ? this.formatDate(new Date(createdLog.timestamp)) : this.formatDate(new Date(job.createdDate));
    const startedAt = startedLog ? this.formatDate(new Date(startedLog.timestamp)) : null;
    const completedAt = completedLog ? this.formatDate(new Date(completedLog.timestamp)) : null;

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
    let salesReportData: TaskSalesReportData | null = null;
    if (job.report) {
      // Convert reasons array to Record format expected by components
      const reasonsRecord: Record<string, boolean> = {};
      // Map common reason labels to control names
      const reasonControlMap: Record<string, string> = {
        'ขอไปตัดสินใจก่อน': 'wantsToDecide',
        'รอโปรโมชั่น': 'waitingForPromo',
        'เปรียบเทียบกับที่อื่น': 'comparing',
        'ปรึกษาครอบครัว/เพื่อน': 'consultingFamily',
        'ต้องการข้อมูลเพิ่มเติม': 'needsMoreInfo',
        'รอสินค้าเข้า': 'waitingForStock',
        'รออนุมัติทางการเงิน': 'financialApproval',
        'ยังไม่แน่ใจเรื่องสี/ขนาด': 'undecidedOnSpec',
        'รอฤกษ์/ช่วงเวลาที่เหมาะสม': 'seasonalTiming',
        'ต้องการดูสินค้าตัวอย่าง': 'wantsToSeeSample',
        'ราคาสูงไป': 'priceTooHigh',
        'สินค้าไม่ตรงความต้องการ': 'productMismatch',
        'ไม่พอใจบริการ': 'badService',
        'เจอที่อื่นถูกกว่า': 'foundCheaper',
        'ระยะเวลาจัดส่งนานไป': 'longDelivery',
        'สินค้าหมด/เลิกผลิต': 'outOfStock',
        'เห็นรีวิวไม่ดี': 'negativeReview',
        'ข้อเสนอของคู่แข่งดีกว่า': 'competitorOffer',
        'เปลี่ยนใจ/ไม่ต้องการแล้ว': 'changedMind',
        'งบประมาณไม่พอ': 'budgetCut'
      };
      job.report.reasons.forEach(reason => {
        const controlName = reasonControlMap[reason];
        if (controlName) {
          reasonsRecord[controlName] = true;
        }
      });

      // Convert product category string to Record format
      const interestedProductsRecord: Record<string, boolean> = {};
      const productControlMap: Record<string, string> = {
        'โซฟาและห้องนั่งเล่น': 'livingRoom',
        'ชุดห้องนอน': 'bedroom',
        'โต๊ะอาหาร': 'dining',
        'ชุดครัว': 'kitchen',
        'เฟอร์นิเจอร์สำนักงาน': 'office',
        'เฟอร์นิเจอร์นอกบ้าน': 'outdoor',
        'โคมไฟและของตกแต่ง': 'lighting',
        'ตู้และชั้นวางของ': 'storage',
        'เฟอร์นิเจอร์เด็ก': 'kids'
      };
      if (job.report.productCategory) {
        const categories = job.report.productCategory.split(', ').map(c => c.trim());
        categories.forEach(category => {
          const controlName = productControlMap[category];
          if (controlName) {
            interestedProductsRecord[controlName] = true;
          }
        });
      }

      salesReportData = {
        status: this.mapSalesStatus(job.report.salesStatus),
        customerName: job.report.customerName,
        contactInfo: job.report.customerContact,
        reasons: reasonsRecord,
        interestedProducts: interestedProductsRecord,
        productCategory: job.report.productCategory,
        description: job.report.description,
        additionalInfo: job.report.description
      };
    }

    return {
      id: job.id,
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
      salesReportData: salesReportData || undefined
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
      if (lowerPriority === 'urgent') return 'border-orange-300 bg-orange-100 text-orange-800';
      if (lowerPriority === 'high') return 'border-red-300 bg-red-100 text-red-800';
      if (lowerPriority === 'normal') return 'border-blue-300 bg-blue-100 text-blue-800';
      if (lowerPriority === 'low') return 'border-gray-300 bg-gray-100 text-gray-800';
      return 'border-blue-300 bg-blue-100 text-blue-800';
    }

    // Handle enum priority
    switch (priority) {
      case JobPriority.Urgent:
        return 'border-orange-300 bg-orange-100 text-orange-800';
      case JobPriority.High:
        return 'border-red-300 bg-red-100 text-red-800';
      case JobPriority.Normal:
        return 'border-blue-300 bg-blue-100 text-blue-800';
      case JobPriority.Low:
        return 'border-gray-300 bg-gray-100 text-gray-800';
      default:
        return 'border-blue-300 bg-blue-100 text-blue-800';
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
          borderColor: 'border-orange-400',
          iconContainerBg: 'bg-orange-100',
          iconBorder: 'border-orange-200',
          iconColor: 'text-orange-500',
        });
        break;
      case 'break':
        this.statusBannerInfo.set({
          title: 'คุณกำลังพัก',
          subtitle: 'คุณจะไม่ได้รับคิวใหม่ระหว่างพัก',
          borderColor: 'border-yellow-400',
          iconContainerBg: 'bg-yellow-100',
          iconBorder: 'border-yellow-200',
          iconColor: 'text-yellow-500',
        });
        break;
      case 'unavailable':
        this.statusBannerInfo.set({
          title: 'คุณตั้งสถานะเป็น "ไม่พร้อมรับงาน"',
          subtitle: 'คุณจะไม่ได้รับคิวใหม่จนกว่าจะเปลี่ยนสถานะกลับมาเป็น "พร้อมรับงาน"',
          borderColor: 'border-gray-400',
          iconContainerBg: 'bg-gray-100',
          iconBorder: 'border-gray-200',
          iconColor: 'text-gray-500',
        });
        break;
      default:
        this.statusBannerInfo.set(null);
    }
  }


  acceptCustomer() {
    this.showOpenJobDialog.set(true);
  }
  
  closeOpenJobDialog() {
    this.showOpenJobDialog.set(false);
  }
  
  confirmOpenJob(jobData: PartialJobFormData) {
    const token = this.authService.getToken();
    const employeeId = getEmployeeIdFromToken(token);
    
    if (!employeeId) {
      this.toastService.error('ไม่พบข้อมูลพนักงาน');
      return;
    }

    const priority = jobData.priority === 'Urgent' ? JobPriority.Urgent : JobPriority.Normal;
    
    this.isLoading.set(true);
    this.taskService.createJob({
      title: jobData.jobTitle || '',
      customer: jobData.customerName || '',
      description: jobData.details || '',
      assigneeId: employeeId,
      priority
    }    ).pipe(
      catchError(error => {
        this.logger.error('Error creating job:', error);
        this.toastService.error('เกิดข้อผิดพลาดในการสร้างงาน');
        return of(null);
      }),
      finalize(() => {
        this.isLoading.set(false);
        this.closeOpenJobDialog();
      })
    ).subscribe(response => {
      if (response) {
        this.toastService.success('สร้างงานสำเร็จ');
        this.loadTasks();
        this.isMyTurn.set(false);
        // Update availability status to busy
        this.availabilityStatus.set('busy');
        this.updateStatusBanner();
      }
    });
  }

  handleTaskAction(task: Task) {
    this.selectedTask.set(task);
    if (task.buttonText === 'เริ่มงาน') {
      this.showStartDialog.set(true);
    } else if (task.buttonText === 'ปิดงาน') {
      this.showSalesReportDialog.set(true);
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
        this.logger.error('Error starting task:', error);
        this.toastService.error('เกิดข้อผิดพลาดในการเริ่มงาน');
        return of(null);
      }),
      finalize(() => {
        this.isLoading.set(false);
        this.closeStartDialog();
      })
    ).subscribe(response => {
      if (response) {
        this.toastService.success('เริ่มงานสำเร็จ');
        this.loadTasks();
        // Update availability status to busy
        this.availabilityStatus.set('busy');
        this.updateStatusBanner();
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
        this.logger.error('Error rejecting task:', error);
        this.toastService.error('เกิดข้อผิดพลาดในการปฏิเสธงาน');
        return of(null);
      }),
      finalize(() => {
        this.isLoading.set(false);
        this.closeRejectDialog();
      })
    ).subscribe(response => {
      if (response) {
        this.toastService.success('ปฏิเสธงานสำเร็จ');
        this.loadTasks();
      }
    });
  }

  closeRejectDialog() {
    this.showRejectDialog.set(false);
    this.selectedTask.set(null);
  }

  confirmCompleteTask(reportData: SalesReportFormData) {
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
        if (reasonControls[key] === true) {
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
        if (productControls[key] === true && productMap[key]) {
          productCategories.push(productMap[key]);
        }
      });
    }

    const report: UpdateJobStatusReportDto = {
      customerName: reportData.customerName || taskToMove.customerName || '',
      customerContact: reportData.contactInfo || '',
      salesStatus: (reportData.status || 'success').toLowerCase(),
      reasons,
      productCategory: productCategories.join(', '),
      description: reportData.additionalInfo || ''
    };

    this.isLoading.set(true);
    this.taskService.updateJobStatus(taskToMove.id, {
      id: taskToMove.id,
      status: JobStatus.Done,
      report
    }    ).pipe(
      catchError(error => {
        this.logger.error('Error completing task:', error);
        this.toastService.error('เกิดข้อผิดพลาดในการปิดงาน');
        return of(null);
      }),
      finalize(() => {
        this.isLoading.set(false);
        this.closeSalesReportDialog();
      })
    ).subscribe(response => {
      if (response) {
        this.toastService.success('ปิดงานสำเร็จ');
        this.loadTasks();
        
        // Update availability status if no more in-progress tasks
        const updatedInProgressTasks = this.inProgressTasks();
        if (updatedInProgressTasks.length === 0 && this.availabilityStatus() === 'busy') {
          this.availabilityStatus.set('available');
          this.updateStatusBanner();
        }
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

