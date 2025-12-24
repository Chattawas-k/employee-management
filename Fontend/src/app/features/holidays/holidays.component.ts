import { Component, OnInit, OnDestroy, AfterViewInit, signal, computed, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DataService } from '../../services/data.service';
import { Holiday } from '../../models/schedule.model';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { InputComponent } from '../../shared/components/input/input.component';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal.component';
import { ActionButtonComponent } from '../../shared/components/action-button/action-button.component';
import { TableComponent, TableColumn } from '../../shared/components/table/table.component';
import { formatDateThaiFull } from '../../utils/date.utils';

@Component({
  selector: 'app-holidays',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ModalComponent,
    ButtonComponent,
    IconComponent,
    InputComponent,
    ConfirmModalComponent,
    ActionButtonComponent,
    TableComponent
  ],
  templateUrl: './holidays.component.html',
  styleUrls: ['./holidays.component.scss']
})
export class HolidaysComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('dateTemplate', { static: false }) dateTemplate!: TemplateRef<any>;
  @ViewChild('actionsTemplate', { static: false }) actionsTemplate!: TemplateRef<any>;

  holidays = signal<Holiday[]>([]);
  isModalOpen = signal(false);
  editingHoliday = signal<Holiday | null>(null);
  formData = { date: '', name: '' };
  selectedYear = signal(new Date().getFullYear());
  errorMessage = signal('');
  tableColumns = signal<TableColumn<Holiday>[]>([]);
  validationErrors = signal<string[]>([]);
  fieldErrors = signal<{ [key: string]: string }>({});
  
  // Confirm modal state
  isConfirmModalOpen = signal(false);
  confirmAction = signal<(() => void) | null>(null);
  confirmMessage = signal('คุณแน่ใจหรือไม่ว่าต้องการลบวันหยุดนี้?');

  currentYear = new Date().getFullYear();

  uniqueYears = computed(() => {
    const years = new Set(this.holidays().map(h => new Date(h.date).getFullYear()));
    years.add(this.currentYear);
    return Array.from(years).sort((a, b) => b - a);
  });

  filteredHolidays = computed(() => {
    return this.holidays().filter(h => new Date(h.date).getFullYear() === this.selectedYear());
  });

  private destroy$ = new Subject<void>();

  constructor(private dataService: DataService) {}

  ngOnInit(): void {
    this.dataService.holidays$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (hols) => this.holidays.set(hols),
      error: (error) => {
        console.error('Error loading holidays:', error);
        this.errorMessage.set('ไม่สามารถโหลดข้อมูลวันหยุดได้');
      }
    });
  }

  ngAfterViewInit(): void {
    this.tableColumns.set([
      {
        key: 'date',
        label: 'วันที่',
        width: '40%',
        template: this.dateTemplate
      },
      {
        key: 'name',
        label: 'ชื่อวันหยุด',
        width: '40%'
      },
      {
        key: 'actions',
        label: 'จัดการ',
        width: '20%',
        align: 'right',
        template: this.actionsTemplate
      }
    ]);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  handleAddClick(): void {
    this.editingHoliday.set(null);
    this.formData = { date: '', name: '' };
    this.isModalOpen.set(true);
  }

  handleEditClick(holiday: Holiday): void {
    this.editingHoliday.set(holiday);
    this.formData = { date: holiday.date, name: holiday.name };
    this.isModalOpen.set(true);
  }

  validateForm(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const fieldErrors: { [key: string]: string } = {};

    if (!this.formData.date) {
      errors.push('วันที่เป็นข้อมูลที่จำเป็น');
      fieldErrors['date'] = 'กรุณาเลือกวันที่';
    }

    const name = this.formData.name.trim();
    if (!name) {
      errors.push('ชื่อวันหยุดเป็นข้อมูลที่จำเป็น');
      fieldErrors['name'] = 'กรุณากรอกชื่อวันหยุด';
    } else if (name.length < 2) {
      errors.push('ชื่อวันหยุดต้องมีอย่างน้อย 2 ตัวอักษร');
      fieldErrors['name'] = 'ชื่อวันหยุดต้องมีอย่างน้อย 2 ตัวอักษร';
    } else if (name.length > 100) {
      errors.push('ชื่อวันหยุดต้องไม่เกิน 100 ตัวอักษร');
      fieldErrors['name'] = 'ชื่อวันหยุดต้องไม่เกิน 100 ตัวอักษร';
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

    const editing = this.editingHoliday();
    if (editing) {
      this.dataService.updateHoliday(editing.id, this.formData);
    } else {
      const newId = Math.max(...this.holidays().map(h => h.id), 0) + 1;
      this.dataService.addHoliday({
        id: newId,
        ...this.formData,
        type: 'public'
      });
    }
    this.isModalOpen.set(false);
  }

  confirmDelete(id: number): void {
    this.confirmAction.set(() => {
      this.dataService.deleteHoliday(id);
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

  getThaiDatePreview(dateStr: string): string {
    if (!dateStr) return "-";
    return formatDateThaiFull(dateStr);
  }

  trackByHolidayId(index: number, holiday: Holiday): number {
    return holiday.id;
  }
}
