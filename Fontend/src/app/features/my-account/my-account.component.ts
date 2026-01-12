import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AccountService } from '../../services/account.service';
import { EmployeeService } from '../../services/employee.service';
import { QueueService } from '../../services/queue.service';
import { TaskService } from '../../services/task.service';
import { ToastService } from '../../services/toast.service';
import { SummaryCardComponent } from '../../shared/components/summary-card/summary-card.component';
import { EmployeeDto } from '../../models/employee.model';
import { WorkStatsResponse, TimePeriod } from '../../models/account.model';
import { MyQueueInfoResponse } from '../../models/queue.model';
import { JobDto, JobPriority, JobStatus } from '../../models/task.model';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { AvailabilityStatusKey, getAvailabilityStatusBadgeClass, getAvailabilityStatusLabel, normalizeAvailabilityStatus } from '../../shared/utils/availability-status.util';

@Component({
  selector: 'app-my-account',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SummaryCardComponent],
  templateUrl: './my-account.component.html',
  styleUrls: ['./my-account.component.scss']
})
export class MyAccountComponent implements OnInit, OnDestroy {
  // Services
  private accountService = inject(AccountService);
  private employeeService = inject(EmployeeService);
  private queueService = inject(QueueService);
  private taskService = inject(TaskService);
  private toastService = inject(ToastService);
  private fb = inject(FormBuilder);

  // Signals for state management
  employee = signal<EmployeeDto | null>(null);
  workStats = signal<WorkStatsResponse | null>(null);
  queueInfo = signal<MyQueueInfoResponse | null>(null);
  myJobs = signal<JobDto[]>([]);
  selectedPeriod = signal<TimePeriod>('today');
  customStartDate = signal<string>('');
  customEndDate = signal<string>('');
  isLoadingStats = signal(false);
  isLoadingPassword = signal(false);
  isLoadingEmployee = signal(false);
  isLoadingQueue = signal(false);
  isLoadingJobs = signal(false);
  showPasswordSection = signal(false);
  showCustomDatePicker = signal(false);

  // Forms
  passwordForm!: FormGroup;

  // Computed values
  availabilityStatus = computed(() => {
    const info = this.queueInfo();
    if (!info || !info.isInQueue) return 'leave' as AvailabilityStatusKey;
    return normalizeAvailabilityStatus(info.availabilityStatus);
  });

  statusDisplayName = computed(() => {
    return getAvailabilityStatusLabel(this.availabilityStatus());
  });

  statusColor = computed(() => {
    return getAvailabilityStatusBadgeClass(this.availabilityStatus());
  });

  recentJobs = computed(() => {
    const jobs = this.myJobs() ?? [];
    return [...jobs].sort((a, b) => {
      const aTime = new Date(a.createdDate).getTime();
      const bTime = new Date(b.createdDate).getTime();
      return bTime - aTime;
    }).slice(0, 6);
  });

