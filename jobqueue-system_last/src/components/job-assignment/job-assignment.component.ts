import { ChangeDetectionStrategy, Component, signal, output, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { JobAssignmentCardComponent, StaffMember } from '../job-assignment-card/job-assignment-card.component';
import { OpenJobDialogComponent } from '../open-job-dialog/open-job-dialog.component';

@Component({
  selector: 'app-job-assignment',
  standalone: true,
  templateUrl: './job-assignment.component.html',
  imports: [CommonModule, FormsModule, JobAssignmentCardComponent, OpenJobDialogComponent],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JobAssignmentComponent {
  menuClick = output<void>();
  statusBannerInfo = input<{ title: string; subtitle: string; } | null>(null);
  searchTerm = signal('');

  showAssignDialog = signal(false);
  selectedStaff = signal<StaffMember | null>(null);

  staffMembers = signal<StaffMember[]>([
    {
      name: 'สมศักดิ์ รักงาน (Bob)',
      role: 'พนักงานขาย',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop',
      status: 'พร้อมรับงาน',
      statusClass: 'bg-green-100 text-green-800',
      currentTasks: 0,
      queuePosition: 1,
    },
    {
      name: 'สมชาย ใจดี (Alice)',
      role: 'พนักงานขาย',
      avatarUrl: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?q=80&w=200&auto=format&fit=crop',
      status: 'ติดลูกค้า',
      statusClass: 'bg-orange-100 text-orange-800',
      currentTasks: 1,
      queuePosition: 2,
    },
    {
      name: 'วิชัย จัดการ (Charlie)',
      role: 'ผู้จัดการสาขา',
      avatarUrl: 'https://images.unsplash.com/photo-1583864697784-a0efc8379f70?q=80&w=200&auto=format&fit=crop',
      status: 'ติดลูกค้า',
      statusClass: 'bg-orange-100 text-orange-800',
      currentTasks: 3,
      queuePosition: 3,
    },
    {
      name: 'ดาริน สวยงาม (Diana)',
      role: 'ออกแบบ',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop',
      status: 'พัก/ลางาน',
      statusClass: 'bg-gray-100 text-gray-800',
      currentTasks: 0,
      queuePosition: 0,
    },
    {
      name: 'เอกชัย มุ่งมั่น (Ethan)',
      role: 'พนักงานขาย',
      avatarUrl: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?q=80&w=200&auto=format&fit=crop',
      status: 'พร้อมรับงาน',
      statusClass: 'bg-green-100 text-green-800',
      currentTasks: 0,
      queuePosition: 4,
    }
  ]);

  filteredStaff = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) {
      return this.staffMembers();
    }
    return this.staffMembers().filter(staff => staff.name.toLowerCase().includes(term));
  });

  handleAction(staff: StaffMember) {
    if (staff.status !== 'พัก/ลางาน') {
        this.selectedStaff.set(staff);
        this.showAssignDialog.set(true);
    }
  }

  closeAssignDialog() {
    this.showAssignDialog.set(false);
    this.selectedStaff.set(null);
  }

  confirmAssignment(jobData: any) {
    const staff = this.selectedStaff();
    if (staff) {
      console.log(`Assigning new job to ${staff.name}:`, jobData);

      this.staffMembers.update(members => {
        return members.map(m => {
          if (m.name === staff.name) {
            const newTasks = m.currentTasks + 1;
            const isBusy = newTasks > 0;
            return {
              ...m,
              currentTasks: newTasks,
              status: isBusy ? 'ติดลูกค้า' : 'พร้อมรับงาน',
              statusClass: isBusy ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800',
            };
          }
          return m;
        });
      });
    }
    this.closeAssignDialog();
  }
}