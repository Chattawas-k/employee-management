import { ChangeDetectionStrategy, Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { JobAssignmentCardComponent, StaffMember } from '../../shared/components/job-assignment-card/job-assignment-card.component';
import { OpenJobDialogComponent } from '../../shared/components/open-job-dialog/open-job-dialog.component';
import { EmployeeService } from '../../services/employee.service';
import { TaskService } from '../../services/task.service';
import { ToastService } from '../../services/toast.service';
import { JobPriority } from '../../models/task.model';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-job-assignment',
  standalone: true,
  templateUrl: './job-assignment.component.html',
  styleUrls: ['./job-assignment.component.scss'],
  imports: [CommonModule, FormsModule, JobAssignmentCardComponent, OpenJobDialogComponent],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JobAssignmentComponent implements OnInit {
  searchTerm = signal('');
  isLoading = signal(false);

  showAssignDialog = signal(false);
  selectedStaff = signal<StaffMember | null>(null);

  staffMembers = signal<StaffMember[]>([]);

  constructor(
    private employeeService: EmployeeService,
    private taskService: TaskService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadEmployees();
  }

  loadEmployees(): void {
    this.isLoading.set(true);
    this.employeeService.getAllEmployees('Active').pipe(
      catchError(error => {
        console.error('Error loading employees:', error);
        this.toastService.error('เกิดข้อผิดพลาดในการโหลดข้อมูลพนักงาน');
        return of([]);
      }),
      finalize(() => this.isLoading.set(false))
    ).subscribe(employees => {
      const staffMembers: StaffMember[] = employees.map(emp => {
        const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}&background=random&size=200`;
        return {
          name: emp.name,
          role: emp.positionName || 'ไม่ระบุตำแหน่ง',
          avatarUrl,
          status: 'พร้อมรับงาน' as const,
          statusClass: 'bg-green-100 text-green-800',
          currentTasks: 0,
          queuePosition: 0,
          employeeId: emp.id
        };
      });
      this.staffMembers.set(staffMembers);
    });
  }

  filteredStaff = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) {
      return this.staffMembers();
    }
    return this.staffMembers().filter(staff =>
      staff.name.toLowerCase().includes(term) ||
      staff.role.toLowerCase().includes(term)
    );
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
    if (!staff || !staff.employeeId) {
      this.toastService.error('ไม่พบข้อมูลพนักงาน');
      this.closeAssignDialog();
      return;
    }

    let priority: JobPriority = JobPriority.Normal;
    if (jobData.priority === 'Urgent') {
      priority = JobPriority.Urgent;
    } else if (jobData.priority === 'High') {
      priority = JobPriority.High;
    } else if (jobData.priority === 'Low') {
      priority = JobPriority.Low;
    }

    const createJobRequest = {
      title: jobData.jobTitle || 'Walk-in Customer',
      customer: jobData.customerName || 'ลูกค้าทั่วไป',
      description: jobData.details || 'บริการลูกค้าหน้าร้าน',
      assigneeId: staff.employeeId,
      priority: priority
    };

    this.isLoading.set(true);
    this.taskService.createJob(createJobRequest).pipe(
      catchError(error => {
        console.error('Error creating job:', error);
        this.toastService.error('เกิดข้อผิดพลาดในการสร้างงาน');
        return of(null);
      }),
      finalize(() => {
        this.isLoading.set(false);
        this.closeAssignDialog();
      })
    ).subscribe(response => {
      if (response) {
        this.toastService.success('มอบหมายงานสำเร็จ');
        // Reload employees to get updated data
        setTimeout(() => {
          this.loadEmployees();
        }, 500);
      }
    });
  }
}
