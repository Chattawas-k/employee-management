import { Component, OnInit, AfterViewInit, OnDestroy, signal, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { EmployeeService } from '../../services/employee.service';
import { PositionService, Position } from '../../services/position.service';
import { DepartmentService, Department } from '../../services/department.service';
import { Employee, EmployeeStatus, PaginatedList, EmployeeAddRequest, EmployeeUpdateRequest } from '../../models/employee.model';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { BadgeComponent } from '../../shared/components/badge/badge.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { TableComponent, TableColumn, TablePagination, SortDirection } from '../../shared/components/table/table.component';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal.component';
import { InputComponent } from '../../shared/components/input/input.component';
import { ActionButtonComponent } from '../../shared/components/action-button/action-button.component';

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ModalComponent,
    ButtonComponent,
    AvatarComponent,
    BadgeComponent,
    IconComponent,
    TableComponent,
    ConfirmModalComponent,
    InputComponent,
    ActionButtonComponent
  ],
  templateUrl: './employees.component.html',
  styleUrls: ['./employees.component.scss']
})
export class EmployeesComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('nameTemplate', { static: false }) nameTemplate!: TemplateRef<any>;
  @ViewChild('statusTemplate', { static: false }) statusTemplate!: TemplateRef<any>;
  @ViewChild('actionsTemplate', { static: false }) actionsTemplate!: TemplateRef<any>;

  employees = signal<Employee[]>([]);
  paginatedData = signal<PaginatedList<Employee> | null>(null);
  isModalOpen = signal(false);
  isLoading = signal(false);
  errorMessage = signal('');
  editingId = signal<string | null>(null);
  
  // Confirm modal state
  isConfirmModalOpen = signal(false);
  confirmAction = signal<(() => void) | null>(null);
  confirmMessage = signal('คุณแน่ใจหรือไม่ว่าต้องการลบพนักงานคนนี้?');
  
  // Validation state
  validationErrors = signal<string[]>([]);
  fieldErrors = signal<{ [key: string]: string }>({});
  
  positions = signal<Position[]>([]);
  departments = signal<Department[]>([]);
  
  searchKeyword = signal('');
  currentPage = signal(1);
  pageSize = signal(10);
  sortBy = signal<string | null>(null);
  sortDirection = signal<SortDirection>(null);
  
  // Filters
  filterStatus = signal<EmployeeStatus | 'All'>('All');
  filterDepartmentId = signal<string>('All');
  filterPositionId = signal<string>('All');

  // Table columns - will be initialized in ngAfterViewInit
  tableColumns = signal<TableColumn<Employee>[]>([]);

  formData = {
    name: '',
    phone: '',
    status: 'Active' as EmployeeStatus,
    departmentId: '',
    positionId: '',
    avatar: ''
  };

  constructor(
    private employeeService: EmployeeService,
    private positionService: PositionService,
    private departmentService: DepartmentService
  ) {}

  ngOnInit(): void {
    this.loadDepartments();
    this.loadEmployees();
  }

  ngAfterViewInit(): void {
    // Initialize table columns with template references
    this.tableColumns.set([
      {
        key: 'name',
        label: 'ชื่อ',
        sortable: true,
        width: '30%',
        template: this.nameTemplate
      },
      {
        key: 'departmentName',
        label: 'แผนก',
        sortable: true,
        width: '20%'
      },
      {
        key: 'positionName',
        label: 'ตำแหน่ง',
        sortable: true,
        width: '20%'
      },
      {
        key: 'status',
        label: 'สถานะ',
        sortable: true,
        width: '15%',
        align: 'center',
        template: this.statusTemplate
      },
      {
        key: 'actions',
        label: 'จัดการ',
        width: '15%',
        align: 'right',
        template: this.actionsTemplate
      }
    ]);
  }

  loadDepartments(): void {
    this.departmentService.getAll().pipe(takeUntil(this.destroy$)).subscribe({
      next: (depts) => {
        this.departments.set(depts.filter(d => d.isActive));
        if (depts.length > 0 && !this.formData.departmentId) {
          this.formData.departmentId = depts[0].id;
          this.loadPositions(depts[0].id);
        }
      },
      error: (error) => {
        console.error('Error loading departments:', error);
        this.errorMessage.set('ไม่สามารถโหลดข้อมูลแผนกได้');
      }
    });
  }

  loadPositions(departmentId: string): void {
    this.positionService.getAll(departmentId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (positions) => {
        this.positions.set(positions.filter(p => p.isActive));
        if (positions.length > 0 && !this.formData.positionId) {
          this.formData.positionId = positions[0].id;
        }
      },
      error: (error) => {
        console.error('Error loading positions:', error);
        this.errorMessage.set('ไม่สามารถโหลดข้อมูลตำแหน่งได้');
      }
    });
  }

  loadEmployees(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    
    // Prepare filter parameters
    const statusFilter = this.filterStatus();
    const status: EmployeeStatus | undefined = statusFilter !== 'All' ? statusFilter : undefined;
    const departmentId = this.filterDepartmentId() !== 'All' ? this.filterDepartmentId() : undefined;
    const positionId = this.filterPositionId() !== 'All' ? this.filterPositionId() : undefined;
    
    this.employeeService.search({
      keyword: this.searchKeyword() || undefined,
      pageNumber: this.currentPage(),
      pageSize: this.pageSize(),
      sortBy: this.sortBy() || undefined,
      sortDirection: this.sortDirection() || undefined,
      status: status,
      departmentId: departmentId,
      positionId: positionId
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        this.paginatedData.set(data);
        this.employees.set(data.items);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading employees:', error);
        this.errorMessage.set('ไม่สามารถโหลดข้อมูลพนักงานได้');
        this.isLoading.set(false);
      }
    });
  }

  onSearch(): void {
    this.currentPage.set(1);
    this.loadEmployees();
  }

  onFilterChange(): void {
    this.currentPage.set(1);
    this.loadEmployees();
  }

  clearFilters(): void {
    this.searchKeyword.set('');
    this.filterStatus.set('All');
    this.filterDepartmentId.set('All');
    this.filterPositionId.set('All');
    this.currentPage.set(1);
    this.loadEmployees();
  }

  hasActiveFilters(): boolean {
    return this.searchKeyword().trim() !== '' ||
           this.filterStatus() !== 'All' ||
           this.filterDepartmentId() !== 'All' ||
           this.filterPositionId() !== 'All';
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadEmployees();
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(1);
    this.loadEmployees();
  }

  onSortChange(sort: { key: string; direction: SortDirection }): void {
    this.sortBy.set(sort.direction ? sort.key : null);
    this.sortDirection.set(sort.direction);
    this.currentPage.set(1);
    this.loadEmployees();
  }

  getTablePagination(): TablePagination | null {
    const data = this.paginatedData();
    if (!data) return null;
    
    return {
      pageNumber: data.pageNumber,
      pageSize: this.pageSize(),
      totalPages: data.totalPages,
      totalCount: data.totalCount,
      hasPreviousPage: data.hasPreviousPage,
      hasNextPage: data.hasNextPage
    };
  }

  handleAddClick(): void {
    this.editingId.set(null);
    this.formData = {
      name: '',
      phone: '',
      status: 'Active',
      departmentId: this.departments().length > 0 ? this.departments()[0].id : '',
      positionId: '',
      avatar: ''
    };
    if (this.departments().length > 0) {
      this.loadPositions(this.departments()[0].id);
    }
    this.isModalOpen.set(true);
  }

  handleEditClick(emp: Employee): void {
    this.editingId.set(emp.id);
    
    // First load positions to get department info
    this.positionService.getAll().pipe(takeUntil(this.destroy$)).subscribe({
      next: (positions) => {
        const position = positions.find(p => p.id === emp.positionId);
        if (position) {
          this.formData = {
            name: emp.name,
            phone: emp.phone || '',
            status: emp.status,
            departmentId: position.departmentId,
            positionId: emp.positionId,
            avatar: emp.avatar || ''
          };
          this.loadPositions(position.departmentId);
        } else {
          this.formData = {
            name: emp.name,
            phone: emp.phone || '',
            status: emp.status,
            departmentId: this.departments().length > 0 ? this.departments()[0].id : '',
            positionId: emp.positionId,
            avatar: emp.avatar || ''
          };
        }
        this.isModalOpen.set(true);
      },
      error: () => {
        this.formData = {
          name: emp.name,
          phone: emp.phone || '',
          status: emp.status,
          departmentId: this.departments().length > 0 ? this.departments()[0].id : '',
          positionId: emp.positionId,
          avatar: emp.avatar || ''
        };
        this.isModalOpen.set(true);
      }
    });
  }

  validateForm(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const fieldErrors: { [key: string]: string } = {};

    // Validate name
    const name = this.formData.name.trim();
    if (!name) {
      errors.push('ชื่อ-นามสกุลเป็นข้อมูลที่จำเป็น');
      fieldErrors['name'] = 'กรุณากรอกชื่อ-นามสกุล';
    } else if (name.length < 2) {
      errors.push('ชื่อ-นามสกุลต้องมีอย่างน้อย 2 ตัวอักษร');
      fieldErrors['name'] = 'ชื่อ-นามสกุลต้องมีอย่างน้อย 2 ตัวอักษร';
    } else if (name.length > 100) {
      errors.push('ชื่อ-นามสกุลต้องไม่เกิน 100 ตัวอักษร');
      fieldErrors['name'] = 'ชื่อ-นามสกุลต้องไม่เกิน 100 ตัวอักษร';
    }

    // Validate phone (optional, but if provided must be valid)
    if (this.formData.phone && this.formData.phone.trim()) {
      const phone = this.formData.phone.trim();
      // Thai phone format: 9-10 digits, optional +66 prefix
      const phoneRegex = /^(\+66)?[0-9]{9,10}$/;
      const cleanedPhone = phone.replace(/[\s-]/g, ''); // Remove spaces and dashes
      if (!phoneRegex.test(cleanedPhone)) {
        errors.push('เบอร์โทรศัพท์ไม่ถูกต้อง (ต้องเป็นตัวเลข 9-10 หลัก หรือมี +66 นำหน้า)');
        fieldErrors['phone'] = 'เบอร์โทรศัพท์ไม่ถูกต้อง';
      }
    }

    // Validate positionId
    if (!this.formData.positionId) {
      errors.push('ตำแหน่งเป็นข้อมูลที่จำเป็น');
      fieldErrors['positionId'] = 'กรุณาเลือกตำแหน่ง';
    }

    // Validate status
    if (!this.formData.status || (this.formData.status !== 'Active' && this.formData.status !== 'Inactive')) {
      errors.push('สถานะเป็นข้อมูลที่จำเป็น');
      fieldErrors['status'] = 'กรุณาเลือกสถานะ';
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

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.validationErrors.set([]);
    this.fieldErrors.set({});

    const id = this.editingId();
    if (id) {
      // Update - ส่งเฉพาะข้อมูลที่ Backend ต้องการ (ไม่รวม departmentId)
      const updateData: EmployeeUpdateRequest = {
        id,
        name: this.formData.name,
        phone: this.formData.phone || undefined,
        status: this.formData.status,
        positionId: this.formData.positionId,
        avatar: this.formData.avatar || undefined
      };
      this.employeeService.update(id, updateData).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.isModalOpen.set(false);
          this.loadEmployees();
        },
        error: (error) => {
          console.error('Error updating employee:', error);
          this.errorMessage.set('ไม่สามารถอัปเดตข้อมูลพนักงานได้');
          this.isLoading.set(false);
        }
      });
    } else {
      // Create - ส่งเฉพาะข้อมูลที่ Backend ต้องการ (ไม่รวม departmentId)
      const createData: EmployeeAddRequest = {
        name: this.formData.name,
        phone: this.formData.phone || undefined,
        status: this.formData.status,
        positionId: this.formData.positionId,
        avatar: this.formData.avatar || undefined
      };
      this.employeeService.create(createData).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.isModalOpen.set(false);
          this.loadEmployees();
        },
        error: (error) => {
          console.error('Error creating employee:', error);
          this.errorMessage.set('ไม่สามารถสร้างพนักงานใหม่ได้');
          this.isLoading.set(false);
        }
      });
    }
  }

  handleDelete(id: string): void {
    this.confirmAction.set(() => {
      this.isLoading.set(true);
      this.employeeService.delete(id).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.loadEmployees();
          this.isConfirmModalOpen.set(false);
        },
        error: (error) => {
          console.error('Error deleting employee:', error);
          this.errorMessage.set('ไม่สามารถลบพนักงานได้');
          this.isLoading.set(false);
          this.isConfirmModalOpen.set(false);
        }
      });
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

  onDepartmentChange(departmentId: string): void {
    this.formData.positionId = '';
    this.loadPositions(departmentId);
  }

  onFilterDepartmentChange(departmentId: string): void {
    this.filterDepartmentId.set(departmentId);
    this.filterPositionId.set('All');
    if (departmentId !== 'All') {
      this.loadPositions(departmentId);
    } else {
      this.positions.set([]);
    }
    this.onFilterChange();
  }

  getStatusBadge(status: EmployeeStatus): string {
    // Backend sends enum as camelCase ("active", "inactive") due to JsonStringEnumConverter
    // Normalize to handle both cases: "active" -> "Active", "inactive" -> "Inactive"
    const statusStr = String(status);
    const normalizedStatus = statusStr.charAt(0).toUpperCase() + statusStr.slice(1).toLowerCase();
    return normalizedStatus === 'Active' ? 'Active' : 'Inactive';
  }

  trackByEmployeeId(index: number, emp: Employee): string {
    return emp.id;
  }

  // Expose Math for template
  Math = Math;

  private destroy$ = new Subject<void>();

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

