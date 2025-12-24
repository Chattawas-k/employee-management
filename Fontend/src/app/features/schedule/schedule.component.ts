import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { Employee } from '../../models/employee.model';
import { Schedule } from '../../models/schedule.model';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-schedule',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ModalComponent,
    ButtonComponent,
    AvatarComponent,
    IconComponent
  ],
  templateUrl: './schedule.component.html',
  styleUrls: ['./schedule.component.scss']
})
export class ScheduleComponent implements OnInit {
  employees = signal<Employee[]>([]);
  schedules = signal<Schedule[]>([]);
  isEditModalOpen = signal(false);
  editingSchedule = signal<Schedule | null>(null);

  days: string[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  statusOptions: ('Available' | 'Busy' | 'Inactive')[] = ['Available', 'Busy', 'Inactive'];
  dayLabels: Record<string, string> = {
    mon: 'จันทร์',
    tue: 'อังคาร',
    wed: 'พุธ',
    thu: 'พฤหัส',
    fri: 'ศุกร์',
    sat: 'เสาร์',
    sun: 'อาทิตย์'
  };

  constructor(private dataService: DataService) {}

  ngOnInit(): void {
    this.dataService.employees$.subscribe(emps => this.employees.set(emps));
    this.dataService.schedules$.subscribe(scheds => this.schedules.set(scheds));
  }

  getEmpName(id: string): string {
    const emp = this.employees().find(e => e.id === id);
    return emp ? emp.name : 'Unknown';
  }

  getScheduleForEmployee(empId: string): Schedule | null {
    return this.schedules().find(s => s.empId === empId) || null;
  }

  handleEditClick(empId: string): void {
    const existing = this.getScheduleForEmployee(empId);
    if (existing) {
      this.editingSchedule.set({ ...existing });
    } else {
      // Create new schedule with default values
      this.editingSchedule.set({
        id: Date.now(),
        empId,
        mon: 'Available',
        tue: 'Available',
        wed: 'Available',
        thu: 'Available',
        fri: 'Available',
        sat: 'Inactive',
        sun: 'Inactive'
      });
    }
    this.isEditModalOpen.set(true);
  }

  handleStatusChange(day: string, newStatus: 'Available' | 'Busy' | 'Inactive'): void {
    const current = this.editingSchedule();
    if (current && this.isValidDayKey(day)) {
      this.editingSchedule.set({
        ...current,
        [day]: newStatus
      });
    }
  }

  private isValidDayKey(day: string): day is 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun' {
    return (this.days as readonly string[]).includes(day);
  }

  getDayStatusForEdit(day: string): 'Available' | 'Busy' | 'Inactive' {
    const schedule = this.editingSchedule();
    if (!schedule || !this.isValidDayKey(day)) {
      return 'Inactive';
    }
    return schedule[day];
  }

  handleSave(): void {
    const schedule = this.editingSchedule();
    if (schedule) {
      this.dataService.updateEmployeeSchedule(schedule);
      this.isEditModalOpen.set(false);
      this.editingSchedule.set(null);
    }
  }

  getStatusColor(status: string): string {
    switch(status) {
      case 'Available': return 'bg-green-100 text-green-700 border-green-200';
      case 'Busy': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-slate-100 text-slate-500 border-slate-200';
    }
  }

  getStatusLabel(status: string): string {
    switch(status) {
      case 'Available': return 'ว่าง';
      case 'Busy': return 'ไม่ว่าง';
      default: return 'หยุด';
    }
  }

  getDayStatus(empId: string, day: string): 'Available' | 'Busy' | 'Inactive' {
    const schedule = this.getScheduleForEmployee(empId);
    if (!schedule || !this.isValidDayKey(day)) {
      return 'Inactive';
    }
    return schedule[day];
  }
}
