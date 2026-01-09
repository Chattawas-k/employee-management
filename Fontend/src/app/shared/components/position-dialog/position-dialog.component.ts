import { Component, Input, OnInit, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PositionService, PositionDto } from '../../../services/position.service';
import { DepartmentService, DepartmentDto } from '../../../services/department.service';
import { ToastService } from '../../../services/toast.service';
import { catchError, forkJoin, of } from 'rxjs';

@Component({
  selector: 'app-position-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './position-dialog.component.html',
  styleUrls: ['./position-dialog.component.scss']
})
export class PositionDialogComponent implements OnInit {
  @Input() set position(value: PositionDto | null) {
    this._position.set(value);
    this.updateForm();
  }
  
  private updateForm(): void {
    if (!this._isOpen()) return;
    
    const pos = this._position();
    if (pos) {
      // Ensure departments are loaded before patching
      if (this.departments().length > 0) {
        this.form.patchValue({
          name: pos.name,
          description: pos.description || '',
          departmentId: pos.departmentId || '',
          isActive: pos.isActive ?? true
        });
      } else {
        // Wait for departments to load
        setTimeout(() => this.updateForm(), 100);
      }
    } else {
      this.form.reset({
        name: '',
        description: '',
        departmentId: '',
        isActive: true
      });
    }
  }
  get position(): PositionDto | null {
    return this._position();
  }
  
  @Input() set isOpen(value: boolean) {
    this._isOpen.set(value);
    if (value) {
      this.updateForm();
    } else {
      this.form.reset();
    }
  }
  get isOpen(): boolean {
    return this._isOpen();
  }
  
  private _isOpen = signal(false);
  
  close = output<void>();
  saved = output<void>();

  private _position = signal<PositionDto | null>(null);

  form: FormGroup;
  departments = signal<DepartmentDto[]>([]);
  isLoading = signal(false);
  isSaving = signal(false);

  constructor(
    private fb: FormBuilder,
    private positionService: PositionService,
    private departmentService: DepartmentService,
    private toastService: ToastService
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required]],
      description: [''],
      departmentId: ['', [Validators.required]],
      isActive: [true, [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.loadDepartments();
  }

  loadDepartments(): void {
    this.isLoading.set(true);
    this.departmentService.getAll().pipe(
      catchError(() => of([]))
    ).subscribe({
      next: (departments) => {
        this.departments.set(departments);
        this.isLoading.set(false);
        
        // If dialog is open and position is set, update form after departments load
        if (this._isOpen()) {
          this.updateForm();
        }
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  onClose(): void {
    this._isOpen.set(false);
    this.form.reset();
    this._position.set(null);
    this.close.emit();
  }

  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    const formValue = this.form.value;
    const position = this._position();

    if (position) {
      // Update
      this.positionService.update(position.id, {
        name: formValue.name,
        description: formValue.description || undefined,
        departmentId: formValue.departmentId,
        isActive: Boolean(formValue.isActive)
      }).subscribe({
        next: () => {
          this.toastService.success('อัปเดตข้อมูลตำแหน่งสำเร็จ');
          this.isSaving.set(false);
          this.saved.emit();
          this.onClose();
        },
        error: (error) => {
          this.toastService.error('เกิดข้อผิดพลาดในการอัปเดตข้อมูล');
          console.error('Error updating position:', error);
          this.isSaving.set(false);
        }
      });
    } else {
      // Create
      this.positionService.create({
        name: formValue.name,
        description: formValue.description || undefined,
        departmentId: formValue.departmentId,
        isActive: Boolean(formValue.isActive)
      }).subscribe({
        next: () => {
          this.toastService.success('เพิ่มตำแหน่งสำเร็จ');
          this.isSaving.set(false);
          this.saved.emit();
          this.onClose();
        },
        error: (error) => {
          this.toastService.error('เกิดข้อผิดพลาดในการเพิ่มตำแหน่ง');
          console.error('Error creating position:', error);
          this.isSaving.set(false);
        }
      });
    }
  }
}
