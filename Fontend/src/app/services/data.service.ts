import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Employee } from '../models/employee.model';
import { Job } from '../models/job.model';
import { Schedule, Holiday, Leave } from '../models/schedule.model';
import { Category } from '../models/category.model';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private employeesSubject = new BehaviorSubject<Employee[]>(this.getInitialEmployees());
  private jobsSubject = new BehaviorSubject<Job[]>([]);
  private schedulesSubject = new BehaviorSubject<Schedule[]>([]);
  private holidaysSubject = new BehaviorSubject<Holiday[]>(this.getInitialHolidays());
  private leavesSubject = new BehaviorSubject<Leave[]>([]);
  private categoriesSubject = new BehaviorSubject<Category[]>(this.getInitialCategories());

  employees$ = this.employeesSubject.asObservable();
  jobs$ = this.jobsSubject.asObservable();
  schedules$ = this.schedulesSubject.asObservable();
  holidays$ = this.holidaysSubject.asObservable();
  leaves$ = this.leavesSubject.asObservable();
  categories$ = this.categoriesSubject.asObservable();

  get employees(): Employee[] {
    return this.employeesSubject.value;
  }

  get jobs(): Job[] {
    return this.jobsSubject.value;
  }

  get schedules(): Schedule[] {
    return this.schedulesSubject.value;
  }

  get holidays(): Holiday[] {
    return this.holidaysSubject.value;
  }

  get leaves(): Leave[] {
    return this.leavesSubject.value;
  }

  get categories(): Category[] {
    return this.categoriesSubject.value;
  }

  // Employee methods
  // Note: Employee CRUD operations are now handled by EmployeeService via API
  // These methods are kept for backward compatibility but should use EmployeeService instead
  addEmployee(employee: Employee): void {
    const current = this.employeesSubject.value;
    this.employeesSubject.next([...current, employee]);
  }

  updateEmployee(id: string, employee: Partial<Employee>): void {
    const current = this.employeesSubject.value;
    this.employeesSubject.next(
      current.map(emp => emp.id === id ? { ...emp, ...employee } : emp)
    );
  }

  deleteEmployee(id: string): void {
    const current = this.employeesSubject.value;
    this.employeesSubject.next(current.filter(emp => emp.id !== id));
  }

  // Job methods
  assignJob(employeeId: string, jobData: Partial<Job>): void {
    const current = this.jobsSubject.value;
    const employee = this.employees.find(e => e.id === employeeId);
    if (!employee) return;

    const newJob: Job = {
      id: Date.now().toString(),
      title: jobData.title || 'Walk-in Customer',
      customer: jobData.customer || 'ลูกค้าทั่วไป',
      description: jobData.description || 'ลูกค้าสนใจดูเฟอร์นิเจอร์',
      assigneeId: employeeId,
      assignee: employee.name,
      assigneeName: employee.name,
      status: 'Pending',
      priority: (jobData.priority as any) || 'Normal',
      createdDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      statusLogs: [{ status: 'Pending', timestamp: new Date().toISOString() }]
    };

    // Note: Queue position management should be handled via Queue API
    // this.updateEmployee(employeeId, { queuePos: 0, status: 'Busy' });
    // this.reorderQueue(employeeId);

    this.jobsSubject.next([...current, newJob]);
  }

  rejectJob(employeeId: string, reason: string): void {
    const employee = this.employees.find(e => e.id === employeeId);
    if (!employee) return;

    // Note: Queue position management should be handled via Queue API
    // const maxQueuePos = Math.max(...this.employees.map(e => e.queuePos), 0);
    // this.updateEmployee(employeeId, { queuePos: maxQueuePos + 1 });
    // this.reorderQueue(employeeId);
  }

  updateJobStatus(jobId: string, status: Job['status'], data?: any): void {
    const current = this.jobsSubject.value;
    this.jobsSubject.next(
      current.map(job => {
        if (job.id === jobId) {
          const updatedJob = {
            ...job,
            status,
            updatedAt: new Date().toISOString(),
            statusLogs: [
              ...(job.statusLogs || []),
              { status, timestamp: new Date().toISOString() }
            ]
          };
          if (data && status === 'Done') {
            updatedJob.report = data;
          }
          return updatedJob;
        }
        return job;
      })
    );
  }

  reorderQueue(skipEmployeeId?: string): void {
    // Note: Queue management should be handled via Queue API
    // This method is kept for backward compatibility but queue operations should use QueueService
    // Queue reordering logic removed - use Queue API instead
    // Employee model no longer has queuePos property - queue management is handled via Queue entity
  }

  // Schedule methods
  updateEmployeeSchedule(schedule: Schedule): void {
    const current = this.schedulesSubject.value;
    const existing = current.find(s => s.empId === schedule.empId);
    if (existing) {
      this.schedulesSubject.next(
        current.map(s => s.empId === schedule.empId ? schedule : s)
      );
    } else {
      this.schedulesSubject.next([...current, schedule]);
    }
  }

  // Holiday methods
  addHoliday(holiday: Holiday): void {
    const current = this.holidaysSubject.value;
    // Check if holiday with same date already exists
    const exists = current.find(h => h.date === holiday.date);
    if (!exists) {
      this.holidaysSubject.next([...current, holiday]);
    }
  }

  updateHoliday(id: number, holiday: Partial<Holiday>): void {
    const current = this.holidaysSubject.value;
    this.holidaysSubject.next(
      current.map(h => h.id === id ? { ...h, ...holiday } : h)
    );
  }

  deleteHoliday(id: number): void {
    const current = this.holidaysSubject.value;
    this.holidaysSubject.next(current.filter(h => h.id !== id));
  }

  // Leave methods
  addLeave(leave: Leave): void {
    const current = this.leavesSubject.value;
    this.leavesSubject.next([...current, leave]);
  }

  deleteLeave(id: number): void {
    const current = this.leavesSubject.value;
    this.leavesSubject.next(current.filter(l => l.id !== id));
  }

  // Category methods
  addCategory(name: string): void {
    const current = this.categoriesSubject.value;
    const newId = Math.max(...current.map(c => c.id), 0) + 1;
    const newCategory: Category = {
      id: newId,
      name,
      status: 'Active'
    };
    this.categoriesSubject.next([...current, newCategory]);
  }

  addCategoryFull(category: Category): void {
    const current = this.categoriesSubject.value;
    this.categoriesSubject.next([...current, category]);
  }

  updateCategory(id: number, category: Partial<Category>): void {
    const current = this.categoriesSubject.value;
    this.categoriesSubject.next(
      current.map(c => c.id === id ? { ...c, ...category } : c)
    );
  }

  editCategory(id: number, name: string): void {
    const current = this.categoriesSubject.value;
    this.categoriesSubject.next(
      current.map(c => c.id === id ? { ...c, name } : c)
    );
  }

  toggleCategoryStatus(id: number): void {
    const current = this.categoriesSubject.value;
    this.categoriesSubject.next(
      current.map(c => c.id === id ? { ...c, status: c.status === 'Active' ? 'Inactive' : 'Active' } : c)
    );
  }

  deleteCategory(id: number): void {
    const current = this.categoriesSubject.value;
    this.categoriesSubject.next(current.filter(c => c.id !== id));
  }

  // Initial data
  // Note: Employee data is now managed by EmployeeService via API
  // This is kept for backward compatibility with other features that might still use mock data
  private getInitialEmployees(): Employee[] {
    return [];
    // Old mock data - commented out since Employee model changed to use Guid (string) and API
    // return [
    //   { id: '1', name: 'สมชาย ใจดี', phone: '', username: '', status: 'Active', positionId: '', departmentName: 'Furniture', positionName: 'Sales', avatar: '' },
    //   { id: '2', name: 'สมหญิง รักงาน', phone: '', username: '', status: 'Active', positionId: '', departmentName: 'Furniture', positionName: 'Sales', avatar: '' },
    //   { id: '3', name: 'วิชัย ขยัน', phone: '', username: '', status: 'Active', positionId: '', departmentName: 'Furniture', positionName: 'Sales', avatar: '' }
    // ];
  }

  private getInitialCategories(): Category[] {
    return [
      { id: 1, name: 'โซฟาและห้องนั่งเล่น (Living Room)', status: 'Active' },
      { id: 2, name: 'ชุดห้องนอน (Bedroom)', status: 'Active' },
      { id: 3, name: 'ชุดโต๊ะทานข้าว (Dining)', status: 'Active' },
      { id: 4, name: 'เฟอร์นิเจอร์สำนักงาน (Office)', status: 'Active' },
      { id: 5, name: 'ของตกแต่งบ้าน (Home Decor)', status: 'Active' },
      { id: 6, name: 'บริการออกแบบ (Design Service)', status: 'Active' }
    ];
  }

  private getInitialHolidays(): Holiday[] {
    return [
      { id: 1, date: '2024-01-01', name: 'วันขึ้นปีใหม่', type: 'public' },
      { id: 2, date: '2024-04-13', name: 'วันสงกรานต์', type: 'public' }
    ];
  }
}

