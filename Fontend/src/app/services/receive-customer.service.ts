import { Injectable, signal } from '@angular/core';
import { catchError, finalize, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { AuthService } from './auth.service';
import { MyStatusStore } from './my-status.store';
import { TaskService } from './task.service';
import { ToastService } from './toast.service';
import { getEmployeeIdFromToken } from '../utils/jwt.util';
import { JobPriority, JobStatus } from '../models/task.model';

@Injectable({
  providedIn: 'root',
})
export class ReceiveCustomerService {
  isOpen = signal(false);
  isSubmitting = signal(false);

  constructor(
    private authService: AuthService,
    private taskService: TaskService,
    private toastService: ToastService,
    private myStatusStore: MyStatusStore
  ) {}

  open(): void {
    if (this.isSubmitting()) return;
    this.isOpen.set(true);
  }

  close(): void {
    if (this.isSubmitting()) return;
    this.isOpen.set(false);
  }

  confirm(): void {
    if (this.isSubmitting()) return;

    const token = this.authService.getToken();
    const employeeId = getEmployeeIdFromToken(token);

    if (!employeeId) {
      this.toastService.error('ไม่พบข้อมูลพนักงาน');
      return;
    }

    this.isSubmitting.set(true);

    this.taskService
      .createJob({
        title: 'Walk-in Customer',
        customer: 'ลูกค้าทั่วไป',
        description: 'บริการลูกค้าหน้าร้าน',
        assigneeId: employeeId,
        priority: JobPriority.Normal,
        channel: 'Walk-in',
      })
      .pipe(
        switchMap((createResponse) => {
          if (!createResponse?.id) return of(null);
          return this.taskService.updateJobStatus(createResponse.id, {
            id: createResponse.id,
            status: JobStatus.InProgress,
          });
        }),
        catchError((error) => {
          console.error('Error receiving customer:', error);
          this.toastService.error('เกิดข้อผิดพลาดในการรับลูกค้า');
          return of(null);
        }),
        finalize(() => this.isSubmitting.set(false))
      )
      .subscribe((result) => {
        if (!result) return;
        this.toastService.success('รับลูกค้าเรียบร้อย');
        this.isOpen.set(false);
        this.myStatusStore.requestRefresh();
      });
  }
}

