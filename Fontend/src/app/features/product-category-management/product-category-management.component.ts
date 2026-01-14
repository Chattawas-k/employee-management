import { Component, OnInit, signal, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProductCategoryService } from '../../services/product-category.service';
import { ToastService } from '../../services/toast.service';
import { ProductCategory } from '../../models/product-category.model';
import { DataTableComponent, TableAction, TableColumn } from '../../shared/components/data-table/data-table.component';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-product-category-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, DataTableComponent],
  templateUrl: './product-category-management.component.html',
  styleUrls: ['./product-category-management.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductCategoryManagementComponent implements OnInit {
  categories = signal<ProductCategory[]>([]);
  isLoading = signal(false);
  searchTerm = signal('');
  filterStatus = signal<'all' | 'active' | 'inactive'>('all');

  // Form dialog state
  showFormDialog = signal(false);
  editingCategory = signal<ProductCategory | null>(null);
  categoryForm!: FormGroup;

  // Table columns
  columns: TableColumn[] = [
    { key: 'name', label: 'ชื่อหมวดหมู่', sortable: true },
    { key: 'description', label: 'คำอธิบาย', sortable: false },
    { key: 'isActive', label: 'สถานะ', sortable: true },
    { key: 'createdDate', label: 'สร้างเมื่อ', sortable: true },
    { key: 'actions', label: '', sortable: false, align: 'right' }
  ];

  tableActions: TableAction[] = [
    { key: 'edit', label: 'แก้ไข' },
    {
      key: 'toggle',
      label: (row) => (row?.isActive ? 'ปิดการใช้งาน' : 'เปิดการใช้งาน'),
      confirm: (row) => row?.isActive === true,
      confirmOptions: (row) => ({
        tone: 'warning',
        iconName: 'ban',
        title: 'ปิดการใช้งานหมวดหมู่สินค้า?',
        message: `คุณต้องการปิดการใช้งาน "${row?.name ?? ''}" ใช่หรือไม่?`,
        confirmText: 'ยืนยันและปิดการใช้งาน',
        cancelText: 'ยกเลิก',
      }),
    },
    {
      key: 'delete',
      label: 'ลบ',
      tone: 'danger',
      confirm: true,
      confirmOptions: (row) => ({
        tone: 'danger',
        iconName: 'trash-2',
        title: 'ลบหมวดหมู่สินค้า?',
        message: `คุณต้องการลบ "${row?.name ?? ''}" ใช่หรือไม่?`,
        confirmText: 'ยืนยันและลบ',
        cancelText: 'ยกเลิก',
      }),
    },
  ];

  constructor(
    private productCategoryService: ProductCategoryService,
    private toastService: ToastService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.categoryForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(500)]],
      isActive: [true]
    });
  }

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.isLoading.set(true);
    this.cdr.markForCheck();

    this.productCategoryService.getAll().pipe(
      catchError(error => {
        console.error('Error loading categories:', error);
        this.toastService.error('เกิดข้อผิดพลาดในการโหลดข้อมูลหมวดหมู่สินค้า');
        return of({ productCategories: [] });
      }),
      finalize(() => {
        this.isLoading.set(false);
        this.cdr.markForCheck();
      })
    ).subscribe(response => {
      this.categories.set(response.productCategories);
      this.cdr.markForCheck();
    });
  }

  getFilteredCategories(): ProductCategory[] {
    let filtered = this.categories();

    // Filter by search term
    if (this.searchTerm()) {
      const search = this.searchTerm().toLowerCase();
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(search) ||
        (c.description && c.description.toLowerCase().includes(search))
      );
    }

    // Filter by status
    if (this.filterStatus() === 'active') {
      filtered = filtered.filter(c => c.isActive);
    } else if (this.filterStatus() === 'inactive') {
      filtered = filtered.filter(c => !c.isActive);
    }

    return filtered;
  }

  getTableData(): any[] {
    return this.getFilteredCategories().map(category => ({
      ...category,
      statusBadge: `<span class="px-2 py-1 text-xs font-medium rounded-full ${category.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}">${category.isActive ? 'ใช้งาน' : 'ไม่ใช้งาน'}</span>`,
      createdDateFormatted: new Date(category.createdDate).toLocaleString('th-TH'),
      descriptionDisplay: category.description || '-'
    }));
  }

  onSearchChange(term: string): void {
    this.searchTerm.set(term);
  }

  onFilterStatusChange(status: 'all' | 'active' | 'inactive'): void {
    this.filterStatus.set(status);
  }

  onCreateClick(): void {
    this.editingCategory.set(null);
    this.categoryForm.reset({ name: '', description: '', isActive: true });
    this.showFormDialog.set(true);
  }

  onEditClick(category: ProductCategory): void {
    this.editingCategory.set(category);
    this.categoryForm.patchValue({
      name: category.name,
      description: category.description || '',
      isActive: category.isActive
    });
    this.showFormDialog.set(true);
  }

  onDeleteClick(category: ProductCategory): void {
    this.productCategoryService.delete(category.id).pipe(
      catchError(error => {
        console.error('Error deleting category:', error);
        this.toastService.error('เกิดข้อผิดพลาดในการลบหมวดหมู่สินค้า');
        return of(null);
      })
    ).subscribe(() => {
      this.toastService.success('ลบหมวดหมู่สินค้าสำเร็จ');
      this.loadCategories();
    });
  }

  onToggleActive(category: ProductCategory): void {
    const updateRequest = {
      id: category.id,
      name: category.name,
      description: category.description,
      isActive: !category.isActive
    };

    this.productCategoryService.update(category.id, updateRequest).pipe(
      catchError(error => {
        console.error('Error updating category:', error);
        this.toastService.error('เกิดข้อผิดพลาดในการอัปเดตสถานะ');
        return of(null);
      })
    ).subscribe(response => {
      if (response) {
        this.toastService.success('อัปเดตสถานะสำเร็จ');
        this.loadCategories();
      }
    });
  }

  onFormSubmit(): void {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    const formValue = this.categoryForm.value;
    const editing = this.editingCategory();

    if (editing) {
      // Update
      const updateRequest = {
        id: editing.id,
        name: formValue.name,
        description: formValue.description || undefined,
        isActive: formValue.isActive
      };

      this.productCategoryService.update(editing.id, updateRequest).pipe(
        catchError(error => {
          console.error('Error updating category:', error);
          this.toastService.error('เกิดข้อผิดพลาดในการแก้ไขหมวดหมู่สินค้า');
          return of(null);
        })
      ).subscribe(response => {
        if (response) {
          this.toastService.success('แก้ไขหมวดหมู่สินค้าสำเร็จ');
          this.showFormDialog.set(false);
          this.loadCategories();
        }
      });
    } else {
      // Create
      const createRequest = {
        name: formValue.name,
        description: formValue.description || undefined
      };

      this.productCategoryService.create(createRequest).pipe(
        catchError(error => {
          console.error('Error creating category:', error);
          this.toastService.error('เกิดข้อผิดพลาดในการเพิ่มหมวดหมู่สินค้า');
          return of(null);
        })
      ).subscribe(response => {
        if (response) {
          this.toastService.success('เพิ่มหมวดหมู่สินค้าสำเร็จ');
          this.showFormDialog.set(false);
          this.loadCategories();
        }
      });
    }
  }

  onFormCancel(): void {
    this.showFormDialog.set(false);
    this.editingCategory.set(null);
    this.categoryForm.reset();
  }

  handleTableAction(event: { action: string; row: any }): void {
    const category = this.categories().find(c => c.id === event.row.id);
    if (!category) return;

    switch (event.action) {
      case 'edit':
        this.onEditClick(category);
        break;
      case 'delete':
        this.onDeleteClick(category);
        break;
      case 'toggle':
        this.onToggleActive(category);
        break;
    }
  }
}
