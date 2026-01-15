import { Component, Input, Output, EventEmitter, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmployeeDropdownDto } from '../../../models/employee.model';
import { QueueDto } from '../../../models/queue.model';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { StaffService } from '../../../services/staff.service';

@Component({
  selector: 'app-add-employee-to-queue-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-employee-to-queue-dialog.component.html',
  styleUrls: ['./add-employee-to-queue-dialog.component.scss']
})
export class AddEmployeeToQueueDialogComponent implements OnInit {
  @Input() currentQueues: QueueDto[] = [];
  @Input() queueDate: Date = new Date();
  @Output() close = new EventEmitter<void>();
  @Output() add = new EventEmitter<string[]>();

  availableEmployees = signal<EmployeeDropdownDto[]>([]);
  selectedEmployeeIds = signal<Set<string>>(new Set());
  isLoading = signal(false);
  searchText = signal<string>('');

  constructor(private staffService: StaffService) {}

  ngOnInit(): void {
    this.loadAvailableEmployees();
  }

  loadAvailableEmployees(): void {
    this.isLoading.set(true);
    // Show only employees who have login and are Basic-only.
    // Using /admin/staff ensures "has login"; basicOnly=true ensures role filter.
    this.staffService.getStaffList({ basicOnly: true }).pipe(
      catchError(error => {
        console.error('Error loading employees:', error);
        return of({ staff: [] });
      }),
      finalize(() => this.isLoading.set(false))
    ).subscribe(res => {
      const staff = (res?.staff ?? []).filter(s => s.accountStatus === 'active');
      const employees: EmployeeDropdownDto[] = staff.map(s => ({
        id: s.staffId,
        name: s.fullName,
        positionName: s.position || undefined,
      }));

      // Filter out employees that are already in the queue
      const queueEmployeeIds = new Set(this.currentQueues.map(q => q.employeeId.toLowerCase()));
      const available = employees.filter(emp => 
        !queueEmployeeIds.has(emp.id.toLowerCase())
      );
      this.availableEmployees.set(available);
    });
  }

  getInitial(employeeName: string): string {
    return employeeName.charAt(0).toUpperCase();
  }

  toggleEmployeeSelection(employeeId: string): void {
    const selected = new Set(this.selectedEmployeeIds());
    if (selected.has(employeeId)) {
      selected.delete(employeeId);
    } else {
      selected.add(employeeId);
    }
    this.selectedEmployeeIds.set(selected);
  }

  isEmployeeSelected(employeeId: string): boolean {
    return this.selectedEmployeeIds().has(employeeId);
  }

  onAdd(): void {
    const selectedIds = Array.from(this.selectedEmployeeIds());
    if (selectedIds.length === 0) {
      return;
    }
    // Emit array of employee IDs and close dialog
    this.add.emit(selectedIds);
    // Close this dialog (will return to edit dialog)
    this.close.emit();
  }

  onCancel(): void {
    // Close this dialog (will return to edit dialog)
    this.close.emit();
  }

  getSelectedCount(): number {
    return this.selectedEmployeeIds().size;
  }

  // Filtered employees based on search text
  filteredEmployees = computed(() => {
    const search = this.searchText().toLowerCase().trim();
    if (!search) {
      return this.availableEmployees();
    }
    
    return this.availableEmployees().filter(emp => {
      // Search in full name (which may contain both first and last name)
      const name = emp.name.toLowerCase();
      // Split name into parts to search in first name and last name separately
      const nameParts = name.split(/\s+/);
      return name.includes(search) || nameParts.some(part => part.includes(search));
    });
  });

  // Check if all filtered employees are selected
  areAllFilteredSelected = computed(() => {
    const filtered = this.filteredEmployees();
    if (filtered.length === 0) return false;
    return filtered.every(emp => this.selectedEmployeeIds().has(emp.id));
  });

  onSearchChange(value: string): void {
    this.searchText.set(value);
  }

  toggleSelectAll(): void {
    const filtered = this.filteredEmployees();
    const selected = new Set(this.selectedEmployeeIds());
    
    if (this.areAllFilteredSelected()) {
      // Deselect all filtered employees
      filtered.forEach(emp => selected.delete(emp.id));
    } else {
      // Select all filtered employees
      filtered.forEach(emp => selected.add(emp.id));
    }
    
    this.selectedEmployeeIds.set(selected);
  }
}

