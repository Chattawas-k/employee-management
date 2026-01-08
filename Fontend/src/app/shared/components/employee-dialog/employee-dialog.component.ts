import { Component, Input, OnInit, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { EmployeeService } from '../../../services/employee.service';
import { PositionService } from '../../../services/position.service';
import { DepartmentService } from '../../../services/department.service';
import { EmployeeSearchItem, CreateEmployeeRequest, UpdateEmployeeRequest } from '../../../models/employee.model';
import { PositionDto } from '../../../services/position.service';
import { DepartmentDto } from '../../../services/department.service';
import { ToastService } from '../../../services/toast.service';
import { catchError, forkJoin, of } from 'rxjs';

@Component({
  selector: 'app-employee-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './employee-dialog.component.html',
  styleUrls: ['./employee-dialog.component.scss']
})
export class EmployeeDialogComponent implements OnInit {
  @Input() set employee(value: EmployeeSearchItem | null) {
    this._employee.set(value);
    if (this._isOpen() && value) {
      this.form.patchValue({
        name: value.name,
        phone: value.phone || '',
        positionId: value.positionId,
        status: value.status
      });
    } else if (this._isOpen() && !value) {
      this.form.reset({
        name: '',
        phone: '',
        positionId: '',
        status: 'Active'
      });
    }
  }
  get employee(): EmployeeSearchItem | null {
    return this._employee();
  }
  
  @Input() set isOpen(value: boolean) {
    this._isOpen.set(value);
    if (value) {
      const emp = this._employee();
      if (emp) {
        this.form.patchValue({
          name: emp.name,
          phone: emp.phone || '',
          positionId: emp.positionId,
          status: emp.status
        });
      } else {
        this.form.reset({
          name: '',
          phone: '',
          positionId: '',
          status: 'Active'
        });
      }
    }
  }
  get isOpen(): boolean {
    return this._isOpen();
  }
  
  private _isOpen = signal(false);
  
  close = output<void>();
  saved = output<void>();

  private _employee = signal<EmployeeSearchItem | null>(null);

  form: FormGroup;
  positions = signal<PositionDto[]>([]);
  departments = signal<DepartmentDto[]>([]);
  isLoading = signal(false);
  isSaving = signal(false);

  constructor(
    private fb: FormBuilder,
    private employeeService: EmployeeService,
    private positionService: PositionService,
    private departmentService: DepartmentService,
    private toastService: ToastService
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required]],
      phone: [''],
      positionId: ['', [Validators.required]],
      status: ['Active', [Validators.required]]
    });

  }

  ngOnInit(): void {
    this.loadDropdowns();
  }


  loadDropdowns(): void {
    this.isLoading.set(true);
    forkJoin({
      positions: this.positionService.getAll().pipe(catchError(() => of([]))),
      departments: this.departmentService.getAll().pipe(catchError(() => of([])))
    }).subscribe({
      next: (result) => {
        this.positions.set(result.positions);
        this.departments.set(result.departments);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  onClose(): void {
    this._isOpen.set(false);
    this.form.reset();
    this._employee.set(null);
    this.close.emit();
  }


  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    const formValue = this.form.value;
    const employee = this._employee();

    if (employee) {
      // Update
      const request: UpdateEmployeeRequest = {
        id: employee.id,
        name: formValue.name,
        phone: formValue.phone || undefined,
        status: formValue.status,
        positionId: formValue.positionId
      };

      this.employeeService.update(employee.id, request).subscribe({
        next: () => {
          this.toastService.success('อัปเดตข้อมูลพนักงานสำเร็จ');
          this.isSaving.set(false);
          this.saved.emit();
          this.onClose();
        },
        error: (error) => {
          this.toastService.error('เกิดข้อผิดพลาดในการอัปเดตข้อมูล');
          console.error('Error updating employee:', error);
          this.isSaving.set(false);
        }
      });
    } else {
      // Create
      const request: CreateEmployeeRequest = {
        name: formValue.name,
        phone: formValue.phone || undefined,
        status: formValue.status,
        positionId: formValue.positionId
      };

      this.employeeService.create(request).subscribe({
        next: () => {
          this.toastService.success('เพิ่มพนักงานสำเร็จ');
          this.isSaving.set(false);
          this.saved.emit();
          this.onClose();
        },
        error: (error) => {
          this.toastService.error('เกิดข้อผิดพลาดในการเพิ่มพนักงาน');
          console.error('Error creating employee:', error);
          this.isSaving.set(false);
        }
      });
    }
  }

  getPositionName(positionId: string): string {
    const position = this.positions().find(p => p.id === positionId);
    return position?.name || '';
  }

  getDepartmentName(positionId: string): string {
    const position = this.positions().find(p => p.id === positionId);
    return position?.departmentName || '';
  }
}

