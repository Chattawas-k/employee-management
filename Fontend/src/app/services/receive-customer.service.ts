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

    this.confirmWalkIn({
      assigneeId: employeeId,
      autoStart: true,
      successMessage: 'รับลูกค้าเรียบร้อย'
    });
  }

  /**
   * Create the same Walk-in job as the "รับลูกค้า" flow.
   * - autoStart=true  => create job then set InProgress (same as callout button)
   * - autoStart=false => only create job (keeps it in "งานที่ต้องทำ")
   */
  confirmWalkIn(options: { assigneeId: string; autoStart: boolean; successMessage: string }): void {
    if (this.isSubmitting()) return;

    const { assigneeId, autoStart, successMessage } = options;
    if (!assigneeId) {
      this.toastService.error('ไม่พบข้อมูลพนักงาน');
      return;
    }

    this.isSubmitting.set(true);

    this.taskService
      .createJob({
        title: 'Walk-in Customer',
        customer: 'ลูกค้าทั่วไป',
        description: 'บริการลูกค้าหน้าร้าน',
        assigneeId,
        priority: JobPriority.Normal,
        channel: 'Walk-in',
      })
      .pipe(
        switchMap((createResponse) => {
          if (!autoStart) return of(createResponse);
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
        this.toastService.success(successMessage);
        this.isOpen.set(false);
        this.myStatusStore.requestRefresh();
      });
  }
}

