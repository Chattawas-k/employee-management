import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ChangePasswordRequest } from '../../../models/account.model';

@Component({
  selector: 'app-password-change-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './password-change-dialog.component.html',
  styleUrls: ['./password-change-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PasswordChangeDialogComponent {
  private fb = inject(FormBuilder);

  @Input() isSubmitting: boolean = false;

  @Output() confirm = new EventEmitter<ChangePasswordRequest>();
  @Output() cancel = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  form: FormGroup = this.fb.group(
    {
      currentPassword: ['', [Validators.required]],
      newPassword: [
        '',
        [
          Validators.required,
          Validators.minLength(6),
          // Align with common ASP.NET Identity defaults
          Validators.pattern(/[a-z]/), // at least one lowercase
          Validators.pattern(/[A-Z]/)  // at least one uppercase
        ]
      ],
      confirmPassword: ['', [Validators.required]]
    },
    { validators: this.passwordGroupValidator }
  );

  onBackdropClick(): void {
    if (this.isSubmitting) return;
    this.close.emit();
  }

  onCancel(): void {
    if (this.isSubmitting) return;
    this.cancel.emit();
  }

  onConfirm(): void {
    if (this.isSubmitting) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.value as ChangePasswordRequest;
    this.confirm.emit({
      currentPassword: value.currentPassword,
      newPassword: value.newPassword,
      confirmPassword: value.confirmPassword
    });
  }

  getError(controlName: 'currentPassword' | 'newPassword' | 'confirmPassword'): string {
    const control = this.form.get(controlName);
    if (!control || !control.touched) return '';

    if (control.hasError('required')) return 'กรุณากรอกข้อมูล';
    if (controlName === 'newPassword' && control.hasError('minlength')) return 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร';
    if (controlName === 'newPassword' && control.hasError('pattern')) return 'รหัสผ่านต้องมีทั้งตัวพิมพ์เล็ก (a-z) และตัวพิมพ์ใหญ่ (A-Z)';
    if (controlName === 'newPassword' && this.form.hasError('sameAsCurrent')) return 'รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านปัจจุบัน';
    if (controlName === 'confirmPassword' && this.form.hasError('passwordMismatch')) return 'รหัสผ่านไม่ตรงกัน';
    return '';
  }

  get isMinLengthMet(): boolean {
    const newPassword = String(this.form.get('newPassword')?.value ?? '');
    return newPassword.length >= 6;
  }

  get hasLowercaseMet(): boolean {
    const newPassword = String(this.form.get('newPassword')?.value ?? '');
    return /[a-z]/.test(newPassword);
  }

  get hasUppercaseMet(): boolean {
    const newPassword = String(this.form.get('newPassword')?.value ?? '');
    return /[A-Z]/.test(newPassword);
  }

  get isDifferentFromCurrentMet(): boolean {
    const currentPassword = String(this.form.get('currentPassword')?.value ?? '');
    const newPassword = String(this.form.get('newPassword')?.value ?? '');
    if (!currentPassword || !newPassword) return false;
    return currentPassword !== newPassword;
  }

  get isConfirmMatchMet(): boolean {
    const newPassword = String(this.form.get('newPassword')?.value ?? '');
    const confirmPassword = String(this.form.get('confirmPassword')?.value ?? '');
    if (!newPassword || !confirmPassword) return false;
    return newPassword === confirmPassword;
  }

  private passwordGroupValidator(form: FormGroup): ValidationErrors | null {
    const currentPassword = String(form.get('currentPassword')?.value ?? '');
    const newPassword = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;

    const errors: ValidationErrors = {};

    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      errors['passwordMismatch'] = true;
    }

    if (currentPassword && newPassword && currentPassword === newPassword) {
      errors['sameAsCurrent'] = true;
    }

    return Object.keys(errors).length > 0 ? errors : null;
  }
}

