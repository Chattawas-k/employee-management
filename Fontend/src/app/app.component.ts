import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { LucideAngularModule } from 'lucide-angular';
import { IconComponent } from './shared/components/icon/icon.component';
import { ToastContainerComponent } from './shared/components/toast/toast-container.component';
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
    ToastContainerComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  isMobileMenuOpen = signal(false);
  isSettingsOpen = signal(false);
  isStatusMenuOpen = signal(false);
  isAuthenticated = signal(false);
  currentUser = signal<any>(null);
  currentEmployee = signal<EmployeeDto | null>(null);
  availabilityStatus = signal<'available' | 'busy' | 'break' | 'unavailable'>('available');
  isLoginPage = signal(false);

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
    const currentStatus = this.availabilityStatus();
    const allStatuses: Array<{ value: 'available' | 'busy' | 'break' | 'unavailable'; label: string; dotClass: string }> = [
      { value: 'available', label: 'พร้อมรับงาน', dotClass: 'bg-green-500' },
      { value: 'busy', label: 'ติดลูกค้า', dotClass: 'bg-orange-500' },
      { value: 'break', label: 'พัก', dotClass: 'bg-yellow-500' },
      { value: 'unavailable', label: 'ไม่พร้อมรับงาน', dotClass: 'bg-gray-400' }
    ];
    
    // Filter out current status
    return allStatuses.filter(status => status.value !== currentStatus);
  }

  setStatus(status: 'available' | 'busy' | 'break' | 'unavailable'): void {
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
      this.isStatusMenuOpen.set(false);
    });
  }
}

