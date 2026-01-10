import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { EmployeeService } from '../../../services/employee.service';
import { EmployeeDropdownDto } from '../../../models/employee.model';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-transfer-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './transfer-dialog.component.html',
  styleUrls: ['./transfer-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TransferDialogComponent implements OnInit {
  @Input() jobId: string = '';
  @Input() jobNumber: string = '';
  @Input() currentAssignee?: string;
  @Output() confirm = new EventEmitter<{ jobId: string; toStaffId: string; reason: string }>();
  @Output() close = new EventEmitter<void>();

  transferForm!: ReturnType<FormBuilder['group']>;
  staffOptions: EmployeeDropdownDto[] = [];
  isLoadingStaff = false;

  constructor(
    private fb: FormBuilder,
    private employeeService: EmployeeService
  ) {
    this.transferForm = this.fb.group({
      toStaffId: ['', Validators.required],
      reason: ['', Validators.required]
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
      // Filter out current assignee
      this.staffOptions = staff.filter((s: EmployeeDropdownDto) => s.id !== this.currentAssignee);
      this.isLoadingStaff = false;
    });
  }

  onConfirm(): void {
    if (this.transferForm.valid) {
      this.confirm.emit({
        jobId: this.jobId,
        toStaffId: this.transferForm.value.toStaffId,
        reason: this.transferForm.value.reason
      });
    }
  }

  onClose(): void {
    this.close.emit();
  }
}
