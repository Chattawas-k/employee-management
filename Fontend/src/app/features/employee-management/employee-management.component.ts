import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmployeeService } from '../../services/employee.service';
import { EmployeeSearchItem, EmployeeSearchRequest, EmployeeSearchResponse } from '../../models/employee.model';
import { EmployeeDialogComponent } from '../../shared/components/employee-dialog/employee-dialog.component';
import { ToastService } from '../../services/toast.service';
import { catchError, debounceTime, distinctUntilChanged, Subject, switchMap, of, Observable } from 'rxjs';

@Component({
  selector: 'app-employee-management',
  standalone: true,
  imports: [CommonModule, FormsModule, EmployeeDialogComponent],
  templateUrl: './employee-management.component.html',
  styleUrls: ['./employee-management.component.scss']
})
export class EmployeeManagementComponent implements OnInit {
  employees = signal<EmployeeSearchItem[]>([]);
  isLoading = signal(false);
  searchTerm = signal('');
  currentPage = signal(1);
  pageSize = signal(10);
  totalCount = signal(0);
  totalPages = signal(0);
  
  selectedEmployee = signal<EmployeeSearchItem | null>(null);
  isDialogOpen = signal(false);
  
  private searchSubject = new Subject<string>();

  constructor(
    private employeeService: EmployeeService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadEmployees();
    
    // Setup debounced search
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => {
        this.searchTerm.set(term);
        this.currentPage.set(1);
        return this.loadEmployeesInternal();
      })
    ).subscribe({
      next: (response) => {
        this.employees.set(response.items);
        this.totalCount.set(response.totalCount);
        this.totalPages.set(response.totalPages);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading employees:', error);
        this.toastService.error('เกิดข้อผิดพลาดในการโหลดข้อมูลพนักงาน');
        this.isLoading.set(false);
      }
    });
  }

  onSearchChange(term: string): void {
    this.searchSubject.next(term);
  }

  loadEmployees(): void {
    this.loadEmployeesInternal().subscribe({
      next: (response) => {
        this.employees.set(response.items);
        this.totalCount.set(response.totalCount);
        this.totalPages.set(response.totalPages);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading employees:', error);
        this.toastService.error('เกิดข้อผิดพลาดในการโหลดข้อมูลพนักงาน');
        this.isLoading.set(false);
      }
    });
  }

  private loadEmployeesInternal(): Observable<EmployeeSearchResponse> {
    this.isLoading.set(true);
    
    const request: EmployeeSearchRequest = {
      keyword: this.searchTerm() || undefined,
      pageNumber: this.currentPage(),
      pageSize: this.pageSize(),
      sortBy: 'name', // Backend ต้องการ lowercase
      sortDirection: 'asc' // เรียงตามชื่อพนักงานจาก A-Z
    };

    return this.employeeService.search(request).pipe(
      catchError(error => {
        console.error('Error loading employees:', error);
        this.toastService.error('เกิดข้อผิดพลาดในการโหลดข้อมูลพนักงาน');
        this.isLoading.set(false);
        return of({
          items: [],
          pageNumber: 1,
          pageSize: 10,
          totalCount: 0,
          totalPages: 0,
          hasPreviousPage: false,
          hasNextPage: false
        } as EmployeeSearchResponse);
      })
    );
  }

  onAddEmployee(): void {
    this.selectedEmployee.set(null);
    this.isDialogOpen.set(true);
  }

  onEditEmployee(employee: EmployeeSearchItem): void {
    this.selectedEmployee.set(employee);
    this.isDialogOpen.set(true);
  }

  onDeleteEmployee(employee: EmployeeSearchItem): void {
    if (confirm(`คุณต้องการลบพนักงาน "${employee.name}" ใช่หรือไม่?`)) {
      this.employeeService.delete(employee.id).subscribe({
        next: () => {
          this.toastService.success('ลบพนักงานสำเร็จ');
          this.loadEmployees();
        },
        error: (error) => {
          console.error('Error deleting employee:', error);
          this.toastService.error('เกิดข้อผิดพลาดในการลบพนักงาน');
        }
      });
    }
  }

  onDialogClose(): void {
    this.isDialogOpen.set(false);
    this.selectedEmployee.set(null);
  }

  onDialogSaved(): void {
    this.loadEmployees();
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadEmployees();
  }

  getStatusClass(status: string): string {
    return status === 'Active' 
      ? 'bg-green-100 text-green-700' 
      : 'bg-gray-100 text-gray-700';
  }

  getStatusText(status: string): string {
    return status === 'Active' ? 'ใช้งาน' : 'ไม่ใช้งาน';
  }

  getAvatarUrl(employee: EmployeeSearchItem): string {
    if (employee.avatar) {
      return employee.avatar;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name)}&background=6366f1&color=fff&size=128`;
  }

  getInitials(name: string): string {
    const words = name.trim().split(/\s+/);
    if (words.length === 0) return '';
    if (words.length === 1) return words[0].charAt(0).toUpperCase();
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  }

  Math = Math; // Expose Math to template
}
