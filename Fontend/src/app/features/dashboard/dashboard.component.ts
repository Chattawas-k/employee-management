import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { Employee } from '../../models/employee.model';
import { Job } from '../../models/job.model';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { BadgeComponent } from '../../shared/components/badge/badge.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { getDurationText } from '../../utils/date.utils';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ModalComponent,
    ButtonComponent,
    AvatarComponent,
    BadgeComponent,
    IconComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  currentViewerId = signal<string>('');
  employees = signal<Employee[]>([]);
  jobs = signal<Job[]>([]);
  assignmentModal = signal({
    isOpen: false,
    employee: null as Employee | null,
    step: 'choice' as 'choice' | 'details' | 'reject'
  });
  jobData = signal({ title: 'ลูกค้า Walk-in', customer: 'ลูกค้าหน้าร้าน', description: 'ลูกค้าสนใจดูสินค้าเฟอร์นิเจอร์', priority: 'Normal' as Job['priority'] });
  jobDataForm = { title: 'ลูกค้า Walk-in', customer: 'ลูกค้าหน้าร้าน', description: 'ลูกค้าสนใจดูสินค้าเฟอร์นิเจอร์' };
  rejectReasonValue = '';

  currentUser = computed(() => {
    return this.employees().find(e => e.id === this.currentViewerId()) || this.employees()[0];
  });

  myJobs = computed(() => {
    const user = this.currentUser();
    if (!user) return [];
    return this.jobs().filter(j => j.assignee === user.name);
  });

  myPendingJobs = computed(() => this.myJobs().filter(j => j.status === 'Pending'));
  myActiveJobs = computed(() => this.myJobs().filter(j => j.status === 'In Progress'));
  myDoneJobs = computed(() => this.myJobs().filter(j => j.status === 'Done'));

  activeEmployees = computed(() => {
    // Note: Queue management should use Queue API instead of queuePos
    // For now, just return active employees without sorting by queue position
    return this.employees()
      .filter(e => e.status !== 'Inactive');
  });

  nextUp = computed(() => this.activeEmployees()[0]);

  isMyTurn = computed(() => {
    const next = this.nextUp();
    const current = this.currentUser();
    return next && current && next.id === current.id;
  });

  queuesAhead = computed(() => {
    const index = this.activeEmployees().findIndex(e => e.id === this.currentUser()?.id);
    return index > -1 ? index : 0;
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
    this.dataService.jobs$.subscribe(jobs => this.jobs.set(jobs));
  }

  onViewerChange(): void {
    // Trigger recomputation
  }

  openAssignModal(): void {
    const user = this.currentUser();
    if (!user) return;
    this.jobDataForm = { title: 'ลูกค้า Walk-in', customer: 'ลูกค้าหน้าร้าน', description: 'ลูกค้าสนใจดูสินค้าเฟอร์นิเจอร์' };
    this.assignmentModal.set({
      isOpen: true,
      employee: user,
      step: 'choice'
    });
  }

  closeAssignModal(): void {
    this.assignmentModal.update(m => ({ ...m, isOpen: false }));
  }

  setModalStep(step: 'choice' | 'details' | 'reject'): void {
    this.assignmentModal.update(m => ({ ...m, step }));
  }

  handleConfirmAccept(): void {
    const user = this.currentUser();
    if (!user) return;
    this.dataService.assignJob(user.id, { ...this.jobDataForm, priority: 'Normal' as Job['priority'] });
    this.closeAssignModal();
  }

  handleRejectSubmit(): void {
    if (!this.rejectReasonValue.trim()) {
      alert("กรุณาระบุเหตุผลในการปฏิเสธงาน");
      return;
    }
    const user = this.currentUser();
    if (!user) return;
    this.dataService.rejectJob(user.id, this.rejectReasonValue);
    this.closeAssignModal();
    this.rejectReasonValue = '';
  }

  startJob(jobId: string): void {
    this.dataService.updateJobStatus(jobId, 'In Progress');
  }

  finishJob(jobId: string): void {
    this.dataService.updateJobStatus(jobId, 'Done');
  }

  getJobDuration(job: Job): string {
    const log = job.statusLogs?.find(l => l.status === 'In Progress');
    if (!log) return '-';
    return getDurationText(log.timestamp);
  }
}
