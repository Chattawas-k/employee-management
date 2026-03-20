import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { AccountService } from '../../services/account.service';
import { AuthService } from '../../services/auth.service';
import { EmployeeService } from '../../services/employee.service';
import { QueueService } from '../../services/queue.service';
import { TaskService } from '../../services/task.service';
import { ToastService } from '../../services/toast.service';
import { SummaryCardComponent } from '../../shared/components/summary-card/summary-card.component';
import { CalloutCardComponent } from '../../shared/components/callout-card/callout-card.component';
import { EmployeeDto } from '../../models/employee.model';
import { WorkStatsResponse, TimePeriod, ChangePasswordRequest } from '../../models/account.model';
import { UpdateMyQueueStatusResponse } from '../../models/queue.model';
import { JobDto, JobPriority, JobStatus } from '../../models/task.model';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { AvailabilityStatusKey, getAvailabilityStatusBadgeClass, getAvailabilityStatusLabel } from '../../shared/utils/availability-status.util';
import { StatusUpdateDialogComponent } from '../../shared/components/status-update-dialog/status-update-dialog.component';
import { PasswordChangeDialogComponent } from '../../shared/components/password-change-dialog/password-change-dialog.component';
import { LogoutConfirmDialogComponent } from '../../shared/components/logout-confirm-dialog/logout-confirm-dialog.component';
import { DateRangePickerDialogComponent } from '../../shared/components/date-range-picker-dialog/date-range-picker-dialog.component';
import { InfoDialogComponent } from '../../shared/components/info-dialog/info-dialog.component';
import { MyStatusStore } from '../../services/my-status.store';
import { ReceiveCustomerService } from '../../services/receive-customer.service';

@Component({
  selector: 'app-my-account',
  standalone: true,
  imports: [CommonModule, RouterModule, SummaryCardComponent, CalloutCardComponent, StatusUpdateDialogComponent, PasswordChangeDialogComponent, LogoutConfirmDialogComponent, DateRangePickerDialogComponent, InfoDialogComponent],
  templateUrl: './my-account.component.html',
  styleUrls: ['./my-account.component.scss']
})
export class MyAccountComponent implements OnInit, OnDestroy {
  // Services
  private accountService = inject(AccountService);
  private authService = inject(AuthService);
  private employeeService = inject(EmployeeService);
  private queueService = inject(QueueService);
  private taskService = inject(TaskService);
  private toastService = inject(ToastService);
  private myStatusStore = inject(MyStatusStore);
  private router = inject(Router);
  private receiveCustomerService = inject(ReceiveCustomerService);

  // Signals for state management
  employee = signal<EmployeeDto | null>(null);
  workStats = signal<WorkStatsResponse | null>(null);
  queueInfo = this.myStatusStore.myQueueInfo;
  myJobs = signal<JobDto[]>([]);
  selectedPeriod = signal<TimePeriod>('today');
  customStartDate = signal<string>('');
  customEndDate = signal<string>('');
  isLoadingStats = signal(false);
  isSubmittingPassword = signal(false);
  isSubmittingStatus = signal(false);
  isLoadingEmployee = signal(false);
  isLoadingQueue = signal(false);
  isLoadingJobs = signal(false);
  showCustomDatePicker = signal(false);

  // Dialog state
  showStatusDialog = signal(false);
  showPasswordDialog = signal(false);
  showLogoutDialog = signal(false);
  isSubmittingLogout = signal(false);
  showDateRangeDialog = signal(false);
  showAvatarDialog = signal(false);
  isSubmittingAvatar = signal(false);
  avatarPreviewUrl = signal<string>('');
  avatarFile = signal<File | null>(null);
  showConversionRateInfoDialog = signal(false);

  // Date range display state (controls the blue label)
  displayDateRange = signal<{ start: Date; end: Date } | null>(null);

  displayDateRangeLabel = computed(() => {
    const range = this.displayDateRange();
    if (!range) return '';
    // Thai language + Gregorian year (ค.ศ.) + latin digits
    const fmt = new Intl.DateTimeFormat('th-TH-u-ca-gregory-nu-latn', { day: 'numeric', month: 'long', year: 'numeric' });
    const startKey = this.toYmd(range.start);
    const endKey = this.toYmd(range.end);
    if (startKey === endKey) {
      return `วันที่ ${fmt.format(range.start)}`;
    }
    return `วันที่ ${fmt.format(range.start)} - ${fmt.format(range.end)}`;
  });

