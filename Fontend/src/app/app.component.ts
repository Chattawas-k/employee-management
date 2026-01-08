import { Component, signal, computed, OnInit, OnDestroy, HostListener, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { LucideAngularModule } from 'lucide-angular';
import { IconComponent } from './shared/components/icon/icon.component';
import { ToastContainerComponent } from './shared/components/toast/toast-container.component';
import { StatusChangeDialogComponent } from './shared/components/status-change-dialog/status-change-dialog.component';
import { AuthService } from './services/auth.service';
import { QueueService } from './services/queue.service';
import { ToastService } from './services/toast.service';
import { EmployeeService } from './services/employee.service';
import { EmployeeDto } from './models/employee.model';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

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
    StatusChangeDialogComponent
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
  availabilityStatus = signal<'available' | 'busy' | 'break' | 'unavailable'>('available');
  isLoginPage = signal(false);
  showStatusChangeDialog = signal(false);
  pendingStatusChange = signal<'available' | 'busy' | 'break' | 'unavailable' | null>(null);

  showLayout = computed(() => this.isAuthenticated() && !this.isLoginPage());

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
      case 'break':
        return {
          text: 'พัก',
          dotClass: 'bg-yellow-500',
        };
      case 'unavailable':
        return {
          text: 'ไม่พร้อมรับงาน',
          dotClass: 'bg-gray-400',
        };
    }
  });

  constructor(
    private authService: AuthService,
    private router: Router,
    private queueService: QueueService,
    private toastService: ToastService,
    private employeeService: EmployeeService
  ) {}

  ngOnInit(): void {
    this.isAuthenticated.set(this.authService.isAuthenticated());
    this.currentUser.set(this.authService.getCurrentUser());

    // Check current route
    this.checkRoute(this.router.url);

    // Subscribe to route changes
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.checkRoute(event.url);
      });

    this.authService.currentUser$.subscribe(user => {
      this.currentUser.set(user);
      this.isAuthenticated.set(this.authService.isAuthenticated());
      if (user) {
        this.loadEmployeeInfo();
      } else {
        this.currentEmployee.set(null);
      }
    });

    if (this.isAuthenticated()) {
      this.loadEmployeeInfo();
    }
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

  private checkRoute(url: string): void {
    this.isLoginPage.set(url.includes('/login'));
  }

  logout(): void {
    this.authService.logout();
    this.isMobileMenuOpen.set(false);
    this.isSettingsOpen.set(false);
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

  getAvailableStatuses(): Array<{ value: 'available' | 'busy' | 'break' | 'unavailable'; label: string; dotClass: string }> {
    // Only show busy, break, and unavailable in dropdown (not available)
    return [
      { value: 'busy', label: 'ติดลูกค้า', dotClass: 'bg-orange-500' },
      { value: 'break', label: 'พัก', dotClass: 'bg-yellow-500' },
      { value: 'unavailable', label: 'ไม่พร้อมรับงาน', dotClass: 'bg-gray-400' }
    ];
  }

  setStatus(status: 'available' | 'busy' | 'break' | 'unavailable'): void {
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

    // Map frontend status to backend queue status
    let queueStatus: 'active' | 'busy' | 'inactive';
    switch (status) {
      case 'available':
        queueStatus = 'active';
        break;
      case 'busy':
        queueStatus = 'busy';
        break;
      case 'break':
      case 'unavailable':
        queueStatus = 'inactive';
        break;
      default:
        return;
    }

    this.queueService.updateMyQueueStatus(queueStatus).pipe(
      catchError(error => {
        console.error('Error updating queue status:', error);
        this.toastService.error('เกิดข้อผิดพลาดในการอัปเดตสถานะ');
        return of(null);
      })
    ).subscribe(response => {
      if (response) {
        this.availabilityStatus.set(status);
        this.toastService.success('อัปเดตสถานะสำเร็จ');
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
  }
}

