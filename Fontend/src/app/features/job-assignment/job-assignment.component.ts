import { ChangeDetectionStrategy, Component, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject, switchMap, catchError, finalize, of } from 'rxjs';
import { JobAssignmentCardComponent, StaffMember } from '../../shared/components/job-assignment-card/job-assignment-card.component';
import { OpenJobDialogComponent } from '../../shared/components/open-job-dialog/open-job-dialog.component';
import { JobFormData, JobPriority } from '../../models/task.model';
import { GetJobAssignmentListResponse } from '../../models/employee.model';
import { EmployeeService } from '../../services/employee.service';
import { TaskService } from '../../services/task.service';
import { ToastService } from '../../services/toast.service';
import { LoggerService } from '../../services/logger.service';

@Component({
  selector: 'app-job-assignment',
  standalone: true,
  templateUrl: './job-assignment.component.html',
  styleUrls: ['./job-assignment.component.scss'],
  imports: [CommonModule, FormsModule, JobAssignmentCardComponent, OpenJobDialogComponent],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JobAssignmentComponent implements OnInit {
  private employeeService = inject(EmployeeService);
  private taskService = inject(TaskService);
  private toastService = inject(ToastService);
  private logger = inject(LoggerService);

  searchTerm = signal('');
  private searchSubject = new Subject<string>();

  showAssignDialog = signal(false);
  selectedStaff = signal<StaffMember | null>(null);
  isLoading = signal(false);
  staffMembers = signal<StaffMember[]>([]);

  filteredStaff = computed(() => {
    // Since we're using API search, we can just return all staff members
    // The API already handles filtering
    return this.staffMembers();
  });

  ngOnInit(): void {
    this.loadStaffMembers();

    // Setup search with debounce
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(keyword => {
        this.isLoading.set(true);
        return this.employeeService.getJobAssignmentList(keyword || undefined).pipe(
          catchError(error => {
            this.logger.error('Error loading staff members:', error);
            this.toastService.error('ไม่สามารถโหลดข้อมูลพนักงานได้');
            return of([]);
          }),
          finalize(() => this.isLoading.set(false))
        );
      })
    ).subscribe(staff => {
      this.staffMembers.set(this.mapToStaffMember(staff));
    });
  }

  onSearchChange(): void {
    this.searchSubject.next(this.searchTerm());
  }

  loadStaffMembers(): void {
    this.isLoading.set(true);
    this.employeeService.getJobAssignmentList().pipe(
      catchError(error => {
        this.logger.error('Error loading staff members:', error);
        this.toastService.error('ไม่สามารถโหลดข้อมูลพนักงานได้');
        return of([]);
      }),
      finalize(() => this.isLoading.set(false))
    ).subscribe(staff => {
      this.staffMembers.set(this.mapToStaffMember(staff));
    });
  }

  private mapToStaffMember(apiResponse: GetJobAssignmentListResponse[]): StaffMember[] {
    return apiResponse.map(item => ({
      id: item.id,
      name: item.name,
      role: item.role,
      avatarUrl: item.avatarUrl,
      status: item.status,
      statusClass: item.statusClass,
      currentTasks: item.currentTasks,
      queuePosition: item.queuePosition
    }));
  }

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

  confirmAssignment(jobData: Partial<JobFormData>) {
    const staff = this.selectedStaff();
    if (!staff || !staff.id || !jobData.jobTitle || !jobData.customerName) {
      this.toastService.error('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    // Map priority string to JobPriority enum
    const priorityMap: Record<string, JobPriority> = {
      'Low': JobPriority.Low,
      'Normal': JobPriority.Normal,
      'High': JobPriority.High,
      'Urgent': JobPriority.Urgent
    };

    const createRequest = {
      title: jobData.jobTitle,
      customer: jobData.customerName,
      description: jobData.details || '',
      assigneeId: staff.id,
      priority: priorityMap[jobData.priority || 'Normal'] || JobPriority.Normal
    };

    this.isLoading.set(true);
    this.taskService.createJob(createRequest).pipe(
      catchError(error => {
        this.logger.error('Error creating job:', error);
        this.toastService.error('ไม่สามารถมอบหมายงานได้');
        return of(null);
      }),
      finalize(() => {
        this.isLoading.set(false);
        this.closeAssignDialog();
      })
    ).subscribe(response => {
      if (response) {
        this.toastService.success('มอบหมายงานสำเร็จ');
        // Reload staff members to get updated task counts
        this.loadStaffMembers();
      }
    });
  }
}
