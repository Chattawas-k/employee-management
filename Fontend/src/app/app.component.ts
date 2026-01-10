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
import { TaskService } from './services/task.service';
import { ToastService } from './services/toast.service';
import { EmployeeService } from './services/employee.service';
import { SignalRService } from './services/signalr.service';
import { EmployeeDto } from './models/employee.model';
import { MyQueueInfoResponse } from './models/queue.model';
import { catchError } from 'rxjs/operators';
import { forkJoin, of } from 'rxjs';
import { getEmployeeIdFromToken } from './utils/jwt.util';

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
  availabilityStatus = signal<'available' | 'busy' | 'break' | 'unavailable' | 'notworking'>('available');
  isLoginPage = signal(false);
  showStatusChangeDialog = signal(false);
  pendingStatusChange = signal<'available' | 'busy' | 'break' | 'unavailable' | 'notworking' | null>(null);
  myQueueInfo = signal<MyQueueInfoResponse | null>(null);
  isLoadingQueueInfo = signal(false);

  showLayout = computed(() => this.isAuthenticated() && !this.isLoginPage());
  
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
      case 'notworking':
        return {
          text: 'ไม่ได้ทำงาน',
          dotClass: 'bg-red-500',
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
      case 'break':
        return 'text-yellow-600';
      case 'unavailable':
        return 'text-gray-500';
      case 'notworking':
        return 'text-red-600';
      default:
        return 'text-gray-500';
    }
  }

  constructor(
    private authService: AuthService,
    private router: Router,
    private queueService: QueueService,
    private taskService: TaskService,
    private toastService: ToastService,
    private employeeService: EmployeeService,
    private signalRService: SignalRService
  ) {}

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
        this.loadMyQueueInfo();
        this.setupSignalR();
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
      this.loadMyQueueInfo();
      this.setupSignalR();
      
      // Status is now stored in database, no need for localStorage
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

  private loadMyQueueInfo(): void {
    this.isLoadingQueueInfo.set(true);
    
    // Load both queue info and tasks to check for in-progress tasks
    const token = this.authService.getToken();
    const employeeId = getEmployeeIdFromToken(token);
    
    if (!employeeId) {
      this.isLoadingQueueInfo.set(false);
      this.myQueueInfo.set(null);
      this.availabilityStatus.set('unavailable');
      return;
    }

    forkJoin({
      queueInfo: this.queueService.getMyQueueInfo().pipe(
        catchError(error => {
          console.error('Error loading queue info:', error);
          return of(null);
        })
      ),
      tasks: this.taskService.getMyTasks().pipe(
        catchError(error => {
          console.error('Error loading tasks:', error);
          return of({ jobs: [] });
        })
      )
    }).subscribe(({ queueInfo, tasks }) => {
      this.isLoadingQueueInfo.set(false);
      
      if (queueInfo && queueInfo.isInQueue) {
        this.myQueueInfo.set(queueInfo);
        
        // Update availability status from queue info
        // Use AvailabilityStatus from API (stored in database)
        const availabilityStatusLower = queueInfo.availabilityStatus?.toLowerCase() || '';
        const currentStatus = this.availabilityStatus();
        
        // Check for in-progress tasks
        const inProgressTasks = tasks.jobs.filter(job => {
          const status = job.status?.toString().toLowerCase() || '';
          return status === 'inprogress' || status === 'in_progress' || status === '2';
        });
        
        if (availabilityStatusLower === 'busy') {
          // AvailabilityStatus is Busy → set to busy
          this.availabilityStatus.set('busy');
        } else if (availabilityStatusLower === 'break') {
          // AvailabilityStatus is Break → set to break
          this.availabilityStatus.set('break');
        } else if (availabilityStatusLower === 'unavailable') {
          // AvailabilityStatus is Unavailable → set to unavailable
          this.availabilityStatus.set('unavailable');
        } else if (availabilityStatusLower === 'notworking') {
          // AvailabilityStatus is NotWorking → set to notworking
          this.availabilityStatus.set('notworking');
        } else if (availabilityStatusLower === 'available') {
          // AvailabilityStatus is Available → check if should be available or busy
          // If manually set to break/unavailable/notworking, keep it (but this shouldn't happen if status is Available)
          if (currentStatus === 'break' || currentStatus === 'unavailable' || currentStatus === 'notworking') {
            // Keep manual status - don't change it
            // But this is unlikely since backend status is Available
          } else {
            // Check if there are in-progress tasks (sync with my-tasks component logic)
            if (inProgressTasks.length > 0) {
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
            if (inProgressTasks.length > 0) {
              this.availabilityStatus.set('busy');
            } else {
              this.availabilityStatus.set('available');
            }
          } else {
            // Default to unavailable if status is unknown
            this.availabilityStatus.set('unavailable');
          }
        }
      } else {
        this.myQueueInfo.set(null);
        this.availabilityStatus.set('unavailable'); // Not in queue = unavailable
      }
    });
  }

  private async setupSignalR(): Promise<void> {
    try {
      await this.signalRService.startConnection();
      
      // Subscribe to queue updates for real-time refresh
      this.signalRService.onQueueUpdated(() => {
        this.loadMyQueueInfo();
      });
    } catch (error) {
      console.error('Failed to start SignalR connection:', error);
      // Continue without real-time updates if SignalR fails
    }
  }

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

  getAvailableStatuses(): Array<{ value: 'available' | 'busy' | 'break' | 'unavailable' | 'notworking'; label: string; dotClass: string }> {
    // Get all possible statuses
    const allStatuses: Array<{ value: 'available' | 'busy' | 'break' | 'unavailable' | 'notworking'; label: string; dotClass: string }> = [
      { value: 'available', label: 'พร้อมรับงาน', dotClass: 'bg-green-500' },
      { value: 'busy', label: 'ติดลูกค้า', dotClass: 'bg-orange-500' },
      { value: 'break', label: 'พัก', dotClass: 'bg-yellow-500' },
      { value: 'unavailable', label: 'ไม่พร้อมรับงาน', dotClass: 'bg-gray-400' },
      { value: 'notworking', label: 'ไม่ได้ทำงาน', dotClass: 'bg-red-500' }
    ];
    
    // Filter out current status - don't show the status that's already selected
    const currentStatus = this.availabilityStatus();
    const filtered = allStatuses.filter(status => status.value !== currentStatus);
    
    // Debug: Log to ensure "ไม่ได้ทำงาน" is included
    console.log('Available statuses:', filtered.map(s => s.label));
    
    return filtered;
  }

  setStatus(status: 'available' | 'busy' | 'break' | 'unavailable' | 'notworking'): void {
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
        // Update availability status from response
        if (response.availabilityStatus) {
          const availabilityStatus = response.availabilityStatus.toLowerCase() as 'available' | 'busy' | 'break' | 'unavailable' | 'notworking';
          this.availabilityStatus.set(availabilityStatus);
        } else {
          this.availabilityStatus.set(status);
        }
        this.toastService.success('อัปเดตสถานะสำเร็จ');
        
        // Reload queue info to sync with backend
        // This will trigger QueueUpdated notification which will update my-tasks component
        this.loadMyQueueInfo();
        
        // Also trigger a manual queue update notification to ensure immediate sync
        // The backend already sends QueueUpdated, but we can also manually trigger it
        // by calling loadMyQueueInfo which will update the status
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

