import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { JobService } from '../../services/job.service';
import { EmployeeService } from '../../services/employee.service';
import { AuthService } from '../../services/auth.service';
import { Employee, EmployeeDropdownItem } from '../../models/employee.model';
import { Job } from '../../models/job.model';
import { Category } from '../../models/category.model';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { BadgeComponent } from '../../shared/components/badge/badge.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { LoadingOverlayComponent } from '../../shared/components/loading-overlay/loading-overlay.component';
import { ErrorAlertComponent } from '../../shared/components/error-alert/error-alert.component';
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
    IconComponent,
    LoadingOverlayComponent,
    ErrorAlertComponent
  ],
  templateUrl: './my-tasks.component.html',
  styleUrls: ['./my-tasks.component.scss']
})
export class MyTasksComponent implements OnInit {
  currentEmployeeId = signal<string>('');
  loggedInEmployeeId = signal<string>(''); // Employee ID ของผู้ที่ login
  isAdmin = signal<boolean>(false); // ตรวจสอบว่าเป็น admin หรือไม่
  employees = signal<Employee[]>([]); // รายชื่อ employee ทั้งหมด (สำหรับ admin)
  employeeDropdownList = signal<EmployeeDropdownItem[]>([]);
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
  addTaskModal = signal({ 
    isOpen: false, 
    form: { 
      title: '', 
      customer: '', 
      description: '', 
      assigneeId: '', 
      priority: 'Normal' as 'Low' | 'Normal' | 'High' | 'Urgent' 
    } 
  });

  myJobs = computed(() => {
    const employeeId = this.currentEmployeeId();
    const allJobs = this.jobs();
    if (!employeeId) {
      console.log('⚠️ No currentEmployeeId');
      return [];
    }
    const filtered = allJobs.filter(j => j.assigneeId === employeeId);
    console.log(`👤 My jobs for employee ${employeeId}:`, filtered.length, 'out of', allJobs.length);
    return filtered;
  });

  // ชื่อ employee ที่กำลังดูอยู่ (สำหรับแสดงในหัวข้อ)
  currentEmployeeName = computed(() => {
    const employeeId = this.currentEmployeeId();
    const employee = this.employees().find(e => e.id === employeeId);
    return employee?.name || '';
  });

  // ตรวจสอบว่ากำลังดูงานของตัวเองหรือไม่
  isViewingSelf = computed(() => {
    return this.currentEmployeeId() === this.loggedInEmployeeId();
  });

  // Helper function to check if date is today
  private isToday(date: Date | string): boolean {
    const today = new Date();
    const compareDate = new Date(date);
    return compareDate.getDate() === today.getDate() &&
           compareDate.getMonth() === today.getMonth() &&
           compareDate.getFullYear() === today.getFullYear();
  }

  // Filter jobs to show only today's jobs
  todayJobs = computed(() => {
    const filtered = this.myJobs().filter(j => {
      const jobDate = j.createdAt || j.createdDate;
      const isJobToday = jobDate && this.isToday(jobDate);
      return isJobToday;
    });
    console.log('📅 Today jobs:', filtered.length, 'out of', this.myJobs().length);
    return filtered;
  });

  todoJobs = computed(() => {
    const allToday = this.todayJobs();
    const jobs = allToday.filter(j => j.status === 'Pending');
    console.log('📋 Todo jobs:', jobs.length);
    if (allToday.length > 0 && jobs.length === 0) {
      console.log('⚠️ Today jobs statuses:', allToday.map(j => ({ id: j.id, status: j.status })));
    }
    return jobs;
  });
  
  inProgressJobs = computed(() => {
    const jobs = this.todayJobs().filter(j => j.status === 'In Progress' || j.status === 'InProgress');
    console.log('⏳ In Progress jobs:', jobs.length);
    return jobs;
  });
  
  doneJobs = computed(() => {
    const jobs = this.todayJobs().filter(j => ['Done', 'Rejected'].includes(j.status));
    console.log('✅ Done jobs:', jobs.length);
    return jobs;
  });

  loading = signal(false);
  error = signal<string | null>(null);

  constructor(
    private jobService: JobService,
    private employeeService: EmployeeService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Get current user's employeeId from token and load their tasks
    // Employee list will be loaded inside based on role
    this.loadCurrentUserTasks();
  }

