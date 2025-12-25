import { ChangeDetectionStrategy, Component, signal, Inject, PLATFORM_ID, computed } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { MyTasksComponent, AvailabilityStatus } from './components/my-tasks/my-tasks.component';
import { CustomerQueueComponent } from './components/customer-queue/customer-queue.component';
import { JobAssignmentComponent } from './components/job-assignment/job-assignment.component';
import { SalesReportComponent } from './components/sales-report/sales-report.component';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, SidebarComponent, MyTasksComponent, CustomerQueueComponent, JobAssignmentComponent, SalesReportComponent]
})
export class AppComponent {
  isSidebarOpen = signal(true);
  activeView = signal('my-tasks');
  availabilityStatus = signal<AvailabilityStatus>('available');

  statusBannerInfo = computed(() => {
    switch (this.availabilityStatus()) {
      case 'busy':
        return {
          title: 'คุณกำลังติดลูกค้า',
          subtitle: 'สถานะของคุณจะเปลี่ยนเป็น "พร้อมรับงาน" อัตโนมัติเมื่องานเสร็จ',
          borderColor: 'border-orange-400',
          iconContainerBg: 'bg-orange-100',
          iconBorder: 'border-orange-200',
          iconColor: 'text-orange-500',
        };
      case 'break':
        return {
          title: 'คุณกำลังพัก',
          subtitle: 'คุณจะไม่ได้รับคิวใหม่ระหว่างพัก',
          borderColor: 'border-yellow-400',
          iconContainerBg: 'bg-yellow-100',
          iconBorder: 'border-yellow-200',
          iconColor: 'text-yellow-500',
        };
      case 'unavailable':
        return {
          title: 'คุณตั้งสถานะเป็น "ไม่พร้อมรับงาน"',
          subtitle: 'คุณจะไม่ได้รับคิวใหม่จนกว่าจะเปลี่ยนสถานะกลับมาเป็น "พร้อมรับงาน"',
          borderColor: 'border-gray-400',
          iconContainerBg: 'bg-gray-100',
          iconBorder: 'border-gray-200',
          iconColor: 'text-gray-500',
        };
      default:
        return null;
    }
  });

  constructor(@Inject(PLATFORM_ID) private platformId: object) {}

  onNavigate(view: string) {
    // Only switch view if it's a known main view
    if (view === 'my-tasks' || view === 'customer-queue' || view === 'assign' || view === 'report') {
      this.activeView.set(view);
    }
    
    // On mobile, close sidebar after navigation.
    if (isPlatformBrowser(this.platformId) && window.innerWidth < 1024) { // Tailwind's lg breakpoint is 1024px.
      this.isSidebarOpen.set(false);
    }
  }

  onStatusChange(status: AvailabilityStatus) {
    this.availabilityStatus.set(status);
  }

  toggleSidebar() {
    this.isSidebarOpen.update(v => !v);
  }
}