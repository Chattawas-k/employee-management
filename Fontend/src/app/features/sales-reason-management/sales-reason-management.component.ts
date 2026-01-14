import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { DataTableComponent, TableColumn } from '../../shared/components/data-table/data-table.component';
import { ToastService } from '../../services/toast.service';
import { SalesReasonService } from '../../services/sales-reason.service';
import { SalesReasonDto, SalesReasonType } from '../../models/sales-reason.model';

@Component({
  selector: 'app-sales-reason-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DataTableComponent],
  templateUrl: './sales-reason-management.component.html',
  styleUrls: ['./sales-reason-management.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SalesReasonManagementComponent implements OnInit {
  activeType = signal<SalesReasonType>('pendingDecision');
  reasons = signal<SalesReasonDto[]>([]);
  isLoading = signal(false);
  searchTerm = signal('');

  // Form dialog state
  showFormDialog = signal(false);
  editingReason = signal<SalesReasonDto | null>(null);
  reasonForm: FormGroup;

  columns: TableColumn[] = [
    { key: 'sortOrder', label: 'ลำดับ', sortable: true },
    { key: 'label', label: 'เหตุผล', sortable: true },
    { key: 'isActive', label: 'สถานะ', sortable: true },
    { key: 'actions', label: 'การดำเนินการ', sortable: false }
  ];

  headerTitle = computed(() =>
    this.activeType() === 'pendingDecision'
      ? 'เหตุผลระหว่างตัดสินใจ'
      : 'เหตุผลปิดการขายไม่สำเร็จ'
  );

  constructor(
    private salesReasonService: SalesReasonService,
    private toastService: ToastService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.reasonForm = this.fb.group({
      label: ['', [Validators.required, Validators.maxLength(200)]],
      isActive: [true],
      sortOrder: [0, [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    this.loadReasons();
  }

  setType(type: SalesReasonType): void {
    this.activeType.set(type);
    this.searchTerm.set('');
    this.loadReasons();
  }

  loadReasons(): void {
    this.isLoading.set(true);
    this.cdr.markForCheck();

    this.salesReasonService.getByType(this.activeType(), true).pipe(
      catchError(error => {
        console.error('Error loading sales reasons:', error);
        this.toastService.error('เกิดข้อผิดพลาดในการโหลดเหตุผล');
        return of({ reasons: [] as SalesReasonDto[] });
      }),
      finalize(() => {
        this.isLoading.set(false);
        this.cdr.markForCheck();
      })
    ).subscribe(res => {
      this.reasons.set(res.reasons || []);
      this.cdr.markForCheck();
    });
  }

  getFilteredReasons(): SalesReasonDto[] {
    const term = this.searchTerm().trim().toLowerCase();
    let list = this.reasons();

    if (term) {
      list = list.filter(r => r.label.toLowerCase().includes(term));
    }

    return list.slice().sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.label.localeCompare(b.label));
  }

  getTableData(): any[] {
    return this.getFilteredReasons().map(r => ({
      ...r,
      statusBadge: `<span class=\"px-2 py-1 text-xs font-medium rounded-full ${r.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}\">${r.isActive ? 'ใช้งาน' : 'ไม่ใช้งาน'}</span>`
    }));
  }

  onSearchChange(term: string): void {
    this.searchTerm.set(term);
  }

  onCreateClick(): void {
    this.editingReason.set(null);
    this.reasonForm.reset({ label: '', isActive: true, sortOrder: 0 });
    this.showFormDialog.set(true);
  }

  onEditClick(reason: SalesReasonDto): void {
    this.editingReason.set(reason);
    this.reasonForm.reset({
      label: reason.label,
      isActive: reason.isActive,
      sortOrder: reason.sortOrder ?? 0
    });
    this.showFormDialog.set(true);
  }

  onDeleteClick(reason: SalesReasonDto): void {
    if (!confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบเหตุผล \"${reason.label}\"?`)) return;

    this.salesReasonService.delete(reason.id).pipe(
      catchError(error => {
        console.error('Error deleting reason:', error);
        this.toastService.error('เกิดข้อผิดพลาดในการลบเหตุผล');
        return of(null);
      })
    ).subscribe(res => {
      if (res === null) return;
      this.toastService.success('ลบเหตุผลสำเร็จ');
      this.loadReasons();
    });
  }

  onToggleActive(reason: SalesReasonDto): void {
    const req = {
      id: reason.id,
      type: reason.type,
      label: reason.label,
      isActive: !reason.isActive,
      sortOrder: reason.sortOrder
    };

    this.salesReasonService.update(reason.id, req).pipe(
      catchError(error => {
        console.error('Error updating reason:', error);
        this.toastService.error('เกิดข้อผิดพลาดในการอัปเดตสถานะ');
        return of(null);
      })
    ).subscribe(res => {
      if (!res) return;
      this.toastService.success('อัปเดตสถานะสำเร็จ');
      this.loadReasons();
    });
  }

  onFormSubmit(): void {
    if (this.reasonForm.invalid) {
      this.reasonForm.markAllAsTouched();
      return;
    }

    const formValue = this.reasonForm.value;
    const editing = this.editingReason();

    if (editing) {
      const req = {
        id: editing.id,
        type: this.activeType(),
        label: formValue.label,
        isActive: formValue.isActive,
        sortOrder: Number(formValue.sortOrder ?? 0)
      };

      this.salesReasonService.update(editing.id, req).pipe(
        catchError(error => {
          console.error('Error updating reason:', error);
          this.toastService.error('เกิดข้อผิดพลาดในการแก้ไขเหตุผล');
          return of(null);
        })
      ).subscribe(res => {
        if (!res) return;
        this.toastService.success('แก้ไขเหตุผลสำเร็จ');
        this.showFormDialog.set(false);
        this.loadReasons();
      });
    } else {
      const req = {
        type: this.activeType(),
        label: formValue.label,
        isActive: true,
        sortOrder: Number(formValue.sortOrder ?? 0)
      };

      this.salesReasonService.create(req).pipe(
        catchError(error => {
          console.error('Error creating reason:', error);
          this.toastService.error('เกิดข้อผิดพลาดในการเพิ่มเหตุผล');
          return of(null);
        })
      ).subscribe(res => {
        if (!res) return;
        this.toastService.success('เพิ่มเหตุผลสำเร็จ');
        this.showFormDialog.set(false);
        this.loadReasons();
      });
    }
  }

  onFormCancel(): void {
    this.showFormDialog.set(false);
    this.editingReason.set(null);
    this.reasonForm.reset();
  }

  handleTableAction(event: { action: string; row: any }): void {
    const reason = this.reasons().find(r => r.id === event.row.id);
    if (!reason) return;

    switch (event.action) {
      case 'edit':
        this.onEditClick(reason);
        break;
      case 'delete':
        this.onDeleteClick(reason);
        break;
      case 'toggle':
        this.onToggleActive(reason);
        break;
    }
  }
}

