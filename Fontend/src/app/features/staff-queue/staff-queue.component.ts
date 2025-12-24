import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { Employee } from '../../models/employee.model';
import { Job } from '../../models/job.model';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-staff-queue',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ModalComponent,
    ButtonComponent,
    AvatarComponent,
    IconComponent
  ],
  templateUrl: './staff-queue.component.html',
  styleUrls: ['./staff-queue.component.scss']
})
export class StaffQueueComponent implements OnInit {
  currentViewerId = signal<string>('');
  employees = signal<Employee[]>([]);
  assignmentModal = signal({
    isOpen: false,
    employee: null as Employee | null,
    step: 'choice' as 'choice' | 'details' | 'reject',
    jobData: { title: 'Walk-in Customer', customer: 'ลูกค้าทั่วไป', description: 'บริการลูกค้าหน้าร้าน', priority: 'Normal' as Job['priority'] }
  });
  jobDataForm = { title: 'Walk-in Customer', customer: 'ลูกค้าทั่วไป', description: 'บริการลูกค้าหน้าร้าน' };
  rejectReason = '';
  isManageModalOpen = signal(false);
  tempQueue = signal<Employee[]>([]);

  queue = computed(() => {
    // Note: Queue management should use Queue API instead of queuePos
    // For now, just return active employees without sorting by queue position
    return this.employees()
      .filter(e => e.status !== 'Inactive');
  });

  nextUp = computed(() => this.queue()[0]);
  upcoming = computed(() => this.queue().slice(1));

  currentUser = computed(() => {
    return this.employees().find(e => e.id === this.currentViewerId()) || this.employees()[0];
  });

  isMyTurn = computed(() => {
    const next = this.nextUp();
    const current = this.currentUser();
    return next && current && next.id === current.id;
  });

  constructor(private dataService: DataService) {}

  ngOnInit(): void {
    this.dataService.employees$.subscribe(emps => {
      this.employees.set(emps);
      // Set initial viewer to first employee if available
      if (emps.length > 0 && !this.currentViewerId()) {
        this.currentViewerId.set(emps[0].id);
      }
    });
  }

  openAssignModal(emp: Employee): void {
    this.jobDataForm = { title: 'Walk-in Customer', customer: 'ลูกค้าทั่วไป', description: 'บริการลูกค้าหน้าร้าน' };
    this.rejectReason = '';
    this.assignmentModal.set({
      isOpen: true,
      employee: emp,
      step: 'choice',
      jobData: { title: 'Walk-in Customer', customer: 'ลูกค้าทั่วไป', description: 'บริการลูกค้าหน้าร้าน', priority: 'Normal' as Job['priority'] }
    });
  }

  closeAssignModal(): void {
    this.assignmentModal.update(m => ({ ...m, isOpen: false }));
  }

  setModalStep(step: 'choice' | 'details' | 'reject'): void {
    this.assignmentModal.update(m => ({ ...m, step }));
  }

  handleConfirmAccept(): void {
    const emp = this.assignmentModal().employee;
    if (!emp) return;
    this.dataService.assignJob(emp.id, { ...this.jobDataForm, priority: 'Normal' as Job['priority'] });
    this.closeAssignModal();
  }

  handleRejectSubmit(): void {
    if (!this.rejectReason.trim()) {
      alert("กรุณาระบุเหตุผลในการปฏิเสธงาน");
      return;
    }
    const emp = this.assignmentModal().employee;
    if (!emp) return;
    this.dataService.rejectJob(emp.id, this.rejectReason);
    this.closeAssignModal();
    this.rejectReason = '';
  }

  openManageModal(): void {
    this.tempQueue.set([...this.queue()]);
    this.isManageModalOpen.set(true);
  }

  moveUp(index: number): void {
    if (index === 0) return;
    const newQueue = [...this.tempQueue()];
    [newQueue[index], newQueue[index - 1]] = [newQueue[index - 1], newQueue[index]];
    this.tempQueue.set(newQueue);
  }

  moveDown(index: number): void {
    if (index === this.tempQueue().length - 1) return;
    const newQueue = [...this.tempQueue()];
    [newQueue[index], newQueue[index + 1]] = [newQueue[index + 1], newQueue[index]];
    this.tempQueue.set(newQueue);
  }

  saveOrder(): void {
    // TODO: Implement reorder queue
    this.isManageModalOpen.set(false);
  }
}

