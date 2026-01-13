import { Injectable, computed, signal } from '@angular/core';
import { Observable, forkJoin, of, Subject } from 'rxjs';
import { auditTime, catchError, exhaustMap, finalize } from 'rxjs/operators';
import { AvailabilityStatusKey, normalizeAvailabilityStatus } from '../shared/utils/availability-status.util';
import { MyQueueInfoResponse } from '../models/queue.model';
import { AuthService } from './auth.service';
import { QueueService } from './queue.service';
import { SignalRService } from './signalr.service';
import { TaskService } from './task.service';

@Injectable({
  providedIn: 'root',
})
export class MyStatusStore {
  private readonly refreshRequests = new Subject<void>();
  private signalRInitialized = false;

  isRefreshing = signal(false);
  myQueueInfo = signal<MyQueueInfoResponse | null>(null);
  availabilityStatus = signal<AvailabilityStatusKey>('unavailable');
  isMyTurn = computed(() => {
    const info = this.myQueueInfo();
    if (!info || !info.isInQueue) return false;
    return info.queuesRemaining === 0;
  });

  constructor(
    private authService: AuthService,
    private queueService: QueueService,
    private taskService: TaskService,
    private signalRService: SignalRService
  ) {
    // One refresh at a time; coalesce bursts (SignalR can spam)
    this.refreshRequests
      .pipe(
        auditTime(150),
        exhaustMap(() => this.doRefresh())
      )
      .subscribe((result) => this.applyRefreshResult(result));
  }

  init(): void {
    if (!this.authService.isAuthenticated()) return;
    this.requestRefresh();
    this.ensureSignalR();
  }

  requestRefresh(): void {
    this.refreshRequests.next();
  }

  private ensureSignalR(): void {
    if (this.signalRInitialized) return;
    this.signalRInitialized = true;

    this.signalRService
      .startConnection()
      .then(() => {
        // Any relevant event should refresh current employee status/queue info
        this.signalRService.queueUpdated$.subscribe(() => this.requestRefresh());
        this.signalRService.jobStatusChanged$.subscribe(() => this.requestRefresh());
        this.signalRService.employeeStatusChanged$.subscribe(() => this.requestRefresh());
      })
      .catch((err) => {
        console.error('SignalR connection failed (MyStatusStore):', err);
      });
  }

  private doRefresh(): Observable<{ queueInfo: MyQueueInfoResponse | null; tasks: any } | null> {
    if (!this.authService.isAuthenticated()) {
      this.myQueueInfo.set(null);
      this.availabilityStatus.set('unavailable');
      return of(null);
    }

    this.isRefreshing.set(true);

    return forkJoin({
      queueInfo: this.queueService.getMyQueueInfo().pipe(
        catchError((error) => {
          console.error('Error loading my queue info:', error);
          return of(null);
        })
      ),
      tasks: this.taskService.getMyTasks().pipe(
        catchError((error) => {
          console.error('Error loading my tasks for status derivation:', error);
          return of({ jobs: [] });
        })
      ),
    }).pipe(
      finalize(() => this.isRefreshing.set(false)),
      catchError(() => of({ queueInfo: null, tasks: { jobs: [] } }))
    );
  }

  private applyRefreshResult(result: { queueInfo: MyQueueInfoResponse | null; tasks: any } | null): void {
    const queueInfo = result?.queueInfo ?? null;
    const tasks = result?.tasks ?? { jobs: [] };

    if (!queueInfo || !queueInfo.isInQueue) {
      this.myQueueInfo.set(null);
      this.availabilityStatus.set('unavailable');
      return;
    }

    this.myQueueInfo.set(queueInfo);

    const manualStatuses: AvailabilityStatusKey[] = ['lunchBreak', 'unavailable', 'leave', 'offsiteCustomer'];
    const inProgressTasks = (tasks.jobs ?? []).filter((job: any) => {
      const status = job.status?.toString().toLowerCase() || '';
      return status === 'inprogress' || status === 'in_progress' || status === '2';
    });

    const rawApiStatus = (queueInfo.availabilityStatus ?? '').trim();
    if (rawApiStatus) {
      const apiStatus = normalizeAvailabilityStatus(rawApiStatus);

      // Respect manual statuses from API always
      if (manualStatuses.includes(apiStatus)) {
        this.availabilityStatus.set(apiStatus);
        return;
      }

      if (apiStatus === 'busy') {
        this.availabilityStatus.set('busy');
        return;
      }

      // apiStatus === 'available'
      this.availabilityStatus.set(inProgressTasks.length > 0 ? 'busy' : 'available');
      return;
    }

    // Fallback: use queueStatus for backward compatibility
    const queueStatusLower = queueInfo.queueStatus?.toLowerCase() || '';
    if (queueStatusLower === 'busy') {
      this.availabilityStatus.set('busy');
    } else if (queueStatusLower === 'active') {
      this.availabilityStatus.set(inProgressTasks.length > 0 ? 'busy' : 'available');
    } else {
      this.availabilityStatus.set('unavailable');
    }
  }
}

