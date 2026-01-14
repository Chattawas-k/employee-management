import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, signal, output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, forkJoin, of } from 'rxjs';
import { PositionDto, PositionService } from '../../../services/position.service';
import { ToastService } from '../../../services/toast.service';
import { StaffService } from '../../../services/staff.service';
import { CreateStaffRequest, StaffListItem, UpdateStaffProfileBody } from '../../../models/staff.model';

@Component({
  selector: 'app-staff-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './staff-dialog.component.html',
  styleUrls: ['./staff-dialog.component.scss']
})
export class StaffDialogComponent implements OnInit {
  @Input() set staff(value: StaffListItem | null) {
    this._staff.set(value);
    if (this._isOpen()) {
      this.resetStateForOpen();
    }
  }
  get staff(): StaffListItem | null {
    return this._staff();
  }

  @Input() set isOpen(value: boolean) {
    this._isOpen.set(value);
    if (value) {
      this.resetStateForOpen();
    }
  }
  get isOpen(): boolean {
    return this._isOpen();
  }

  close = output<void>();
  saved = output<void>();

  private _isOpen = signal(false);
  private _staff = signal<StaffListItem | null>(null);

  positions = signal<PositionDto[]>([]);

  isLoading = signal(false);
  isSaving = signal(false);
  isUpdatingStatus = signal(false);
  isResettingPassword = signal(false);

  selectedImageDataUrl = signal<string | null>(null);
  removeProfileImage = signal(false);
  imageError = signal<string | null>(null);

