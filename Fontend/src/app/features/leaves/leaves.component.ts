import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DataService } from '../../services/data.service';
import { Employee } from '../../models/employee.model';
import { Leave } from '../../models/schedule.model';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { InputComponent } from '../../shared/components/input/input.component';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal.component';
import { ActionButtonComponent } from '../../shared/components/action-button/action-button.component';
import { formatDateThaiFull } from '../../utils/date.utils';

@Component({
  selector: 'app-leaves',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ModalComponent,
    ButtonComponent,
    AvatarComponent,
    IconComponent,
    InputComponent,
    ConfirmModalComponent,
    ActionButtonComponent
  ],
  templateUrl: './leaves.component.html',
  styleUrls: ['./leaves.component.scss']
})
export class LeavesComponent implements OnInit, OnDestroy {
  employees = signal<Employee[]>([]);
  leaves = signal<Leave[]>([]);
  selectedEmpId = signal<string | null>(null);
  isModalOpen = signal(false);
  formData = { empId: '', date: '', type: 'ลาป่วย', reason: '' };
  filterMonth = signal('All');
  filterYear = signal(new Date().getFullYear());
  errorMessage = signal('');
  validationErrors = signal<string[]>([]);
  fieldErrors = signal<{ [key: string]: string }>({});
  
  // Confirm modal state
  isConfirmModalOpen = signal(false);
  confirmAction = signal<(() => void) | null>(null);
  confirmMessage = signal('คุณแน่ใจหรือไม่ว่าต้องการลบรายการลานี้?');

  currentYear = new Date().getFullYear();
  months = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
            'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
  years = Array.from({ length: 5 }, (_, i) => this.currentYear - 2 + i);

  private destroy$ = new Subject<void>();

  constructor(private dataService: DataService) {}

  ngOnInit(): void {
    this.dataService.employees$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (emps) => this.employees.set(emps),
      error: (error) => {
        console.error('Error loading employees:', error);
        this.errorMessage.set('ไม่สามารถโหลดข้อมูลพนักงานได้');
      }
    });
    this.dataService.leaves$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (levs) => this.leaves.set(levs),
      error: (error) => {
        console.error('Error loading leaves:', error);
        this.errorMessage.set('ไม่สามารถโหลดข้อมูลการลาได้');
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  selectedEmployee = computed(() => {
    const id = this.selectedEmpId();
    if (!id) return null;
    return this.employees().find(e => e.id === id) || null;
  });

  employeeLeaves = computed(() => {
    const empId = this.selectedEmpId();
    if (!empId) return [];
    const empLeaves = this.leaves().filter(l => l.empId === empId);
    return this.filterLeavesByDate(empLeaves);
  });

  filterLeavesByDate(leaveList: Leave[]): Leave[] {
    return leaveList.filter(l => {
      const d = new Date(l.date);
      const matchYear = d.getFullYear() === this.filterYear();
      const matchMonth = this.filterMonth() === 'All' || d.getMonth() === parseInt(this.filterMonth());
      return matchYear && matchMonth;
    });
  }

  getLeaveCount(empId: string): number {
    const empLeaves = this.leaves().filter(l => l.empId === empId);
    return this.filterLeavesByDate(empLeaves).length;
  }

  handleAddClick(): void {
    this.formData = {
      empId: this.selectedEmpId()?.toString() || this.employees()[0]?.id.toString() || '',
      date: '',
      type: 'ลาป่วย',
      reason: ''
    };
    this.isModalOpen.set(true);
  }

  validateForm(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const fieldErrors: { [key: string]: string } = {};

    if (!this.formData.empId) {
      errors.push('พนักงานเป็นข้อมูลที่จำเป็น');
      fieldErrors['empId'] = 'กรุณาเลือกพนักงาน';
    }

    if (!this.formData.date) {
      errors.push('วันที่ลาเป็นข้อมูลที่จำเป็น');
      fieldErrors['date'] = 'กรุณาเลือกวันที่ลา';
    }

    const reason = this.formData.reason.trim();
    if (!reason) {
      errors.push('เหตุผลเป็นข้อมูลที่จำเป็น');
      fieldErrors['reason'] = 'กรุณากรอกเหตุผล';
    } else if (reason.length < 5) {
      errors.push('เหตุผลต้องมีอย่างน้อย 5 ตัวอักษร');
      fieldErrors['reason'] = 'เหตุผลต้องมีอย่างน้อย 5 ตัวอักษร';
    } else if (reason.length > 500) {
      errors.push('เหตุผลต้องไม่เกิน 500 ตัวอักษร');
      fieldErrors['reason'] = 'เหตุผลต้องไม่เกิน 500 ตัวอักษร';
    }

    this.validationErrors.set(errors);
    this.fieldErrors.set(fieldErrors);

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  handleSave(): void {
    const validation = this.validateForm();
    if (!validation.isValid) {
      this.errorMessage.set(validation.errors.join(', '));
      return;
    }

    this.errorMessage.set('');
    this.validationErrors.set([]);
    this.fieldErrors.set({});

    const newId = Math.max(...this.leaves().map(l => l.id), 0) + 1;
    this.dataService.addLeave({
      id: newId,
      empId: this.formData.empId,
      date: this.formData.date,
      type: this.formData.type,
      reason: this.formData.reason
    });
    this.isModalOpen.set(false);
  }

  handleDelete(id: number): void {
    this.confirmAction.set(() => {
      this.dataService.deleteLeave(id);
      this.isConfirmModalOpen.set(false);
    });
    this.isConfirmModalOpen.set(true);
  }

  handleConfirmDelete(): void {
    const action = this.confirmAction();
    if (action) {
      action();
    }
  }

  handleCancelDelete(): void {
    this.isConfirmModalOpen.set(false);
    this.confirmAction.set(null);
  }

  formatDateThaiFull(dateString: string | null | undefined): string {
    return formatDateThaiFull(dateString);
  }
}
