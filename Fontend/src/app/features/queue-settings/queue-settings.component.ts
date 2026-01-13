import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QueueService } from '../../services/queue.service';
import { EmployeeService } from '../../services/employee.service';
import { QueueDto } from '../../models/queue.model';
import { EmployeeDropdownDto } from '../../models/employee.model';
import { EditQueueOrderDialogComponent } from '../../shared/components/edit-queue-order-dialog/edit-queue-order-dialog.component';
import { ToastService } from '../../services/toast.service';
import { catchError, finalize } from 'rxjs/operators';
import { of, forkJoin, Observable } from 'rxjs';

@Component({
  selector: 'app-queue-settings',
  standalone: true,
  imports: [CommonModule, EditQueueOrderDialogComponent],
  templateUrl: './queue-settings.component.html',
  styleUrls: ['./queue-settings.component.scss']
})
export class QueueSettingsComponent implements OnInit {
  activeTab = signal<'current' | 'past'>('current');
  currentQueues = signal<QueueDto[]>([]);
  pastQueues = signal<QueueDto[]>([]);
  isLoading = signal(false);
  selectedDate = signal<Date>(new Date());
  showEditDialog = signal(false);

  constructor(
    private queueService: QueueService,
    private employeeService: EmployeeService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadCurrentQueues();
  }

  onDateSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.value) {
      this.selectedDate.set(new Date(target.value));
      if (this.activeTab() === 'past') {
        this.loadPastQueues();
      }
    }
  }

  loadCurrentQueues(): void {
    this.isLoading.set(true);
    const today = new Date();
    this.queueService.getQueuesByDate(today).pipe(
      catchError(error => {
        console.error('Error loading queues:', error);
        this.toastService.error('เกิดข้อผิดพลาดในการโหลดข้อมูลคิว');
        return of([]);
      }),
      finalize(() => this.isLoading.set(false))
    ).subscribe(queues => {
      this.currentQueues.set(queues);
    });
  }

  setTab(tab: 'current' | 'past'): void {
    // Always reload data when clicking tab, even if it's the same tab
    if (tab === 'current') {
      this.activeTab.set(tab);
      this.loadCurrentQueues();
    } else {
      this.activeTab.set(tab);
      this.loadPastQueues();
    }
  }

  loadPastQueues(): void {
    this.isLoading.set(true);
    const date = this.selectedDate();
    this.queueService.getQueuesByDate(date).pipe(
      catchError(error => {
        console.error('Error loading past queues:', error);
        return of([]);
      }),
      finalize(() => this.isLoading.set(false))
    ).subscribe(queues => {
      this.pastQueues.set(queues);
    });
  }

  getEmployeeDisplayName(employeeName: string): { thai: string; english?: string } {
    // Try to extract English name from parentheses if exists
    const match = employeeName.match(/^(.+?)\s*\((.+?)\)$/);
    if (match) {
      return { thai: match[1].trim(), english: match[2].trim() };
    }
    return { thai: employeeName };
  }

  getAvatarUrl(employeeId: string, employeeName: string): string {
    // Use first letter of name as fallback
    const initial = employeeName.charAt(0).toUpperCase();
    // For now, use a placeholder. In the future, we can add avatar to GetByDateResponse
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(employeeName)}&background=random&size=128`;
  }

  getInitial(employeeName: string): string {
    return employeeName.charAt(0).toUpperCase();
  }

  openEditDialog(): void {
    this.showEditDialog.set(true);
  }

  closeEditDialog(): void {
    this.showEditDialog.set(false);
  }

  saveQueueOrder(payload: { queues: QueueDto[]; deletedQueueIds: string[] }): void {
    this.isLoading.set(true);
    const updatedQueues = payload.queues;
    const deletedQueueIds = payload.deletedQueueIds ?? [];
    
    // Separate existing queues and new queues (temp IDs)
    const existingQueues = updatedQueues
      .filter(q => !q.id.startsWith('temp-'))
      .filter(q => !deletedQueueIds.includes(q.id));
    const newQueues = updatedQueues.filter(q => q.id.startsWith('temp-'));

    // Prepare update requests for existing queues
    const updateRequests = existingQueues.map(queue => ({
      id: queue.id,
      position: queue.position,
      status: queue.status
    }));

    // Create new queues for employees that don't exist yet
    const createRequests = newQueues.map(queue => ({
      employeeId: queue.employeeId,
      position: queue.position,
      status: 'Active' as 'Active' | 'Busy' | 'Inactive',
      queueDate: queue.queueDate
    }));

    // Execute updates and creates
    const operations: Observable<any>[] = [];

    if (updateRequests.length > 0 || deletedQueueIds.length > 0) {
      operations.push(this.queueService.bulkUpdateQueues({ queues: updateRequests, deletedQueueIds }));
    }

    if (createRequests.length > 0) {
      const createOperations = createRequests.map(req => 
        this.queueService.createQueue(req)
      );
      operations.push(...createOperations);
    }

    if (operations.length === 0) {
      this.isLoading.set(false);
      return;
    }

    forkJoin(operations).pipe(
      catchError(error => {
        console.error('Error saving queue order:', error);
        this.toastService.error('เกิดข้อผิดพลาดในการบันทึกลำดับคิว');
        return of(null);
      }),
      finalize(() => {
        this.isLoading.set(false);
      })
    ).subscribe(response => {
      if (response) {
        this.toastService.success('บันทึกลำดับคิวสำเร็จ');
        this.closeEditDialog();
        // Reload data to reflect changes
        this.loadCurrentQueues();
      }
    });
  }

  // Deletion is staged in the edit dialog and applied on Save via bulk update (single API call).

  addEmployeeToQueue(employeeIds: string[]): void {
    if (!employeeIds || employeeIds.length === 0) {
      return;
    }

    // Get employee details
    this.employeeService.getAllEmployees('Active').pipe(
      catchError(error => {
        console.error('Error loading employees:', error);
        this.toastService.error('เกิดข้อผิดพลาดในการโหลดข้อมูลพนักงาน');
        return of([]);
      })
    ).subscribe(employees => {
      // Create temporary QueueDto for new employees
      const currentQueues = this.currentQueues();
      const maxPosition = currentQueues.length > 0 
        ? Math.max(...currentQueues.map(q => q.position))
        : 0;

      const newQueues: QueueDto[] = employeeIds.map((employeeId, index) => {
        const employee = employees.find(emp => emp.id === employeeId);
        return {
          id: `temp-${employeeId}-${Date.now()}-${index}`, // Temporary ID
          employeeId: employeeId,
          employeeName: employee?.name || 'ไม่ระบุชื่อ',
          positionName: employee?.positionName,
          departmentName: employee?.departmentName,
          position: maxPosition + index + 1, // Add to end
          status: 'Active',
          availabilityStatus: 'Available' as const,
          queueDate: new Date().toISOString().split('T')[0]
        };
      });

      // Update current queues with new employees
      const updatedQueues = [...currentQueues, ...newQueues];
      this.currentQueues.set(updatedQueues);
      
      // Update edit dialog if open
      if (this.showEditDialog()) {
        // The edit dialog will pick up the changes via @Input binding
        this.toastService.success(`เพิ่มพนักงาน ${employeeIds.length} คนเข้าไปในคิวแล้ว`);
      }
    });
  }

  getCurrentQueueDate(): Date {
    return new Date(); // Always use today for current queue
  }
}

