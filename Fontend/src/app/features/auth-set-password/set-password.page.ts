import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { PasswordRulesComponent } from '../../shared/components/password-rules/password-rules.component';
import { PasswordLinkInvalidReason, SetPasswordByTokenResponse } from '../../models/password-link.model';

type PageState = 'loading' | 'invalid' | 'form' | 'success';

@Component({
  selector: 'app-set-password-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PasswordRulesComponent],
  templateUrl: './set-password.page.html',
  styleUrls: ['./set-password.page.scss']
})
export class SetPasswordPage implements OnInit {
  state = signal<PageState>('loading');
  invalidReason = signal<PasswordLinkInvalidReason | null>(null);

  token = signal<string>('');

  isSubmitting = signal(false);
  serverErrorMessage = signal<string | null>(null);

  form!: FormGroup;

  passwordValue = computed(() => this.form.get('newPassword')?.value || '');
  confirmValue = computed(() => this.form.get('confirmPassword')?.value || '');

  // Client-side rule gate (server still enforces policy + not-same-as-old)
  clientRulesPassed = computed(() => {
    const pwd = this.passwordValue();
    const confirm = this.confirmValue();
    return (
      pwd.length >= 6 &&
      /[a-z]/.test(pwd) &&
      /[A-Z]/.test(pwd) &&
      pwd === confirm
    );
  });

  submitDisabled = computed(() => this.isSubmitting() || !this.clientRulesPassed());

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private toastService: ToastService
  ) {
    this.form = this.fb.group({
      newPassword: ['', [Validators.required]],
      confirmPassword: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    const tokenFromParam = this.route.snapshot.paramMap.get('token');
    const tokenFromQuery = this.route.snapshot.queryParamMap.get('token');
    const token = (tokenFromParam || tokenFromQuery || '').trim();

    if (!token) {
      this.showInvalid('invalid');
      return;
    }

    this.token.set(token);
    this.validateToken(token);
  }

  private validateToken(token: string): void {
    this.state.set('loading');
    this.authService.validatePasswordLink(token).subscribe({
      next: (res) => {
        if (res.valid) {
          this.state.set('form');
          return;
        }
        this.showInvalid(res.reason || 'invalid');
      },
      error: () => {
        // If validate endpoint is not implemented yet, allow form and let submit handle token errors.
        this.state.set('form');
      }
    });
  }

  private showInvalid(reason: PasswordLinkInvalidReason): void {
    this.invalidReason.set(reason);
    this.state.set('invalid');
  }

  getInvalidTitle(): string {
    return 'ไม่สามารถตั้งรหัสผ่านได้';
  }

  getInvalidMessage(): string {
    const reason = this.invalidReason();
    if (reason === 'expired') return 'ลิงก์นี้หมดอายุแล้ว กรุณาติดต่อผู้ดูแลระบบ';
    if (reason === 'used') return 'ลิงก์นี้ถูกใช้งานแล้ว';
    return 'ลิงก์ไม่ถูกต้อง';
  }

  submit(): void {
    if (this.form.invalid || !this.clientRulesPassed()) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.serverErrorMessage.set(null);

    const token = this.token();
    const newPassword = this.passwordValue();
    const confirmPassword = this.confirmValue();

    this.authService.setPasswordByToken({ token, newPassword, confirmPassword }).subscribe({
      next: (res: SetPasswordByTokenResponse) => {
        this.isSubmitting.set(false);

        if (res.success) {
          this.state.set('success');
          return;
        }

        // Normalize error behavior by code
        if (res.code === 'PASSWORD_SAME_AS_OLD') {
          this.serverErrorMessage.set(res.message || 'รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสเดิม');
          return;
        }

        if (res.code === 'TOKEN_EXPIRED_OR_USED') {
          // We can’t distinguish expired vs used from this code alone; show friendly message
          this.showInvalid('expired');
          return;
        }

        // PASSWORD_POLICY or unknown
        this.serverErrorMessage.set(res.message || 'ไม่สามารถตั้งรหัสผ่านได้ กรุณาตรวจสอบเงื่อนไข');
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const message = err?.error?.message || err?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่';
        this.serverErrorMessage.set(message);
        this.toastService.error('ตั้งรหัสผ่านไม่สำเร็จ', message);
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}