  loadCurrentUserTasks(): void {
    // ดึงข้อมูล user จาก AuthService
    const employeeId = this.authService.getCurrentEmployeeId();
    if (!employeeId) {
      this.error.set('ไม่พบข้อมูล Employee ID กรุณาเข้าสู่ระบบใหม่');
      return;
    }

    // ดึง roles และตรวจสอบว่าเป็น Admin หรือไม่
    const userRoles = this.authService.getCurrentUserRoles();
    const isAdminUser = this.authService.isAdmin();

    // ตั้งค่า state
    this.loggedInEmployeeId.set(employeeId);
    this.currentEmployeeId.set(employeeId);
    this.isAdmin.set(isAdminUser);

    console.log('🔐 User info:', { 
      employeeId, 
      employeeIdType: typeof employeeId,
      roles: userRoles, 
      isAdmin: isAdminUser 
    });

    // โหลดรายชื่อ employee ครั้งเดียว ใช้ทั้ง Admin Dropdown และ Add Task Modal
    this.loadEmployeeDropdownList();
    
    // Load tasks for current user
    this.loadMyTasks(employeeId);
  }

  // โหลดรายชื่อ employee จาก dropdown-list endpoint ครั้งเดียว
  // ใช้ทั้งสำหรับ Admin Dropdown และ Add Task Modal
  loadEmployeeDropdownList(): void {
    this.employeeService.getDropdownList({ status: 'Active' }).subscribe({
      next: (dropdownItems) => {
        // ตั้งค่าสำหรับ Add Task Modal
        this.employeeDropdownList.set(dropdownItems);
        
        // ถ้าเป็น Admin แปลงเป็น Employee[] สำหรับ Admin Dropdown
        if (this.isAdmin()) {
          const employees: Employee[] = dropdownItems.map(item => ({
            id: item.id,
            name: item.name,
            phone: '',
            status: 'Active' as const,
            positionId: '',
            positionName: item.positionName,
            departmentName: item.departmentName,
            avatar: undefined,
            createdDate: new Date().toISOString(),
            isDeleted: false
          }));
          this.employees.set(employees);
        }
      },
      error: (err) => {
        console.error('Error loading employee dropdown list:', err);
      }
    });
  }

  // เรียกเมื่อ admin เลือก employee อื่น
  onEmployeeSelected(employeeId: string): void {
    if (!this.isAdmin()) {
      return; // ถ้าไม่ใช่ admin ไม่อนุญาตให้เปลี่ยน
    }
    this.currentEmployeeId.set(employeeId);
    this.loadMyTasks(employeeId);
  }

  loadMyTasks(employeeId: string): void {
    if (!employeeId) return;
    
    this.loading.set(true);
    this.error.set(null);
    
    this.jobService.getMyTasks(employeeId).subscribe({
      next: (jobs) => {
        console.log('✅ Jobs loaded:', jobs);
        console.log('📊 Jobs count:', jobs.length);
        console.log('📅 Sample job:', jobs[0]);
        this.jobs.set(jobs);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('❌ Error loading tasks:', err);
        this.error.set('ไม่สามารถโหลดข้อมูลงานได้ กรุณาลองอีกครั้ง');
        this.loading.set(false);
      }
    });
  }

  handleStartClick(job: Job, event?: Event): void {
    console.log('🚀 Start button clicked for job:', job.id);
    if (event) {
      event.stopPropagation();
    }
    this.actionModal.set({ isOpen: true, job, step: 'choice', reason: '' });
    console.log('✅ Action modal opened:', this.actionModal());
  }

  handleConfirmStart(): void {
    console.log('✅ Confirm start clicked');
    const job = this.actionModal().job;
    if (!job) {
      console.log('❌ No job found in actionModal');
      return;
    }
    
    console.log('📤 Updating status to InProgress for job:', job.id);
    this.loading.set(true);
    this.jobService.updateStatus(job.id, 'InProgress').subscribe({
      next: (updatedJob) => {
        console.log('✅ Job updated successfully:', updatedJob);
        // Update the job in the list
        this.jobs.update(jobs => 
          jobs.map(j => j.id === updatedJob.id ? updatedJob : j)
        );
        this.closeActionModal();
        this.loading.set(false);
      },
      error: (err) => {
        console.error('❌ Error updating job status:', err);
        console.error('Error details:', err.error);
        alert('Failed to update job status. Please try again.');
        this.loading.set(false);
      }
    });
  }

