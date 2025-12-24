import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonComponent,
    IconComponent
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  email = signal('');
  password = signal('');
  isLoading = signal(false);
  errorMessage = signal('');

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onEmailChange(value: string): void {
    this.email.set(value);
    this.errorMessage.set('');
  }

  onPasswordChange(value: string): void {
    this.password.set(value);
    this.errorMessage.set('');
  }

  onSubmit(): void {
    if (!this.email().trim() || !this.password().trim()) {
      this.errorMessage.set('กรุณากรอกอีเมลและรหัสผ่าน');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.authService.login({
      email: this.email().trim(),
      password: this.password()
    }).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        if (response.token) {
          this.router.navigate(['/dashboard']);
        } else {
          this.errorMessage.set('เข้าสู่ระบบไม่สำเร็จ');
        }
      },
      error: (error) => {
        this.isLoading.set(false);
        if (error.status === 401) {
          this.errorMessage.set('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
        } else if (error.status === 0) {
          this.errorMessage.set('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
        } else {
          this.errorMessage.set('เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
        }
        console.error('Login error:', error);
      }
    });
  }
}

