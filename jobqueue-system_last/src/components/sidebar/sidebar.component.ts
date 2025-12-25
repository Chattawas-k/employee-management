import { ChangeDetectionStrategy, Component, signal, output, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AvailabilityStatus } from '../my-tasks/my-tasks.component';

interface NavItem {
  id: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  templateUrl: './sidebar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule]
})
export class SidebarComponent {
  availabilityStatus = input.required<AvailabilityStatus>();
  activeNavItem = signal('my-tasks');
  navClicked = output<string>();
  statusChanged = output<AvailabilityStatus>();

  navItems = signal<NavItem[]>([
    { id: 'customer-queue', label: 'คิวพนักงาน', icon: 'users' },
    { id: 'my-tasks', label: 'งานของฉัน', icon: 'clipboard-list' },
    { id: 'calendar', label: 'ปฏิทินงาน', icon: 'calendar' },
    { id: 'assign', label: 'มอบหมายงาน', icon: 'briefcase' },
    { id: 'summary', label: 'สรุปคิวงาน', icon: 'chart-bar' },
    { id: 'report', label: 'รายงาน', icon: 'document-report' },
  ]);
  
  isStatusMenuOpen = signal(false);

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

  handleNav(itemId: string) {
    this.activeNavItem.set(itemId);
    this.navClicked.emit(itemId);
  }

  toggleStatusMenu() {
    this.isStatusMenuOpen.update(v => !v);
  }
  
  setStatus(status: AvailabilityStatus) {
    this.statusChanged.emit(status);
    this.isStatusMenuOpen.set(false);
  }
}