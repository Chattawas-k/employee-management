import { CommonModule } from '@angular/common';
import { Component, Input, computed, signal } from '@angular/core';

interface RuleState {
  key: string;
  label: string;
  passed: boolean;
}

@Component({
  selector: 'app-password-rules',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './password-rules.component.html',
  styleUrls: ['./password-rules.component.scss']
})
export class PasswordRulesComponent {
  private passwordSig = signal<string>('');
  private confirmSig = signal<string>('');

  @Input({ required: true })
  set password(value: string) {
    this.passwordSig.set(String(value ?? ''));
  }
  get password(): string {
    return this.passwordSig();
  }

  @Input({ required: true })
  set confirm(value: string) {
    this.confirmSig.set(String(value ?? ''));
  }
  get confirm(): string {
    return this.confirmSig();
  }

  rules = computed<RuleState[]>(() => {
    const pwd = this.passwordSig();
    const confirm = this.confirmSig();

    const lengthOk = pwd.length >= 6;
    const hasLower = /[a-z]/.test(pwd);
    const hasUpper = /[A-Z]/.test(pwd);
    const confirmMatch = pwd.length > 0 && pwd === confirm;

    return [
      { key: 'length', label: 'อย่างน้อย 6 ตัวอักษร', passed: lengthOk },
      { key: 'lower', label: 'มีตัวอักษรพิมพ์เล็ก (a-z) อย่างน้อย 1 ตัว', passed: hasLower },
      { key: 'upper', label: 'มีตัวอักษรพิมพ์ใหญ่ (A-Z) อย่างน้อย 1 ตัว', passed: hasUpper },
      { key: 'confirm', label: 'ยืนยันรหัสผ่านต้องตรงกัน', passed: confirmMatch }
    ];
  });

  allPassed = computed(() => this.rules().every(r => r.passed));
}