  // Computed values
  availabilityStatus = this.myStatusStore.availabilityStatus;
  isMyTurn = this.myStatusStore.isMyTurn;

  // Only allow self status change if user is Basic-only (no Admin/Manager/SuperAdmin)
  canChangeOwnStatus = computed(() => {
    const user = this.authService.getCurrentUser();
    if (!user || !user.roles) return false;
    const roles = Array.isArray(user.roles) ? user.roles : [user.roles];
    const normalized: string[] = roles.map((role: unknown) => String(role ?? '').trim().toLowerCase());

    const hasBasic = normalized.includes('basic');
    const hasForbidden = normalized.some((role: string) => role === 'admin' || role === 'superadmin' || role === 'manager');
    return hasBasic && !hasForbidden;
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
    // Default custom dates to today (YYYY-MM-DD)
    const todayYmd = this.toYmd(new Date());
    if (!this.customStartDate()) this.customStartDate.set(todayYmd);
    if (!this.customEndDate()) this.customEndDate.set(todayYmd);

    // Initialize label for default period
    this.setDisplayDateRangeForPeriod(this.selectedPeriod());

    this.loadEmployeeInfo();
    this.myStatusStore.init();
    this.loadWorkStats();
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  goToCustomerQueue(): void {
    this.receiveCustomerService.open();
  }

  openStatusDialog(): void {
    this.showStatusDialog.set(true);
  }

  openPasswordDialog(): void {
    this.showPasswordDialog.set(true);
  }

  closePasswordDialog(force: boolean = false): void {
    if (!force && this.isSubmittingPassword()) return;
    this.showPasswordDialog.set(false);
  }

  closeStatusDialog(force: boolean = false): void {
    if (!force && this.isSubmittingStatus()) return;
    this.showStatusDialog.set(false);
  }

  openLogoutDialog(): void {
    this.showLogoutDialog.set(true);
  }

  closeLogoutDialog(): void {
    if (this.isSubmittingLogout()) return;
    this.showLogoutDialog.set(false);
  }

  openAvatarDialog(): void {
    this.avatarFile.set(null);
    this.avatarPreviewUrl.set('');
    this.showAvatarDialog.set(true);
  }

  closeAvatarDialog(force: boolean = false): void {
    if (!force && this.isSubmittingAvatar()) return;
    this.showAvatarDialog.set(false);
  }

  onAvatarFileSelected(file: File | null): void {
    if (!file) {
      this.avatarFile.set(null);
      this.avatarPreviewUrl.set('');
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.toastService.error('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
      return;
    }

    const maxBytes = 2 * 1024 * 1024; // 2MB (backend limit)
    if (file.size > maxBytes) {
      this.toastService.error('ไฟล์รูปใหญ่เกินไป (สูงสุด 2MB)');
      return;
    }

    this.avatarFile.set(file);

    const reader = new FileReader();
    reader.onload = () => {
      this.avatarPreviewUrl.set(typeof reader.result === 'string' ? reader.result : '');
    };
    reader.readAsDataURL(file);
  }

  confirmAvatarChange(): void {
    const emp = this.employee();
    if (!emp) return;

    const file = this.avatarFile();
    if (!file) {
      this.toastService.error('กรุณาเลือกรูปที่ต้องการอัปโหลด');
      return;
    }

    this.isSubmittingAvatar.set(true);
    this.employeeService.uploadMyAvatar(file).pipe(
      catchError(error => {
        console.error('Error updating avatar:', error);
        this.toastService.error('เกิดข้อผิดพลาดในการอัปเดตรูปโปรไฟล์');
        return of(null);
      }),
      finalize(() => this.isSubmittingAvatar.set(false))
    ).subscribe(updated => {
      if (!updated) return;
      // Ensure UI updates immediately
      this.employee.set(updated.employee);
      this.toastService.success('อัปเดตรูปโปรไฟล์สำเร็จ');
      this.closeAvatarDialog(true);
    });
  }

  deleteAvatar(): void {
    const emp = this.employee();
    if (!emp) return;

    this.isSubmittingAvatar.set(true);
    this.employeeService.deleteMyAvatar().pipe(
      catchError(error => {
        console.error('Error deleting avatar:', error);
        this.toastService.error('เกิดข้อผิดพลาดในการลบรูปโปรไฟล์');
        return of(null);
      }),
      finalize(() => this.isSubmittingAvatar.set(false))
    ).subscribe(updated => {
      if (!updated) return;
      this.employee.set(updated.employee);
      this.toastService.success('ลบรูปโปรไฟล์สำเร็จ');
      this.closeAvatarDialog(true);
    });
  }

  confirmLogout(): void {
    // Logout is synchronous (localStorage clear + redirect), but we keep UX consistent with dialogs.
    this.isSubmittingLogout.set(true);
    this.authService.logout();
    this.isSubmittingLogout.set(false);
    this.closeLogoutDialog();
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
    // Centralized: ensure status/cards are consistent across pages
    this.myStatusStore.requestRefresh();
  }

  loadWorkStats(): void {
    const period = this.selectedPeriod();
    const query = this.getDateRangeQuery(period);
    if (!query) {
      this.toastService.error('กรุณาเลือกช่วงวันที่');
      return;
    }

    this.isLoadingStats.set(true);
    this.accountService.getMyWorkStats(query.startIso, query.endIso).pipe(
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
      // Ensure defaults exist for custom (default to today)
      const todayYmd = this.toYmd(new Date());
      if (!this.customStartDate()) this.customStartDate.set(todayYmd);
      if (!this.customEndDate()) this.customEndDate.set(todayYmd);
      // Sync display label and reload stats to match the current custom range
      this.setDisplayDateRangeForCustomInputs();
      this.loadWorkStats();
    } else {
      this.showCustomDatePicker.set(false);
      this.setDisplayDateRangeForPeriod(period);
      this.loadWorkStats();
    }
  }

  applyCustomDateRange(): void {
    const start = this.customStartDate();
    const end = this.customEndDate();
    
    if (!start || !end) {
      this.toastService.error('กรุณาเลือกวันที่เริ่มต้นและวันที่สิ้นสุด');
      return;
    }
    
    // Validate: end date must be >= start date
    if (end < start) {
      this.toastService.error('วันที่สิ้นสุดต้องไม่น้อยกว่าวันที่เริ่มต้น');
      return;
    }
    
    this.setDisplayDateRangeForCustomInputs();
    this.loadWorkStats();
  }

  openDateRangeDialog(): void {
    this.showDateRangeDialog.set(true);
  }

  closeDateRangeDialog(): void {
    this.showDateRangeDialog.set(false);
  }

  applyDateRangeFromDialog(range: { startYmd: string; endYmd: string }): void {
    this.customStartDate.set(range.startYmd);
    this.customEndDate.set(range.endYmd);
    this.setDisplayDateRangeForCustomInputs();
    this.closeDateRangeDialog();
    this.loadWorkStats();
  }

  clearDateRange(): void {
    const todayYmd = this.toYmd(new Date());
    this.customStartDate.set(todayYmd);
    this.customEndDate.set(todayYmd);
    // Re-sync label and reload stats for the reset (today) range
    this.setDisplayDateRangeForCustomInputs();
    this.loadWorkStats();
  }

  onCustomStartDateChange(value: string): void {
    this.customStartDate.set(value);
    // Keep end date >= start date
    const end = this.customEndDate();
    if (end && value && end < value) {
      this.customEndDate.set(value);
    }
  }

  onCustomEndDateChange(value: string): void {
    const start = this.customStartDate();
    // Prevent end < start (if user manages to pick it via platform quirks)
    if (start && value && value < start) {
      this.customEndDate.set(start);
      return;
    }
    this.customEndDate.set(value);
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
        this.myStatusStore.requestRefresh();
      }
    });
  }

