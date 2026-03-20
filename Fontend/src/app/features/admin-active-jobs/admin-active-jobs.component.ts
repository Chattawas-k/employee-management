import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminActiveJobsService } from '../../services/admin-active-jobs.service';
import { TaskService } from '../../services/task.service';
import { ToastService } from '../../services/toast.service';
import { StaffService } from '../../services/staff.service';
import { SignalRService } from '../../services/signalr.service';
import { SalesReportDialogComponent } from '../../shared/components/sales-report-dialog/sales-report-dialog.component';
import { ActiveJobDto, GetActiveJobsResponse, JobStatus, JobPriority, UpdateJobStatusReportDto } from '../../models/task.model';
import { StaffListItem } from '../../models/staff.model';
import { Task } from '../../shared/components/task-column/task-column.component';
import { catchError, finalize } from 'rxjs/operators';
import { of, Subscription } from 'rxjs';

@Component({
  selector: 'app-admin-active-jobs',
  standalone: true,
  imports: [CommonModule, FormsModule, SalesReportDialogComponent],
  templateUrl: './admin-active-jobs.component.html',
  styleUrls: ['./admin-active-jobs.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminActiveJobsComponent implements OnInit, OnDestroy {
  isLoading = signal(false);
  jobs = signal<ActiveJobDto[]>([]);
  totalCount = signal(0);
  searchTerm = signal('');
  assigneeId = signal('');
  staffOptions = signal<StaffListItem[]>([]);

  showCloseDialog = signal(false);
  selectedJob = signal<ActiveJobDto | null>(null);

  // Convert selected job to Task shape required by SalesReportDialogComponent
  selectedTask = computed<Task | null>(() => {
    const job = this.selectedJob();
    if (!job) return null;
    return {
      id: job.id,
      jobNumber: job.jobNumber,
      jobRunningCode: job.jobRunningCode ?? null,
      createdAt: job.createdDate,
      priority: this.getPriorityText(job.priority),
      priorityClass: this.getPriorityClass(job.priority),
      buttonText: 'ปิดงาน',
      buttonIcon: 'check',
      buttonClass: 'bg-green-600 hover:bg-green-700 text-white',
      startedAt: job.startedDate ?? null,
      completedAt: null,
      jobTitle: job.title,
      customerName: job.customer,
      details: job.description,
      status: 'in-progress'
    };
  });

  private signalRSub = new Subscription();

  constructor(
    private activeJobsService: AdminActiveJobsService,
    private taskService: TaskService,
    private toastService: ToastService,
    private staffService: StaffService,
    private signalRService: SignalRService
  ) {}

  async ngOnInit(): Promise<void> {
    this.loadJobs();
    this.loadStaff();

    try {
      await this.signalRService.startConnection();
      this.signalRSub.add(this.signalRService.jobStatusChanged$.subscribe(() => this.loadJobs()));
      this.signalRSub.add(this.signalRService.queueUpdated$.subscribe(() => this.loadJobs()));
    } catch (error) {
      console.error('Failed to start SignalR connection:', error);
    }
  }

  ngOnDestroy(): void {
    this.signalRSub.unsubscribe();
  }

  loadJobs(): void {
    this.isLoading.set(true);
    this.activeJobsService.getActiveJobs({
      assigneeId: this.assigneeId() || undefined,
      search: this.searchTerm() || undefined
    }).pipe(
      catchError(error => {
        console.error('Error loading active jobs:', error);
        this.toastService.error('เกิดข้อผิดพลาดในการโหลดข้อมูลงาน');
        return of<GetActiveJobsResponse>({ jobs: [], totalCount: 0 });
      }),
      finalize(() => this.isLoading.set(false))
    ).subscribe(response => {
      this.jobs.set(response.jobs);
      this.totalCount.set(response.totalCount);
    });
  }

  loadStaff(): void {
    this.staffService.getStaffList().pipe(
      catchError(() => of({ staff: [] as StaffListItem[] }))
    ).subscribe(res => this.staffOptions.set(res.staff || []));
  }

  onSearchChange(value: string): void {
    this.searchTerm.set(value);
    this.loadJobs();
  }

  onAssigneeChange(value: string): void {
    this.assigneeId.set(value);
    this.loadJobs();
  }

  openCloseDialog(job: ActiveJobDto): void {
    this.selectedJob.set(job);
    this.showCloseDialog.set(true);
  }

  closeDialog(): void {
    this.showCloseDialog.set(false);
    this.selectedJob.set(null);
  }

  confirmCloseJob(reportData: any): void {
    const job = this.selectedJob();
    if (!job) {
      this.toastService.error('ไม่พบข้อมูลงาน');
      this.closeDialog();
      return;
    }

    const reasonIds: string[] = Array.isArray(reportData.reasonIds) ? reportData.reasonIds : [];
    const reasons: string[] = Array.isArray(reportData.reasons) ? reportData.reasons : [];

    const productCategories: string[] = [];
    if (reportData.interestedProducts) {
      if (Array.isArray(reportData.interestedProducts)) {
        productCategories.push(...reportData.interestedProducts);
      }
    }

    let descriptionValue = reportData.additionalInfo || '';
    if (reportData.status?.toLowerCase() === 'success' && reportData.saleValue && reportData.saleValue > 0) {
      descriptionValue = reportData.saleValue.toString();
      if (reportData.additionalInfo && reportData.additionalInfo.trim()) {
        descriptionValue += ` | ${reportData.additionalInfo}`;
      }
    }

    const report: UpdateJobStatusReportDto = {
      customerName: reportData.customerName || job.customer || '',
      customerContact: reportData.contactInfo || '',
      salesStatus: reportData.status?.toLowerCase() || 'success',
      reasonIds,
      reasons,
      productCategory: productCategories.join(', '),
      description: descriptionValue
    };

    const finalStatus = reportData.status?.toLowerCase() === 'success' ? JobStatus.ClosedWon : JobStatus.ClosedLost;

    this.isLoading.set(true);
    this.taskService.updateJobStatus(job.id, {
      id: job.id,
      status: finalStatus,
      report,
      isAdminOverride: true
    }).pipe(
      catchError(error => {
        console.error('Error closing job on behalf:', error);
        this.toastService.error('เกิดข้อผิดพลาดในการปิดงาน');
        return of(null);
      }),
      finalize(() => {
        this.isLoading.set(false);
        this.closeDialog();
        setTimeout(() => this.loadJobs(), 200);
      })
    ).subscribe(response => {
      if (response) {
        this.toastService.success(`ปิดงาน ${job.jobNumber} สำเร็จ (แทน ${job.assigneeName || 'พนักงาน'})`);
      }
    });
  }

  getStatusLabel(status: JobStatus): string {
    switch (status) {
      case JobStatus.Assigned: return 'รอรับงาน';
      case JobStatus.InProgress: return 'กำลังดำเนินการ';
      default: return String(status);
    }
  }

  getStatusBadgeClass(status: JobStatus): string {
    switch (status) {
      case JobStatus.Assigned:
        return 'bg-blue-100 text-blue-700 border border-blue-200';
      case JobStatus.InProgress:
        return 'bg-orange-100 text-orange-700 border border-orange-200';
      default:
        return 'bg-gray-100 text-gray-700 border border-gray-200';
    }
  }

  getPriorityText(priority: JobPriority | string): string {
    if (typeof priority === 'string') {
      const lower = priority.toLowerCase();
      if (lower === 'urgent') return 'ด่วน';
      if (lower === 'high') return 'สูง';
      if (lower === 'normal') return 'ทั่วไป';
      if (lower === 'low') return 'ต่ำ';
      return 'ทั่วไป';
    }
    switch (priority) {
      case JobPriority.Urgent: return 'ด่วน';
      case JobPriority.High: return 'สูง';
      case JobPriority.Normal: return 'ทั่วไป';
      case JobPriority.Low: return 'ต่ำ';
      default: return 'ทั่วไป';
    }
  }

  getPriorityClass(priority: JobPriority | string): string {
    if (typeof priority === 'string') {
      const lower = priority.toLowerCase();
      if (lower === 'urgent') return 'border-orange-200 bg-orange-100 text-orange-700';
      if (lower === 'high') return 'border-red-200 bg-red-100 text-red-700';
      if (lower === 'normal') return 'border-blue-200 bg-blue-100 text-blue-700';
      if (lower === 'low') return 'border-gray-200 bg-gray-100 text-gray-700';
      return 'border-blue-200 bg-blue-100 text-blue-700';
    }
    switch (priority) {
      case JobPriority.Urgent: return 'border-orange-200 bg-orange-100 text-orange-700';
      case JobPriority.High: return 'border-red-200 bg-red-100 text-red-700';
      case JobPriority.Normal: return 'border-blue-200 bg-blue-100 text-blue-700';
      case JobPriority.Low: return 'border-gray-200 bg-gray-100 text-gray-700';
      default: return 'border-blue-200 bg-blue-100 text-blue-700';
    }
  }

  formatElapsedTime(dateStr: string | null | undefined): string {
    if (!dateStr) return '-';
    const start = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    if (diffMs < 0) return '-';
    const totalMinutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0) return `${hours} ชม. ${minutes} นาที`;
    return `${minutes} นาที`;
  }

  formatDateTime(dateStr: string | null | undefined): string {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat('th-TH', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch {
      return '-';
    }
  }

  getElapsedClass(dateStr: string | null | undefined): string {
    if (!dateStr) return 'text-slate-400';
    const start = new Date(dateStr);
    const diffMs = new Date().getTime() - start.getTime();
    const minutes = Math.floor(diffMs / 60000);
    if (minutes >= 60) return 'text-red-600 font-semibold';
    if (minutes >= 30) return 'text-orange-500';
    return 'text-slate-600';
  }
}
