import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
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

  // UI helpers
  showNewPassword = signal(false);
  showConfirmPassword = signal(false);

  // Expiration countdown (from validate endpoint when available)
  expiresAt = signal<Date | null>(null);
  private countdownTimerId?: number;
  private tickTimerId?: number;
  private nowMs = signal<number>(Date.now());

  isSubmitting = signal(false);
  serverErrorMessage = signal<string | null>(null);

  form!: FormGroup;

  // NOTE: reactive form values don't automatically trigger signals/computed.
  // We bridge via valueChanges into signals so UI updates in real-time.
  private password = signal<string>('');
  private confirm = signal<string>('');

  passwordValue = computed(() => this.password());
  confirmValue = computed(() => this.confirm());

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

    // Sync reactive form -> signals for live UI
    this.form.valueChanges.subscribe(v => {
      this.password.set(String(v?.newPassword ?? ''));
      this.confirm.set(String(v?.confirmPassword ?? ''));
    });
  }

  expiresInSeconds = computed<number | null>(() => {
    const expiresAt = this.expiresAt();
    if (!expiresAt) return null;
    // Depend on nowMs so this recomputes every tick
    const diffMs = expiresAt.getTime() - this.nowMs();
    return Math.max(0, Math.floor(diffMs / 1000));
  });

  expiresInText = computed<string | null>(() => {
    const seconds = this.expiresInSeconds();
    if (seconds === null) return null;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  });

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

    // Initialize bridge signals with initial form values
    this.password.set(String(this.form.get('newPassword')?.value ?? ''));
    this.confirm.set(String(this.form.get('confirmPassword')?.value ?? ''));
  }

  ngOnDestroy(): void {
    if (this.countdownTimerId) {
      window.clearInterval(this.countdownTimerId);
      this.countdownTimerId = undefined;
    }
    if (this.tickTimerId) {
      window.clearInterval(this.tickTimerId);
      this.tickTimerId = undefined;
    }
  }

  private validateToken(token: string): void {
    this.state.set('loading');
    this.authService.validatePasswordLink(token).subscribe({
      next: (res) => {
        if (res.valid) {
          if (res.expiresAt) {
            const dt = new Date(res.expiresAt);
            if (!isNaN(dt.getTime())) {
              this.expiresAt.set(dt);
              this.startCountdown();
            }
          }
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

  private startCountdown(): void {
    if (this.countdownTimerId) {
      window.clearInterval(this.countdownTimerId);
    }
    if (this.tickTimerId) {
      window.clearInterval(this.tickTimerId);
    }

    // Tick UI every 1s so countdown updates in real-time.
    this.tickTimerId = window.setInterval(() => {
      this.nowMs.set(Date.now());
    }, 1000);

    // Also enforce expiry; if expired, lock the page.
    this.countdownTimerId = window.setInterval(() => {
      const expiresAt = this.expiresAt();
      if (!expiresAt) return;
      if (Date.now() >= expiresAt.getTime()) {
        window.clearInterval(this.countdownTimerId);
        this.countdownTimerId = undefined;
        if (this.tickTimerId) {
          window.clearInterval(this.tickTimerId);
          this.tickTimerId = undefined;
        }
        this.showInvalid('expired');
      }
    }, 1000);
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