  ngOnInit(): void {
    this.initPasswordForm();
    this.loadEmployeeInfo();
    this.loadQueueInfo();
    this.loadWorkStats();
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  private initPasswordForm(): void {
    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  private passwordMatchValidator(form: FormGroup): { [key: string]: boolean } | null {
    const newPassword = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    
    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      return { passwordMismatch: true };
    }
    return null;
  }

  loadEmployeeInfo(): void {
    this.isLoadingEmployee.set(true);
    this.employeeService.getMyEmployeeInfo().pipe(
      catchError(error => {
        console.error('Error loading employee info:', error);
        this.toastService.error('เกิดข้อผิดพลาดในการโหลดข้อมูลพนักงาน');
        return of(null);
      }),
      finalize(() => this.isLoadingEmployee.set(false))
    ).subscribe(employee => {
      if (employee) {
        this.employee.set(employee);
      }
    });
  }

  loadQueueInfo(): void {
    this.isLoadingQueue.set(true);
    this.queueService.getMyQueueInfo().pipe(
      catchError(error => {
        console.error('Error loading queue info:', error);
        return of(null);
      }),
      finalize(() => this.isLoadingQueue.set(false))
    ).subscribe(queueInfo => {
      if (queueInfo) {
        this.queueInfo.set(queueInfo);
      }
    });
  }

  loadWorkStats(): void {
    const period = this.selectedPeriod();
    let startDate: string | undefined;
    let endDate: string | undefined;

    // Calculate date range based on selected period
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (period) {
      case 'today':
        startDate = today.toISOString();
        endDate = new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString();
        break;
      case 'yesterday':
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        startDate = yesterday.toISOString();
        endDate = new Date(yesterday.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString();
        break;
      case 'last7days':
        const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        startDate = sevenDaysAgo.toISOString();
        endDate = new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString();
        break;
      case 'last15days':
        const fifteenDaysAgo = new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000);
        startDate = fifteenDaysAgo.toISOString();
        endDate = new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString();
        break;
      case 'thisMonth':
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        startDate = firstDayOfMonth.toISOString();
        endDate = new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString();
        break;
      case 'custom':
        if (this.customStartDate() && this.customEndDate()) {
          startDate = new Date(this.customStartDate()).toISOString();
          endDate = new Date(this.customEndDate() + 'T23:59:59').toISOString();
        } else {
          this.toastService.error('กรุณาเลือกช่วงวันที่');
          return;
        }
        break;
    }

    this.isLoadingStats.set(true);
    this.accountService.getMyWorkStats(startDate, endDate).pipe(
      catchError(error => {
        console.error('Error loading work stats:', error);
        this.toastService.error('เกิดข้อผิดพลาดในการโหลดสถิติ');
        return of(null);
      }),
      finalize(() => this.isLoadingStats.set(false))
    ).subscribe(stats => {
      if (stats) {
        this.workStats.set(stats);
      }
    });
  }

  loadMyTasks(): void {
    this.isLoadingJobs.set(true);
    this.taskService.getMyTasks().pipe(
      catchError(error => {
        console.error('Error loading my tasks:', error);
        this.toastService.error('เกิดข้อผิดพลาดในการโหลดงานที่ได้รับมอบหมาย');
        return of({ jobs: [] as JobDto[] });
      }),
      finalize(() => this.isLoadingJobs.set(false))
    ).subscribe(response => {
      this.myJobs.set(response?.jobs ?? []);
    });
  }

  selectPeriod(period: TimePeriod): void {
    this.selectedPeriod.set(period);
    if (period === 'custom') {
      this.showCustomDatePicker.set(true);
    } else {
      this.showCustomDatePicker.set(false);
      this.loadWorkStats();
    }
  }

  applyCustomDateRange(): void {
    if (this.customStartDate() && this.customEndDate()) {
      this.loadWorkStats();
    } else {
      this.toastService.error('กรุณาเลือกวันที่เริ่มต้นและวันที่สิ้นสุด');
    }
  }

  updateStatus(status: AvailabilityStatusKey): void {
    this.queueService.updateMyQueueStatus(status).pipe(
      catchError(error => {
        console.error('Error updating status:', error);
        this.toastService.error('เกิดข้อผิดพลาดในการอัพเดทสถานะ');
        return of(null);
      })
    ).subscribe(response => {
      if (response) {
        this.toastService.success('อัพเดทสถานะสำเร็จ');
        this.loadQueueInfo();
      }
    });
  }

  getJobStatusLabel(status: JobStatus | string): string {
    const normalized = this.normalizeEnumLike(status);
    switch (normalized) {
      case 'pending':
        return 'รอดำเนินการ';
      case 'assigned':
        return 'มอบหมายแล้ว';
      case 'inprogress':
        return 'กำลังทำ';
      case 'closedwon':
        return 'ปิดงาน (สำเร็จ)';
      case 'closedlost':
        return 'ปิดงาน (ไม่สำเร็จ)';
      case 'cancelled':
        return 'ยกเลิก';
      default:
        return 'ไม่ทราบสถานะ';
    }
  }

  getJobStatusClass(status: JobStatus | string): string {
    const normalized = this.normalizeEnumLike(status);
    switch (normalized) {
      case 'pending':
      case 'assigned':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'inprogress':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'closedwon':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'closedlost':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'cancelled':
        return 'bg-gray-100  border-gray-200';
      default:
        return 'bg-gray-100  border-gray-200';
    }
  }

  getJobPriorityLabel(priority: JobPriority | string): string {
    const normalized = this.normalizeEnumLike(priority);
    switch (normalized) {
      case 'urgent':
        return 'ด่วน';
      case 'high':
        return 'สูง';
      case 'normal':
        return 'ทั่วไป';
      case 'low':
        return 'ต่ำ';
      default:
        return 'ทั่วไป';
    }
  }

  getJobPriorityClass(priority: JobPriority | string): string {
    const normalized = this.normalizeEnumLike(priority);
    switch (normalized) {
      case 'urgent':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'normal':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low':
        return 'bg-gray-100  border-gray-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  }

  private normalizeEnumLike(value: unknown): string {
    if (value === null || value === undefined) return '';
    if (typeof value === 'number') {
      // Map numeric enums (frontend) if backend returns numbers
      // JobStatus: 1..6, JobPriority: 1..4
      switch (value) {
        case 1: return 'pending';
        case 2: return 'assigned';
        case 3: return 'inprogress';
        case 4: return 'closedwon';
        case 5: return 'closedlost';
        case 6: return 'cancelled';
        default: return String(value);
      }
    }
    return String(value).toLowerCase().replace(/[^a-z]/g, '');
  }

  togglePasswordSection(): void {
    this.showPasswordSection.set(!this.showPasswordSection());
    if (!this.showPasswordSection()) {
      this.passwordForm.reset();
    }
  }

  onChangePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const formValue = this.passwordForm.value;
    this.isLoadingPassword.set(true);

    this.accountService.changePassword({
      currentPassword: formValue.currentPassword,
      newPassword: formValue.newPassword,
      confirmPassword: formValue.confirmPassword
    }).pipe(
      catchError(error => {
        console.error('Error changing password:', error);
        const errorMessage = error.error?.message || 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน';
        this.toastService.error(errorMessage);
        return of(null);
      }),
      finalize(() => this.isLoadingPassword.set(false))
    ).subscribe(response => {
      if (response && response.success) {
        this.toastService.success('เปลี่ยนรหัสผ่านสำเร็จ');
        this.passwordForm.reset();
        this.showPasswordSection.set(false);
      } else if (response && !response.success) {
        this.toastService.error(response.message);
      }
    });
  }

  getPasswordErrorMessage(controlName: string): string {
    const control = this.passwordForm.get(controlName);
    if (!control || !control.touched) return '';

    if (control.hasError('required')) {
      return 'กรุณากรอกข้อมูล';
    }
    if (controlName === 'newPassword' && control.hasError('minlength')) {
      return 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร';
    }
    if (controlName === 'confirmPassword' && this.passwordForm.hasError('passwordMismatch')) {
      return 'รหัสผ่านไม่ตรงกัน';
    }
    return '';
  }

  getAvatarUrl(): string {
    const emp = this.employee();
    if (emp?.avatar) {
      return emp.avatar;
    }
    if (emp?.name) {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}&background=6366f1&color=fff&size=128`;
    }
    return 'https://ui-avatars.com/api/?name=User&background=6366f1&color=fff&size=128';
  }
}

