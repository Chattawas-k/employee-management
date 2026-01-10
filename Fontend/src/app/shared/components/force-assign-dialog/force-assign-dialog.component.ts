import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { EmployeeService } from '../../../services/employee.service';
import { EmployeeDropdownDto } from '../../../models/employee.model';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-force-assign-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './force-assign-dialog.component.html',
  styleUrls: ['./force-assign-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ForceAssignDialogComponent implements OnInit {
  @Input() jobId: string = '';
  @Input() jobNumber: string = '';
  @Input() currentAssignee?: string;
  @Output() confirm = new EventEmitter<{ jobId: string; staffId: string; reason?: string }>();
  @Output() close = new EventEmitter<void>();

  assignForm!: ReturnType<FormBuilder['group']>;
  staffOptions: EmployeeDropdownDto[] = [];
  isLoadingStaff = false;

  constructor(
    private fb: FormBuilder,
    private employeeService: EmployeeService
  ) {
    this.assignForm = this.fb.group({
      staffId: ['', Validators.required],
      reason: ['']
    });
  }

  ngOnInit(): void {
    this.loadStaffOptions();
  }

  loadStaffOptions(): void {
    this.isLoadingStaff = true;
    this.employeeService.getAllEmployees('Active').pipe(
      catchError(error => {
        console.error('Error loading staff options:', error);
        return of([]);
      })
    ).subscribe((staff: EmployeeDropdownDto[]) => {
      this.staffOptions = staff;
      this.isLoadingStaff = false;
    });
  }

  onConfirm(): void {
    if (this.assignForm.valid) {
      this.confirm.emit({
        jobId: this.jobId,
        staffId: this.assignForm.value.staffId,
        reason: this.assignForm.value.reason || undefined
      });
    }
  }

  onClose(): void {
    this.close.emit();
  }
}
