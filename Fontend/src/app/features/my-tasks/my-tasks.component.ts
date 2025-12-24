import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { Employee } from '../../models/employee.model';
import { Job } from '../../models/job.model';
import { Category } from '../../models/category.model';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { BadgeComponent } from '../../shared/components/badge/badge.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { formatDateThai, getDurationText } from '../../utils/date.utils';

@Component({
  selector: 'app-my-tasks',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ModalComponent,
    ButtonComponent,
    BadgeComponent,
    IconComponent
  ],
  templateUrl: './my-tasks.component.html',
  styleUrls: ['./my-tasks.component.scss']
})
export class MyTasksComponent implements OnInit {
  currentViewerId = signal<string>('');
  employees = signal<Employee[]>([]);
  jobs = signal<Job[]>([]);
  categories = signal<Category[]>([]);
  viewJobModal = signal<Job | null>(null);
  actionModal = signal({ isOpen: false, job: null as Job | null, step: 'choice' as 'choice' | 'reject', reason: '' });
  finishModal = signal({ 
    isOpen: false, 
    job: null as Job | null, 
    report: { 
      customerName: '', 
      customerContact: '', 
      salesStatus: 'success' as 'success' | 'failed' | 'pending', 
      reasons: [] as string[], 
      productCategory: '', 
      description: '' 
    } 
  });

  currentUser = computed(() => {
    return this.employees().find(e => e.id === this.currentViewerId()) || this.employees()[0];
  });

  myJobs = computed(() => {
    const user = this.currentUser();
    if (!user) return [];
    return this.jobs().filter(j => j.assignee === user.name);
  });

  todoJobs = computed(() => this.myJobs().filter(j => j.status === 'Pending'));
  inProgressJobs = computed(() => this.myJobs().filter(j => j.status === 'In Progress'));
  doneJobs = computed(() => this.myJobs().filter(j => ['Done', 'Rejected'].includes(j.status)));

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
    this.dataService.categories$.subscribe(cats => {
      this.categories.set(cats);
      if (cats.length > 0 && !this.finishModal().report.productCategory) {
        this.finishModal.update(m => ({
          ...m,
          report: { ...m.report, productCategory: cats[0].name }
        }));
      }
    });
  }

  handleStartClick(job: Job, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.actionModal.set({ isOpen: true, job, step: 'choice', reason: '' });
  }

  handleConfirmStart(): void {
    const job = this.actionModal().job;
    if (!job) return;
    this.dataService.updateJobStatus(job.id, 'In Progress');
    this.actionModal.set({ ...this.actionModal(), isOpen: false });
  }

  handleConfirmReject(): void {
    if (!this.actionModal().reason.trim()) {
      alert("กรุณาระบุเหตุผล");
      return;
    }
    const job = this.actionModal().job;
    if (!job) return;
    this.dataService.updateJobStatus(job.id, 'Rejected', this.actionModal().reason);
    this.actionModal.set({ ...this.actionModal(), isOpen: false });
  }

  handleFinishClick(job: Job, event: Event): void {
    event.stopPropagation();
    const defaultCategory = this.categories().length > 0 ? this.categories()[0].name : '';
    this.finishModal.set({
      isOpen: true,
      job,
      report: {
        customerName: job.customer,
        customerContact: '',
        salesStatus: 'success',
        reasons: [],
        productCategory: defaultCategory,
        description: ''
      }
    });
  }

  handleReportChange(field: string, value: any): void {
    this.finishModal.update(m => ({
      ...m,
      report: { ...m.report, [field]: value }
    }));
  }

  toggleReason(reason: string): void {
    this.finishModal.update(m => {
      const currentReasons = m.report.reasons;
      const newReasons = currentReasons.includes(reason)
        ? currentReasons.filter(r => r !== reason)
        : [...currentReasons, reason];
      return {
        ...m,
        report: { ...m.report, reasons: newReasons }
      };
    });
  }

  handleSaveReport(): void {
    if (!this.finishModal().report.customerName) {
      alert("กรุณาระบุชื่อลูกค้า");
      return;
    }
    const job = this.finishModal().job;
    if (!job) return;
    this.dataService.updateJobStatus(job.id, 'Done', this.finishModal().report);
    this.finishModal.set({ ...this.finishModal(), isOpen: false });
  }

  handleViewDetails(job: Job): void {
    this.viewJobModal.set(job);
  }

  getReasonOptions(status: string): string[] {
    switch(status) {
      case 'success': return ['ราคาคุ้มค่า', 'สินค้าคุณภาพดี', 'บริการประทับใจ', 'โปรโมชั่นน่าสนใจ', 'สินค้าตรงความต้องการ'];
      case 'failed': return ['ราคาสูงเกินไป', 'คู่แข่งข้อเสนอดีกว่า', 'ยังไม่พร้อมซื้อ', 'สินค้าไม่ตรงความต้องการ', 'ไม่มีของในสต็อก'];
      case 'pending': return ['รอตัดสินใจ', 'รอปรึกษาครอบครัว', 'รอบงบประมาณ', 'เปรียบเทียบราคา', 'ขอข้อมูลเพิ่มเติม'];
      default: return [];
    }
  }

  getJobDuration(job: Job): string {
    const log = job.statusLogs?.find(l => l.status === 'In Progress');
    if (!log) return '-';
    return getDurationText(log.timestamp);
  }

  getTotalDuration(job: Job): string | null {
    if (job.status !== 'Done' || !job.statusLogs) return null;
    const startLog = job.statusLogs.find(l => l.status === 'In Progress') || job.statusLogs[0];
    const endLog = job.statusLogs.find(l => l.status === 'Done');
    if (startLog && endLog) {
      return getDurationText(startLog.timestamp, new Date(endLog.timestamp));
    }
    return null;
  }

  formatDateThai = formatDateThai;
}

