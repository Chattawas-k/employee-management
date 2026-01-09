import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-my-account',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-4 sm:p-6 lg:p-8 bg-slate-50 min-h-screen">
      <header class="mb-6">
        <h1 class="text-2xl font-medium text-gray-900">บัญชีของฉัน</h1>
      </header>
      <div class="bg-white rounded-xl p-6 shadow-sm">
        <p class="text-gray-600">หน้าจอบัญชีของฉัน</p>
      </div>
    </div>
  `
})
export class MyAccountComponent {}