  resetPasswordValue = signal('');

  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private positionService: PositionService,
    private staffService: StaffService,
    private toastService: ToastService
  ) {
    this.form = this.fb.group({
      fullName: ['', [Validators.required]],
      positionId: ['', [Validators.required]],
      role: ['Basic', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    this.loadDropdowns();
  }

  get isEditMode(): boolean {
    return !!this._staff();
  }

  private resetStateForOpen(): void {
    this.imageError.set(null);
    this.selectedImageDataUrl.set(null);
    this.removeProfileImage.set(false);
    this.resetPasswordValue.set('');

    const staff = this._staff();
    if (staff) {
      const primaryRole = this.getPrimaryRole(staff.roles);
      // Edit mode: password not required and never prefilled
      this.form.patchValue({
        fullName: staff.fullName,
        positionId: staff.positionId,
        role: primaryRole,
        email: staff.email,
        password: ''
      });
      this.form.get('email')?.disable({ emitEvent: false });
      this.form.get('password')?.clearValidators();
      this.form.get('password')?.updateValueAndValidity({ emitEvent: false });
    } else {
      // Add mode
      this.form.reset({
        fullName: '',
        positionId: '',
        role: 'Basic',
        email: '',
        password: ''
      });
      this.form.get('email')?.enable({ emitEvent: false });
      this.form.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
      this.form.get('password')?.updateValueAndValidity({ emitEvent: false });
    }
  }

  private getPrimaryRole(roles: string[] | undefined | null): string {
    const list = roles || [];
    const normalized = list.map(r => r.toLowerCase());
    if (normalized.includes('superadmin')) return 'SuperAdmin';
    if (normalized.includes('admin')) return 'Admin';
    if (normalized.includes('manager')) return 'Manager';
    if (normalized.includes('basic')) return 'Basic';
    return list[0] || 'Basic';
  }

  loadDropdowns(): void {
    this.isLoading.set(true);
    forkJoin({
      positions: this.positionService.getAll().pipe(catchError(() => of([])))
    }).subscribe({
      next: (result) => {
        this.positions.set(result.positions);
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
    this._staff.set(null);
    this.selectedImageDataUrl.set(null);
    this.removeProfileImage.set(false);
    this.close.emit();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const maxBytes = 2 * 1024 * 1024; // 2MB
    if (file.size > maxBytes) {
      this.imageError.set('ไฟล์รูปภาพมีขนาดใหญ่เกินไป (สูงสุด 2MB)');
      input.value = '';
      return;
    }

    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      this.imageError.set('รองรับเฉพาะไฟล์รูปภาพ: JPG, PNG, WEBP');
      input.value = '';
      return;
    }

    this.imageError.set(null);
    this.removeProfileImage.set(false);

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        this.selectedImageDataUrl.set(result);
      }
    };
    reader.readAsDataURL(file);
  }

  onRemoveImage(): void {
    this.selectedImageDataUrl.set(null);
    this.removeProfileImage.set(true);
  }

  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);

    const staff = this._staff();
    const fullName = (this.form.get('fullName')?.value || '').trim();
    const positionId = this.form.get('positionId')?.value;
    const role = (this.form.get('role')?.value || '').trim();
    const email = (this.form.get('email')?.value || '').trim();
    const password = this.form.get('password')?.value;

    if (!staff) {
      const request: CreateStaffRequest = {
        fullName,
        positionId,
        email,
        password,
        role,
        profileImageDataUrl: this.selectedImageDataUrl()
      };

      this.staffService.createStaff(request).subscribe({
        next: () => {
          this.toastService.success('เพิ่มพนักงานสำเร็จ');
          this.isSaving.set(false);
          this.saved.emit();
          this.onClose();
        },
        error: (error) => {
          console.error('Error creating staff:', error);
          this.toastService.error('เกิดข้อผิดพลาดในการเพิ่มพนักงาน');
          this.isSaving.set(false);
        }
      });
      return;
    }

    const previousRole = this.getPrimaryRole(staff.roles);
    const body: UpdateStaffProfileBody = {
      fullName,
      positionId,
      profileImageDataUrl: this.selectedImageDataUrl(),
      removeProfileImage: this.removeProfileImage()
    };

    this.staffService.updateStaffProfile(staff.staffId, body).subscribe({
      next: (res) => {
        // If role changed, update role separately (backend enforces SuperAdmin restriction)
        if (role && role !== previousRole) {
          this.staffService.setStaffRole(staff.staffId, { role }).subscribe({
            next: (roleRes) => {
              this.toastService.success('อัปเดตข้อมูลพนักงานสำเร็จ');
              this.isSaving.set(false);
              this._staff.set(roleRes.staff);
              this.saved.emit();
              this.onClose();
            },
            error: (error) => {
              console.error('Error updating staff role:', error);
              this.toastService.error('อัปเดต Role ไม่สำเร็จ');
              this.isSaving.set(false);
              // Keep dialog open so user can see/change role
              this._staff.set(res.staff);
            }
          });
          return;
        }

        this.toastService.success('อัปเดตข้อมูลพนักงานสำเร็จ');
        this.isSaving.set(false);
        this._staff.set(res.staff);
        this.saved.emit();
        this.onClose();
      },
      error: (error) => {
        console.error('Error updating staff profile:', error);
        this.toastService.error('เกิดข้อผิดพลาดในการอัปเดตข้อมูล');
        this.isSaving.set(false);
      }
    });
  }

  toggleAccountStatus(): void {
    const staff = this._staff();
    if (!staff) return;

    const shouldEnable = staff.accountStatus === 'disabled';
    this.isUpdatingStatus.set(true);

    this.staffService.setStaffStatus(staff.staffId, { isActive: shouldEnable }).subscribe({
      next: (res) => {
        this.isUpdatingStatus.set(false);
        this._staff.set(res.staff);
        this.toastService.success(shouldEnable ? 'เปิดใช้งานบัญชีแล้ว' : 'ปิดใช้งานบัญชีแล้ว');
        this.saved.emit();
      },
      error: (error) => {
        console.error('Error updating staff status:', error);
        this.toastService.error('เกิดข้อผิดพลาดในการเปลี่ยนสถานะบัญชี');
        this.isUpdatingStatus.set(false);
      }
    });
  }

  resetPassword(): void {
    const staff = this._staff();
    if (!staff) return;

    const newPassword = (this.resetPasswordValue() || '').trim();
    if (!newPassword || newPassword.length < 6) {
      this.toastService.error('กรุณากรอกรหัสผ่านใหม่อย่างน้อย 6 ตัวอักษร');
      return;
    }

    this.isResettingPassword.set(true);
    this.staffService.resetStaffPassword(staff.staffId, { newPassword }).subscribe({
      next: () => {
        this.isResettingPassword.set(false);
        this.resetPasswordValue.set('');
        this.toastService.success('รีเซ็ตรหัสผ่านสำเร็จ');
      },
      error: (error) => {
        console.error('Error resetting staff password:', error);
        this.toastService.error('เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน');
        this.isResettingPassword.set(false);
      }
    });
  }
}

