import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent {
  loginForm: FormGroup;
  isLoading = signal(false);
  showPassword = signal(false);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    // Redirect if already authenticated
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/my-tasks']);
    }
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    const credentials = this.loginForm.value;

    this.authService.login(credentials).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        if (response.token) {
          this.toastService.success('เข้าสู่ระบบสำเร็จ', `ยินดีต้อนรับ ${response.userName || ''}`);
          this.router.navigate(['/my-tasks']);
        } else {
          this.toastService.error('เข้าสู่ระบบไม่สำเร็จ', 'ไม่พบ token ใน response');
        }
      },
      error: (error) => {
        this.isLoading.set(false);
        const errorMessage = error.error?.message || error.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ';
        this.toastService.error('เข้าสู่ระบบไม่สำเร็จ', errorMessage);
      }
    });
  }

  togglePasswordVisibility() {
    this.showPassword.update(value => !value);
  }

  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }
}