  closeActionModal(): void {
    this.actionModal.update(m => ({ ...m, isOpen: false }));
  }

  setActionModalToReject(): void {
    this.actionModal.update(m => ({ ...m, step: 'reject' }));
  }

  resetActionModalToChoice(): void {
    this.actionModal.update(m => ({ ...m, step: 'choice' }));
  }

  updateActionModalReason(reason: string): void {
    this.actionModal.update(m => ({ ...m, reason }));
  }

  closeFinishModal(): void {
    this.finishModal.update(m => ({ ...m, isOpen: false }));
  }

  handleConfirmReject(): void {
    if (!this.actionModal().reason.trim()) {
      alert("กรุณาระบุเหตุผล");
      return;
    }
    const job = this.actionModal().job;
    if (!job) return;
    
    this.loading.set(true);
    this.jobService.updateStatus(job.id, 'Rejected', this.actionModal().reason).subscribe({
      next: (updatedJob) => {
        // Update the job in the list
        this.jobs.update(jobs => 
          jobs.map(j => j.id === updatedJob.id ? updatedJob : j)
        );
        this.closeActionModal();
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error updating job status:', err);
        alert('Failed to update job status. Please try again.');
        this.loading.set(false);
      }
    });
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
    
    this.loading.set(true);
    this.jobService.updateStatus(job.id, 'Done', undefined, this.finishModal().report).subscribe({
      next: (updatedJob) => {
        // Update the job in the list
        this.jobs.update(jobs => 
          jobs.map(j => j.id === updatedJob.id ? updatedJob : j)
        );
        this.closeFinishModal();
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error updating job status:', err);
        alert('Failed to save report. Please try again.');
        this.loading.set(false);
      }
    });
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
    const log = job.statusLogs?.find(l => l.status === 'In Progress' || l.status === 'InProgress');
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

  handleAddTask(): void {
    // Initialize form with current viewing employee as default assignee
    // ถ้าเป็น admin กำลังดูงานของคนอื่น ให้ default เป็นคนที่กำลังดูอยู่
    // ถ้าไม่ใช่ admin ใช้ตัวเอง
    const defaultAssigneeId = this.currentEmployeeId() || '';
    this.addTaskModal.set({
      isOpen: true,
      form: {
        title: '',
        customer: '',
        description: '',
        assigneeId: defaultAssigneeId,
        priority: 'Normal'
      }
    });
  }

  handleCloseAddTaskModal(): void {
    this.addTaskModal.set({ ...this.addTaskModal(), isOpen: false });
  }

  handleCreateTask(): void {
    const form = this.addTaskModal().form;
    
    // Validation
    if (!form.title.trim()) {
      alert('กรุณาระบุชื่องาน');
      return;
    }
    if (!form.customer.trim()) {
      alert('กรุณาระบุชื่อลูกค้า');
      return;
    }
    if (!form.assigneeId) {
      alert('กรุณาเลือกผู้รับผิดชอบ');
      return;
    }

    this.loading.set(true);
    this.jobService.createTask({
      title: form.title.trim(),
      customer: form.customer.trim(),
      description: form.description.trim(),
      assigneeId: form.assigneeId,
      priority: form.priority
    }).subscribe({
      next: (newJob) => {
        // ถ้างานที่สร้างเป็นของ employee ที่กำลังดูอยู่ ให้เพิ่มเข้าไปใน list
        if (newJob.assigneeId === this.currentEmployeeId()) {
          this.jobs.update(jobs => [...jobs, newJob]);
        }
        
        // Close modal and reset form
        this.addTaskModal.set({
          isOpen: false,
          form: {
            title: '',
            customer: '',
            description: '',
            assigneeId: this.currentEmployeeId() || '',
            priority: 'Normal'
          }
        });
        this.loading.set(false);
        
        // แสดงข้อความสำเร็จ
        alert('สร้างงานสำเร็จ');
      },
      error: (err) => {
        console.error('Error creating task:', err);
        alert('ไม่สามารถสร้างงานได้ กรุณาลองอีกครั้ง');
        this.loading.set(false);
      }
    });
  }

  updateAddTaskForm(field: 'title' | 'customer' | 'description' | 'assigneeId' | 'priority', value: any): void {
    this.addTaskModal.update(modal => ({
      ...modal,
      form: { ...modal.form, [field]: value }
    }));
  }
}