  confirmStatusChange(status: AvailabilityStatusKey): void {
    if (status === this.availabilityStatus()) {
      this.closeStatusDialog(true);
      return;
    }

    this.isSubmittingStatus.set(true);
    this.queueService.updateMyQueueStatus(status).pipe(
      catchError(error => {
        console.error('Error updating status:', error);
        this.toastService.error('เกิดข้อผิดพลาดในการอัพเดทสถานะ');
        return of(null);
      })
    ).subscribe((response: UpdateMyQueueStatusResponse | null) => {
      this.isSubmittingStatus.set(false);
      if (response) {
        this.toastService.success('อัพเดทสถานะสำเร็จ');
        this.myStatusStore.requestRefresh();
        this.closeStatusDialog(true);
      }
    });
  }

  confirmPasswordChange(payload: ChangePasswordRequest): void {
    this.isSubmittingPassword.set(true);
    this.accountService.changePassword(payload).pipe(
      catchError(error => {
        console.error('Error changing password:', error);
        const rawMessage = this.extractHttpErrorMessage(error, 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน');
        this.toastService.error(this.translateChangePasswordMessage(rawMessage));
        return of(null);
      })
    ).subscribe(response => {
      this.isSubmittingPassword.set(false);
      if (response && response.success) {
        this.toastService.success('เปลี่ยนรหัสผ่านสำเร็จ');
        this.closePasswordDialog(true);
      } else if (response && !response.success) {
        this.toastService.error(this.translateChangePasswordMessage(response.message));
      }
    });
  }

  private translateChangePasswordMessage(message: string): string {
    const text = String(message ?? '').trim();
    if (!text) return 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน';

    // If it's already Thai, keep it.
    if (/[ก-๙]/.test(text)) return text;

    const normalized = text.toLowerCase();

    // Handle Identity aggregated errors: "Failed to change password: ... , ..."
    if (normalized.includes('failed to change password:')) {
      const after = text.split(/failed to change password:/i)[1] ?? '';
      const parts = after
        .split(',')
        .map(p => p.trim())
        .filter(Boolean);

      const translatedParts = parts
        .map(p => this.translateChangePasswordMessage(p))
        .filter(Boolean);

      if (translatedParts.length > 0) return translatedParts.join(' / ');
      return 'เปลี่ยนรหัสผ่านไม่สำเร็จ';
    }

    if (normalized.includes('current password is incorrect')) return 'รหัสผ่านปัจจุบันไม่ถูกต้อง';
    if (normalized.includes('current password is required')) return 'กรุณากรอกรหัสผ่านปัจจุบัน';
    if (normalized.includes('new password is required')) return 'กรุณากรอกรหัสผ่านใหม่';
    if (normalized.includes('confirm password is required')) return 'กรุณายืนยันรหัสผ่านใหม่';
    if (normalized.includes('new password must be at least 6')) return 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร';
    if (normalized.includes('confirm password must match')) return 'ยืนยันรหัสผ่านต้องตรงกับรหัสผ่านใหม่';
    if (normalized.includes('new password must be different')) return 'รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านปัจจุบัน';
    if (normalized.includes('user not found')) return 'ไม่พบผู้ใช้';
    if (normalized.includes('failed to change password')) return 'เปลี่ยนรหัสผ่านไม่สำเร็จ';

    // ASP.NET Identity password policy messages
    if (normalized.includes("passwords must have at least one lowercase")) return "รหัสผ่านต้องมีตัวอักษรภาษาอังกฤษพิมพ์เล็กอย่างน้อย 1 ตัว (a-z)";
    if (normalized.includes("passwords must have at least one uppercase")) return "รหัสผ่านต้องมีตัวอักษรภาษาอังกฤษพิมพ์ใหญ่อย่างน้อย 1 ตัว (A-Z)";
    if (normalized.includes("passwords must have at least one digit")) return "รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัว (0-9)";
    if (normalized.includes("passwords must have at least one non alphanumeric")) return "รหัสผ่านต้องมีอักขระพิเศษอย่างน้อย 1 ตัว (เช่น !@#)";
    if (normalized.includes("passwords must be at least")) return "รหัสผ่านใหม่สั้นเกินไป";

    return 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน';
  }

  private extractHttpErrorMessage(error: unknown, fallback: string): string {
    // HttpClient errors usually come through HttpErrorResponse
    if (error instanceof HttpErrorResponse) {
      const payload = error.error;

      // Case: backend returns plain text
      if (typeof payload === 'string' && payload.trim().length > 0) {
        return payload;
      }

      // Case: backend returns { message }
      const message = (payload as any)?.message;
      if (typeof message === 'string' && message.trim().length > 0) {
        return message;
      }

      // Case: backend returns RFC7807 ProblemDetails { title, detail, errors }
      const title = (payload as any)?.title;
      if (typeof title === 'string' && title.trim().length > 0) {
        return title;
      }

      const detail = (payload as any)?.detail;
      if (typeof detail === 'string' && detail.trim().length > 0) {
        return detail;
      }

      const errors = (payload as any)?.errors;
      if (errors && typeof errors === 'object') {
        const firstMessages: string[] = [];
        for (const key of Object.keys(errors)) {
          const value = (errors as any)[key];
          if (Array.isArray(value) && typeof value[0] === 'string' && value[0].trim().length > 0) {
            firstMessages.push(value[0]);
          }
        }
        if (firstMessages.length > 0) {
          return firstMessages.join(' / ');
        }
      }

      // Case: HttpErrorResponse.message (client-side)
      if (typeof error.message === 'string' && error.message.trim().length > 0) {
        return error.message;
      }
    }

    // Unknown error
    if (typeof (error as any)?.message === 'string' && (error as any).message.trim().length > 0) {
      return (error as any).message;
    }

    return fallback;
  }

  private setDisplayDateRangeForPeriod(period: TimePeriod): void {
    const query = this.getDateRangeQuery(period);
    if (!query) return;
    this.displayDateRange.set({ start: query.startDisplay, end: query.endDisplay });
  }

  private setDisplayDateRangeForCustomInputs(): void {
    const start = this.customStartDate();
    const end = this.customEndDate();
    if (!start || !end) return;
    this.displayDateRange.set({
      start: new Date(`${start}T00:00:00`),
      end: new Date(`${end}T00:00:00`)
    });
  }

  private getDateRangeQuery(period: TimePeriod): { startIso: string; endIso: string; startDisplay: Date; endDisplay: Date } | null {
    // Calculate date range based on selected period (kept consistent with previous logic)
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (period) {
      case 'today': {
        const start = today;
        const endDisplay = today;
        const endIso = new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString();
        return { startIso: start.toISOString(), endIso, startDisplay: start, endDisplay };
      }
      case 'yesterday': {
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        const endIso = new Date(yesterday.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString();
        return { startIso: yesterday.toISOString(), endIso, startDisplay: yesterday, endDisplay: yesterday };
      }
      case 'last7days': {
        const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const endIso = new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString();
        return { startIso: sevenDaysAgo.toISOString(), endIso, startDisplay: sevenDaysAgo, endDisplay: today };
      }
      case 'last15days': {
        const fifteenDaysAgo = new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000);
        const endIso = new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString();
        return { startIso: fifteenDaysAgo.toISOString(), endIso, startDisplay: fifteenDaysAgo, endDisplay: today };
      }
      case 'thisMonth': {
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endIso = new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString();
        return { startIso: firstDayOfMonth.toISOString(), endIso, startDisplay: firstDayOfMonth, endDisplay: today };
      }
      case 'custom': {
        const startYmd = this.customStartDate();
        const endYmd = this.customEndDate();
        if (!startYmd || !endYmd) return null;
        const startDisplay = new Date(`${startYmd}T00:00:00`);
        const endDisplay = new Date(`${endYmd}T00:00:00`);
        const startIso = new Date(startYmd).toISOString();
        const endIso = new Date(`${endYmd}T23:59:59`).toISOString();
        return { startIso, endIso, startDisplay, endDisplay };
      }
      default:
        return null;
    }
  }

  private toYmd(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
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

  openConversionRateInfoDialog(): void {
    this.showConversionRateInfoDialog.set(true);
  }

  closeConversionRateInfoDialog(): void {
    this.showConversionRateInfoDialog.set(false);
  }

  getConversionRateExplanation(): string {
    const stats = this.workStats();
    if (!stats) return '';
    
    const total = stats.salesStats.total;
    const success = stats.salesStats.success;
    const pending = stats.salesStats.pending;
    const failed = stats.salesStats.failed;
    const conversionRate = stats.salesStats.conversionRate ?? 0;
    
    return `อัตราการแปลงคำนวณจาก:

สูตร: (จำนวนที่ขายสำเร็จ ÷ จำนวนรายงานทั้งหมด) × 100

ข้อมูลปัจจุบัน:
• จำนวนรายงานทั้งหมด: ${total} รายการ
• ขายสำเร็จ: ${success} รายการ
• รอดำเนินการ: ${pending} รายการ
• ไม่สำเร็จ: ${failed} รายการ

การคำนวณ:
(${success} ÷ ${total}) × 100 = ${conversionRate.toFixed(2)}%

หมายเหตุ: อัตราการแปลงคำนวณจากงานที่มีรายงานการขายเท่านั้น`;
  }

}

