import { Component, OnInit, OnDestroy, AfterViewInit, signal, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DataService } from '../../services/data.service';
import { Category } from '../../models/category.model';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { InputComponent } from '../../shared/components/input/input.component';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal.component';
import { ActionButtonComponent } from '../../shared/components/action-button/action-button.component';
import { TableComponent, TableColumn } from '../../shared/components/table/table.component';

@Component({
  selector: 'app-categories',
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
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.scss']
})
export class CategoriesComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('statusTemplate', { static: false }) statusTemplate!: TemplateRef<any>;
  @ViewChild('actionsTemplate', { static: false }) actionsTemplate!: TemplateRef<any>;

  categories = signal<Category[]>([]);
  isModalOpen = signal(false);
  editingCategory = signal<Category | null>(null);
  formData = { name: '' };
  errorMessage = signal('');
  validationErrors = signal<string[]>([]);
  fieldErrors = signal<{ [key: string]: string }>({});
  tableColumns = signal<TableColumn<Category>[]>([]);
  
  // Confirm modal state
  isConfirmModalOpen = signal(false);
  confirmAction = signal<(() => void) | null>(null);
  confirmMessage = signal('คุณแน่ใจหรือไม่ว่าต้องการลบหมวดหมู่นี้?');

  private destroy$ = new Subject<void>();

  constructor(private dataService: DataService) {}

  ngOnInit(): void {
    this.dataService.categories$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (cats) => this.categories.set(cats),
      error: (error) => {
        console.error('Error loading categories:', error);
        this.errorMessage.set('ไม่สามารถโหลดข้อมูลหมวดหมู่ได้');
      }
    });
  }

  ngAfterViewInit(): void {
    this.tableColumns.set([
      {
        key: 'id',
        label: 'ID',
        width: '10%'
      },
      {
        key: 'name',
        label: 'ชื่อหมวดหมู่',
        width: '40%'
      },
      {
        key: 'status',
        label: 'สถานะ',
        width: '20%',
        align: 'center',
        template: this.statusTemplate
      },
      {
        key: 'actions',
        label: 'จัดการ',
        width: '30%',
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
    this.editingCategory.set(null);
    this.formData = { name: '' };
    this.isModalOpen.set(true);
  }

  handleEditClick(category: Category): void {
    this.editingCategory.set(category);
    this.formData = { name: category.name };
    this.isModalOpen.set(true);
  }

  validateForm(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const fieldErrors: { [key: string]: string } = {};

    const name = this.formData.name.trim();
    if (!name) {
      errors.push('ชื่อหมวดหมู่เป็นข้อมูลที่จำเป็น');
      fieldErrors['name'] = 'กรุณากรอกชื่อหมวดหมู่';
    } else if (name.length < 2) {
      errors.push('ชื่อหมวดหมู่ต้องมีอย่างน้อย 2 ตัวอักษร');
      fieldErrors['name'] = 'ชื่อหมวดหมู่ต้องมีอย่างน้อย 2 ตัวอักษร';
    } else if (name.length > 100) {
      errors.push('ชื่อหมวดหมู่ต้องไม่เกิน 100 ตัวอักษร');
      fieldErrors['name'] = 'ชื่อหมวดหมู่ต้องไม่เกิน 100 ตัวอักษร';
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

    const name = this.formData.name.trim();
    const editing = this.editingCategory();
    if (editing) {
      this.dataService.editCategory(editing.id, name);
    } else {
      this.dataService.addCategory(name);
    }
    this.isModalOpen.set(false);
  }

  confirmDelete(id: number): void {
    this.confirmAction.set(() => {
      this.dataService.deleteCategory(id);
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

  toggleCategoryStatus(id: number): void {
    this.dataService.toggleCategoryStatus(id);
  }

  trackByCategoryId(index: number, cat: Category): number {
    return cat.id;
  }
}
