import { Component, signal, computed, OnInit, OnDestroy, HostListener, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { LucideAngularModule } from 'lucide-angular';
import { IconComponent } from './shared/components/icon/icon.component';
import { ToastContainerComponent } from './shared/components/toast/toast-container.component';
import { StatusChangeDialogComponent } from './shared/components/status-change-dialog/status-change-dialog.component';
import { ReceiveCustomerConfirmDialogComponent } from './shared/components/receive-customer-confirm-dialog/receive-customer-confirm-dialog.component';
import { ConfirmDialogHostComponent } from './shared/components/confirm-dialog-host/confirm-dialog-host.component';
import { AuthService } from './services/auth.service';
import { QueueService } from './services/queue.service';
import { ToastService } from './services/toast.service';
import { EmployeeService } from './services/employee.service';
import { EmployeeDto } from './models/employee.model';
import { MyQueueInfoResponse } from './models/queue.model';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { AvailabilityStatusKey, getAvailabilityStatusDotClass, getAvailabilityStatusLabel } from './shared/utils/availability-status.util';
import { MyStatusStore } from './services/my-status.store';
import { ReceiveCustomerService } from './services/receive-customer.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    LucideAngularModule,
    IconComponent,
    ToastContainerComponent,
    StatusChangeDialogComponent,
    ReceiveCustomerConfirmDialogComponent,
    ConfirmDialogHostComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  @ViewChild('statusMenuContainer', { static: false }) statusMenuContainer!: ElementRef;
  @ViewChild('statusMenuButton', { static: false }) statusMenuButton!: ElementRef;
  
  isMobileMenuOpen = signal(false);
  isSettingsOpen = signal(false);
  isStatusMenuOpen = signal(false);
  isAuthenticated = signal(false);
  currentUser = signal<any>(null);
  currentEmployee = signal<EmployeeDto | null>(null);
  availabilityStatus = signal<AvailabilityStatusKey>('available');
  isLoginPage = signal(false);
  isFullScreenPage = signal(false);
  showStatusChangeDialog = signal(false);
  pendingStatusChange = signal<AvailabilityStatusKey | null>(null);
  myQueueInfo = signal<MyQueueInfoResponse | null>(null);
  isLoadingQueueInfo = signal(false);

  showLayout = computed(() => this.isAuthenticated() && !this.isLoginPage() && !this.isFullScreenPage());
  
  // Check if user is employee (has Basic role)
  isEmployee = computed(() => {
    const user = this.currentUser();
    if (!user || !user.roles) return false;
    // Check if roles array contains "Basic" or "พนักงาน"
    const roles = Array.isArray(user.roles) ? user.roles : [user.roles];
    
    // Debug: log roles to console
    console.log('Current user roles:', roles);
    
    return roles.some((role: string) => {
      const roleLower = role.toLowerCase();
      return roleLower === 'basic' || 
             role === 'Basic' ||
             role === 'พนักงาน' ||
             roleLower.includes('basic');
    });
  });

  // Only allow self status change if user is Basic-only (no Admin/Manager/SuperAdmin)
  canChangeOwnStatus = computed(() => {
    const user = this.currentUser();
    if (!user || !user.roles) return false;
    const roles = Array.isArray(user.roles) ? user.roles : [user.roles];
    const normalized: string[] = roles.map((role: unknown) => String(role ?? '').trim().toLowerCase());

    const hasBasic = normalized.includes('basic');
    const hasForbidden = normalized.some((role: string) => role === 'admin' || role === 'superadmin' || role === 'manager');
    return hasBasic && !hasForbidden;
  });

  // Check if user has Manager access (Manager, Admin, or SuperAdmin role)
  hasManagerAccess = computed(() => {
    const user = this.currentUser();
    if (!user || !user.roles) return false;
    const roles = Array.isArray(user.roles) ? user.roles : [user.roles];
    
    return roles.some((role: string) => {
      const roleLower = role.toLowerCase();
      return roleLower === 'manager' || 
             roleLower === 'admin' || 
             roleLower === 'superadmin';
    });
  });

  // Check if user has Admin access (Admin or SuperAdmin role only)
  hasAdminAccess = computed(() => {
    const user = this.currentUser();
    if (!user || !user.roles) return false;
    const roles = Array.isArray(user.roles) ? user.roles : [user.roles];
    
    return roles.some((role: string) => {
      const roleLower = role.toLowerCase();
      return roleLower === 'admin' || 
             roleLower === 'superadmin';
    });
  });

  // Check if user has SuperAdmin access (SuperAdmin role only)
  hasSuperAdminAccess = computed(() => {
    const user = this.currentUser();
    if (!user || !user.roles) return false;
    const roles = Array.isArray(user.roles) ? user.roles : [user.roles];
    return roles.some((role: string) => role.toLowerCase() === 'superadmin');
  });

  statusInfo = computed(() => {
    switch (this.availabilityStatus()) {
      case 'available':
        return {
          text: 'พร้อมรับงาน',
          dotClass: 'bg-green-500',
        };
      case 'busy':
        return {
          text: 'ติดลูกค้า',
          dotClass: 'bg-orange-500',
        };
      case 'lunchBreak':
        return {
          text: 'พักเที่ยง',
          dotClass: 'bg-yellow-500',
        };
      case 'unavailable':
        return {
          text: 'ไม่พร้อมรับงาน',
          dotClass: 'bg-gray-400',
        };
      case 'leave':
        return {
          text: 'ลา',
          dotClass: 'bg-red-500',
        };
      case 'offsiteCustomer':
        return {
          text: 'พบลูกค้านอกสถานที่',
          dotClass: 'bg-blue-500',
        };
    }
  });

  getStatusTextClass(): string {
    const status = this.availabilityStatus();
    switch (status) {
      case 'available':
        return 'text-green-600';
      case 'busy':
        return 'text-orange-600';
      case 'lunchBreak':
        return 'text-yellow-600';
      case 'unavailable':
        return 'text-gray-500';
      case 'leave':
        return 'text-red-600';
      case 'offsiteCustomer':
        return 'text-blue-600';
      default:
        return 'text-gray-500';
    }
  }

  constructor(
    private authService: AuthService,
    private router: Router,
    private queueService: QueueService,
    private toastService: ToastService,
    private employeeService: EmployeeService,
    private myStatusStore: MyStatusStore,
    public receiveCustomerService: ReceiveCustomerService
  ) {
    // Bind to centralized status store for consistent UI across the app
    this.availabilityStatus = this.myStatusStore.availabilityStatus;
    this.myQueueInfo = this.myStatusStore.myQueueInfo;
    this.isLoadingQueueInfo = this.myStatusStore.isRefreshing;
  }

  confirmReceiveCustomer(): void {
    this.receiveCustomerService.confirm();
  }

  closeReceiveCustomerDialog(): void {
    this.receiveCustomerService.close();
  }

  // --- Disable zoom (Ctrl/Cmd + wheel / +/- / 0) ---
  private readonly onWheelBlockZoom = (event: WheelEvent) => {
    // Ctrl (Windows/Linux) or Cmd (macOS) + wheel triggers browser zoom
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
    }
  };

  private readonly onKeyDownBlockZoom = (event: KeyboardEvent) => {
    const isZoomModifier = event.ctrlKey || event.metaKey;
    if (!isZoomModifier) return;

    const key = event.key;
    // Block: Ctrl/Cmd + (+, -, 0) and common variants
    if (key === '+' || key === '-' || key === '0' || key === '=' || key === '_' ) {
      event.preventDefault();
    }
  };

  ngOnInit(): void {
    // Ensure status menu is closed on initial load
    this.isStatusMenuOpen.set(false);
    this.isMobileMenuOpen.set(false);
    this.isSettingsOpen.set(false);
    
    this.isAuthenticated.set(this.authService.isAuthenticated());
    this.currentUser.set(this.authService.getCurrentUser());

    // Check current route
    this.checkRoute(this.router.url);

    // Subscribe to route changes
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.checkRoute(event.url);
        // Close status menu when navigating to a new route
        this.isStatusMenuOpen.set(false);
      });

    this.authService.currentUser$.subscribe(user => {
      this.currentUser.set(user);
      const wasAuthenticated = this.isAuthenticated();
      this.isAuthenticated.set(this.authService.isAuthenticated());
      
      // If user just logged in (was not authenticated, now is), close all menus
      if (!wasAuthenticated && this.isAuthenticated()) {
        this.isStatusMenuOpen.set(false);
        this.isMobileMenuOpen.set(false);
        this.isSettingsOpen.set(false);
      }
      
      if (user) {
        this.loadEmployeeInfo();
        this.myStatusStore.init();
      } else {
        this.currentEmployee.set(null);
        this.myQueueInfo.set(null);
        // Close menus when user logs out
        this.isStatusMenuOpen.set(false);
        this.isMobileMenuOpen.set(false);
        this.isSettingsOpen.set(false);
      }
    });

    if (this.isAuthenticated()) {
      this.loadEmployeeInfo();
      this.myStatusStore.init();
      
      // Status is now stored in database, no need for localStorage
    }

    // Attach non-passive wheel listener so preventDefault works
    document.addEventListener('wheel', this.onWheelBlockZoom, { passive: false });
    document.addEventListener('keydown', this.onKeyDownBlockZoom);
  }

  private loadEmployeeInfo(): void {
    this.employeeService.getMyEmployeeInfo().pipe(
      catchError(error => {
        console.error('Error loading employee info:', error);
        return of(null);
      })
    ).subscribe(employee => {
      if (employee) {
        this.currentEmployee.set(employee);
      }
    });
  }

  // Status/queue info is managed centrally by MyStatusStore

  generateAvatar(name: string): string {
    if (!name) return '';
    // Generate avatar from first character
    const firstChar = name.charAt(0).toUpperCase();
    // In a real implementation, you might use a service like UI Avatars
    // For now, return empty string and let the template handle it
    return '';
  }

  private checkRoute(url: string): void {
    this.isLoginPage.set(url.includes('/login'));
    // Full-screen pages must not render the app shell (sidebar/top/bottom layout)
    // Example: Monitor should look identical whether logged in or not.
    this.isFullScreenPage.set(url.includes('/monitor'));
    
    // Close status menu when navigating (except if it's the login page)
    if (!url.includes('/login')) {
      this.isStatusMenuOpen.set(false);
    }
  }

  logout(): void {
    this.authService.logout();
    this.isMobileMenuOpen.set(false);
    this.isSettingsOpen.set(false);
    this.isStatusMenuOpen.set(false);
  }

  getUserInitial(): string {
    const employee = this.currentEmployee();
    if (employee?.name) {
      return employee.name.charAt(0).toUpperCase();
    }
    const user = this.currentUser();
    if (user?.userName) {
      return user.userName.charAt(0).toUpperCase();
    }
    return 'A';
  }

  getUserName(): string {
    const employee = this.currentEmployee();
    if (employee?.name) {
      return employee.name;
    }
    const user = this.currentUser();
    return user?.userName || 'Admin User';
  }

  getUserRole(): string {
    const user = this.currentUser();
    if (user?.roles && user.roles.length > 0) {
      return user.roles[0];
    }
    return 'System Admin';
  }

  toggleStatusMenu(): void {
    this.isStatusMenuOpen.update(v => !v);
  }

  getAvailableStatuses(): Array<{ value: AvailabilityStatusKey; label: string; dotClass: string }> {
    // While busy, disallow manual status changes
    if (this.availabilityStatus() === 'busy') {
      return [];
    }

    const allStatuses: Array<{ value: AvailabilityStatusKey; label: string; dotClass: string }> = [
      { value: 'available', label: getAvailabilityStatusLabel('available'), dotClass: getAvailabilityStatusDotClass('available') },
      { value: 'lunchBreak', label: getAvailabilityStatusLabel('lunchBreak'), dotClass: getAvailabilityStatusDotClass('lunchBreak') },
      { value: 'unavailable', label: getAvailabilityStatusLabel('unavailable'), dotClass: getAvailabilityStatusDotClass('unavailable') },
      { value: 'leave', label: getAvailabilityStatusLabel('leave'), dotClass: getAvailabilityStatusDotClass('leave') },
      { value: 'offsiteCustomer', label: getAvailabilityStatusLabel('offsiteCustomer'), dotClass: getAvailabilityStatusDotClass('offsiteCustomer') }
    ];
    
    // Filter out current status - don't show the status that's already selected
    const currentStatus = this.availabilityStatus();
    const filtered = allStatuses.filter(status => status.value !== currentStatus);
    
    return filtered;
  }

  setStatus(status: AvailabilityStatusKey): void {
    // While busy (serving customer), employee cannot change status manually until job is closed.
    if (this.availabilityStatus() === 'busy') {
      this.isStatusMenuOpen.set(false);
      return;
    }

    // Show confirmation dialog first
    this.pendingStatusChange.set(status);
    this.showStatusChangeDialog.set(true);
    this.isStatusMenuOpen.set(false);
  }

  confirmStatusChange(): void {
    const status = this.pendingStatusChange();
    if (!status) {
      return;
    }

    // Map frontend status to backend availability status
    this.queueService.updateMyQueueStatus(status).pipe(
      catchError(error => {
        console.error('Error updating queue status:', error);
        this.toastService.error('เกิดข้อผิดพลาดในการอัปเดตสถานะ');
        return of(null);
      })
    ).subscribe(response => {
      if (response) {
        this.toastService.success('อัปเดตสถานะสำเร็จ');
        this.myStatusStore.requestRefresh();
      }
      this.showStatusChangeDialog.set(false);
      this.pendingStatusChange.set(null);
    });
  }

  cancelStatusChange(): void {
    this.showStatusChangeDialog.set(false);
    this.pendingStatusChange.set(null);
  }

  closeStatusChangeDialog(): void {
    this.showStatusChangeDialog.set(false);
    this.pendingStatusChange.set(null);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.isStatusMenuOpen()) {
      return;
    }

    const target = event.target as HTMLElement;
    const container = this.statusMenuContainer?.nativeElement;
    const button = this.statusMenuButton?.nativeElement;

    // Check if click is outside both the dropdown and the button
    if (container && button && !container.contains(target) && !button.contains(target)) {
      this.isStatusMenuOpen.set(false);
    }
  }

  ngOnDestroy(): void {
    // Cleanup if needed
    document.removeEventListener('wheel', this.onWheelBlockZoom as any);
    document.removeEventListener('keydown', this.onKeyDownBlockZoom as any);
  }
}

