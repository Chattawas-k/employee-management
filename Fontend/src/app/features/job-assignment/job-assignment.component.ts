import { ChangeDetectionStrategy, Component, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { JobAssignmentCardComponent, StaffMember } from '../../shared/components/job-assignment-card/job-assignment-card.component';
import { OpenJobDialogComponent } from '../../shared/components/open-job-dialog/open-job-dialog.component';
import { EmployeeService } from '../../services/employee.service';
import { TaskService } from '../../services/task.service';
import { QueueService } from '../../services/queue.service';
import { SignalRService } from '../../services/signalr.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { JobPriority } from '../../models/task.model';
import { catchError, finalize } from 'rxjs/operators';
import { forkJoin, of } from 'rxjs';
import { EmployeeDropdownDto } from '../../models/employee.model';
import { QueueDto } from '../../models/queue.model';
import { QueueSummaryResponse } from '../../models/queue.model';
import { getEmployeeIdFromToken } from '../../utils/jwt.util';

@Component({
  selector: 'app-job-assignment',
  standalone: true,
  templateUrl: './job-assignment.component.html',
  styleUrls: ['./job-assignment.component.scss'],
  imports: [CommonModule, FormsModule, JobAssignmentCardComponent, OpenJobDialogComponent],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JobAssignmentComponent implements OnInit, OnDestroy {
  searchTerm = signal('');
  isLoading = signal(false);
  activeTab = signal<'all' | 'available' | 'busy' | 'break' | 'unavailable' | 'notworking'>('all');

  showAssignDialog = signal(false);
  selectedStaff = signal<StaffMember | null>(null);

  staffMembers = signal<StaffMember[]>([]);

  private currentEmployeeId: string | null = null;

  constructor(
    private employeeService: EmployeeService,
    private taskService: TaskService,
    private queueService: QueueService,
    private signalRService: SignalRService,
    private authService: AuthService,
    private toastService: ToastService
  ) {
    // Get current employee ID from token
    const token = this.authService.getToken();
    this.currentEmployeeId = getEmployeeIdFromToken(token);
  }

  async ngOnInit(): Promise<void> {
    await this.setupSignalR();
    this.loadEmployees();
  }

  ngOnDestroy(): void {
    // SignalR cleanup is handled by the service
  }

  private async setupSignalR(): Promise<void> {
    try {
      await this.signalRService.startConnection();
      this.signalRService.onQueueUpdated(() => {
        this.loadEmployees();
      });
      this.signalRService.onJobStatusChanged(() => {
        this.loadEmployees();
      });
      this.signalRService.onEmployeeStatusChanged(() => {
        this.loadEmployees();
      });
    } catch (error) {
      console.error('Failed to setup SignalR:', error);
    }
  }

  loadEmployees(): void {
    this.isLoading.set(true);
    const today = new Date();

    forkJoin({
      employees: this.employeeService.getAllEmployees('Active').pipe(
        catchError(error => {
          console.error('Error loading employees:', error);
          this.toastService.error('เกิดข้อผิดพลาดในการโหลดข้อมูลพนักงาน');
          return of([]);
        })
      ),
      queues: this.queueService.getQueuesByDate(today).pipe(
        catchError(error => {
          console.error('Error loading queues:', error);
          // Continue even if queue data fails
          return of([]);
        })
      ),
      jobSummary: this.queueService.getQueueSummary(today).pipe(
        catchError(error => {
          console.error('Error loading job summary:', error);
          // Continue even if job summary fails
          return of({ jobs: [] });
        })
      )
    }).pipe(
      finalize(() => this.isLoading.set(false))
    ).subscribe(({ employees, queues, jobSummary }: { employees: EmployeeDropdownDto[]; queues: QueueDto[]; jobSummary: QueueSummaryResponse }) => {
      // Create maps for quick lookup
      const queueMap = new Map<string, QueueDto>();
      queues.forEach((queue: QueueDto) => {
        queueMap.set(queue.employeeId, queue);
      });

      // Count jobs by status per employee
      const pendingJobCountMap = new Map<string, number>();
      const inProgressJobCountMap = new Map<string, number>();
      const totalJobCountMap = new Map<string, number>();
      
      jobSummary.jobs.forEach((job: any) => {
        const status = job.status?.toString().toLowerCase() || '';
        const assigneeId = job.assigneeId;
        
        // Count total jobs per employee
        const currentTotal = totalJobCountMap.get(assigneeId) || 0;
        totalJobCountMap.set(assigneeId, currentTotal + 1);
        
        // Count by status - handle both enum values and string values
        if (status === 'pending' || status === '1') {
          const currentPending = pendingJobCountMap.get(assigneeId) || 0;
          pendingJobCountMap.set(assigneeId, currentPending + 1);
        } else if (status === 'inprogress' || status === 'in_progress' || status === '2') {
          const currentInProgress = inProgressJobCountMap.get(assigneeId) || 0;
          inProgressJobCountMap.set(assigneeId, currentInProgress + 1);
        }
      });

      // Get current employee ID from token each time to ensure it's up-to-date
      // This is important because the token might change or the component might be reused
      const token = this.authService.getToken();
      const currentEmpId = getEmployeeIdFromToken(token);
      
      // Map employees to StaffMember with real data
      const staffMembers: StaffMember[] = employees.map((emp: EmployeeDropdownDto) => {
        const queue = queueMap.get(emp.id);
        const pendingTasks = pendingJobCountMap.get(emp.id) || 0;
        const currentTasks = inProgressJobCountMap.get(emp.id) || 0;
        const totalTasks = totalJobCountMap.get(emp.id) || 0;
        
        // Use AvailabilityStatus from backend (stored in database)
        const availabilityStatus = queue?.availabilityStatus || null;
        
        // Map availability status to UI status
        const { status, statusClass } = this.mapAvailabilityStatusToUIStatus(availabilityStatus);
        
        const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}&background=6366f1&color=fff&size=128`;
        
        return {
          name: emp.name,
          role: emp.positionName || 'ไม่ระบุตำแหน่ง',
          avatarUrl,
          status,
          statusClass,
          pendingTasks,
          currentTasks,
          totalTasks,
          queuePosition: queue?.position || 0,
          employeeId: emp.id,
          queueStatus: (queue?.status as 'Active' | 'Busy' | 'Inactive') || undefined
        };
      });

      this.staffMembers.set(staffMembers);
    });
  }

  private mapAvailabilityStatusToUIStatus(
    availabilityStatus: 'available' | 'busy' | 'break' | 'unavailable' | 'notworking' | 'Available' | 'Busy' | 'Break' | 'Unavailable' | 'NotWorking' | null
  ): { status: StaffMember['status']; statusClass: string } {
    if (!availabilityStatus) {
      return {
        status: 'ไม่พร้อมรับงาน',
        statusClass: 'bg-gray-100 text-gray-800'
      };
    }

    // Normalize to lowercase for comparison (backend sends camelCase)
    const normalizedStatus = availabilityStatus.toLowerCase();

    switch (normalizedStatus) {
      case 'available':
        return {
          status: 'พร้อมรับงาน',
          statusClass: 'bg-green-100 text-green-800'
        };
      case 'busy':
        return {
          status: 'ติดลูกค้า',
          statusClass: 'bg-orange-100 text-orange-800'
        };
      case 'break':
        return {
          status: 'พัก',
          statusClass: 'bg-yellow-100 text-yellow-800'
        };
      case 'unavailable':
        return {
          status: 'ไม่พร้อมรับงาน',
          statusClass: 'bg-gray-100 text-gray-800'
        };
      case 'notworking':
        return {
          status: 'ไม่ได้ทำงาน',
          statusClass: 'bg-red-100 text-red-800'
        };
      default:
        return {
          status: 'ไม่พร้อมรับงาน',
          statusClass: 'bg-gray-100 text-gray-800'
        };
    }
  }

  // Filter staff by search term
  searchedStaff = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) {
      return this.staffMembers();
    }
    return this.staffMembers().filter(staff =>
      staff.name.toLowerCase().includes(term) ||
      staff.role.toLowerCase().includes(term)
    );
  });

  // Filter staff by active tab
  filteredStaff = computed(() => {
    const staff = this.searchedStaff();
    const tab = this.activeTab();
    
    if (tab === 'all') {
      return staff;
    }
    
    return staff.filter(s => {
      switch (tab) {
        case 'available':
          return s.status === 'พร้อมรับงาน';
        case 'busy':
          return s.status === 'ติดลูกค้า';
        case 'break':
          return s.status === 'พัก';
        case 'unavailable':
          return s.status === 'ไม่พร้อมรับงาน';
        case 'notworking':
          return s.status === 'ไม่ได้ทำงาน';
        default:
          return true;
      }
    });
  });

  // Count staff by status
  staffCounts = computed(() => {
    const staff = this.searchedStaff();
    return {
      all: staff.length,
      available: staff.filter(s => s.status === 'พร้อมรับงาน').length,
      busy: staff.filter(s => s.status === 'ติดลูกค้า').length,
      break: staff.filter(s => s.status === 'พัก').length,
      unavailable: staff.filter(s => s.status === 'ไม่พร้อมรับงาน').length,
      notworking: staff.filter(s => s.status === 'ไม่ได้ทำงาน').length
    };
  });

  setTab(tab: 'all' | 'available' | 'busy' | 'break' | 'unavailable' | 'notworking') {
    this.activeTab.set(tab);
  }

  handleAction(staff: StaffMember) {
    // Allow assignment only if status is "พร้อมรับงาน"
    if (staff.status === 'พร้อมรับงาน') {
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
