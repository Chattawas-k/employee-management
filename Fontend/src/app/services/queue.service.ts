import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { GetQueuesByDateResponse, QueueSummaryResponse, UpdateMyQueueStatusRequest, UpdateMyQueueStatusResponse, MyQueueInfoResponse, MigrateInactiveStatusRequest, MigrateInactiveStatusResponse } from '../models/queue.model';
import { environment } from '../../environments/environment';
import { AvailabilityStatusKey } from '../shared/utils/availability-status.util';

@Injectable({
  providedIn: 'root'
})
export class QueueService {
  private apiUrl = `${environment.apiUrl}/queue`;
  private jobApiUrl = `${environment.apiUrl}/job`;

  constructor(private http: HttpClient) {}

  private formatBangkokDate(date: Date): string {
    // Always format as YYYY-MM-DD in Asia/Bangkok (avoid toISOString() UTC day shift)
    try {
      const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Bangkok',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).formatToParts(date);

      const get = (type: string) => parts.find(p => p.type === type)?.value ?? '';
      const y = get('year');
      const m = get('month');
      const d = get('day');
      if (y && m && d) return `${y}-${m}-${d}`;
    } catch {
      // Fallback below
    }

    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  getQueuesByDate(date: Date): Observable<GetQueuesByDateResponse> {
    const dateStr = this.formatBangkokDate(date);
    return this.http.get<GetQueuesByDateResponse>(`${this.apiUrl}/date/${dateStr}`);
  }

  getQueueSummary(date: Date): Observable<QueueSummaryResponse> {
    const dateStr = this.formatBangkokDate(date);
    let params = new HttpParams().set('date', dateStr);
    return this.http.get<QueueSummaryResponse>(`${this.jobApiUrl}/queue-summary`, { params });
  }

  updateMyQueueStatus(status: AvailabilityStatusKey): Observable<UpdateMyQueueStatusResponse> {
    const requestBody: UpdateMyQueueStatusRequest = { status };
    return this.http.put<UpdateMyQueueStatusResponse>(`${this.apiUrl}/my-status`, requestBody);
  }

  migrateInactiveStatus(targetStatus: 'LunchBreak' | 'Unavailable' | 'Break'): Observable<MigrateInactiveStatusResponse> {
    const requestBody: MigrateInactiveStatusRequest = { targetStatus };
    return this.http.post<MigrateInactiveStatusResponse>(`${this.apiUrl}/migrate-inactive-status`, requestBody);
  }

  updateQueueOrder(queues: Array<{ id: string; position: number; status: string }>): Observable<any> {
    // Map status to backend QueueStatus enum
    const queueItems = queues.map(queue => {
      let normalizedStatus: 'Active' | 'Busy' | 'Inactive' = 'Active';
      if (typeof queue.status === 'string') {
        const statusLower = queue.status.toLowerCase();
        if (statusLower === 'busy') normalizedStatus = 'Busy';
        else if (statusLower === 'inactive') normalizedStatus = 'Inactive';
        else if (statusLower === 'active') normalizedStatus = 'Active';
      }
      
      return {
        id: queue.id,
        position: queue.position,
        status: normalizedStatus
      };
    });
    
    return this.http.put(`${this.apiUrl}/bulk-update`, { queues: queueItems });
  }

  deleteQueue(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  bulkUpdateQueues(
    payload: Array<{ id: string; position: number; status: string }> | { queues: Array<{ id: string; position: number; status: string }>; deletedQueueIds?: string[] }
  ): Observable<any> {
    // Backward compatibility: allow passing just an array (old signature)
    const queues = Array.isArray(payload) ? payload : payload.queues;
    const deletedQueueIds = Array.isArray(payload) ? [] : (payload.deletedQueueIds ?? []);

    // Map status to backend QueueStatus enum
    const queueItems = queues.map((queue: any) => {
      let normalizedStatus: 'Active' | 'Busy' | 'Inactive' = 'Active';
      if (typeof queue.status === 'string') {
        const statusLower = queue.status.toLowerCase();
        if (statusLower === 'busy') normalizedStatus = 'Busy';
        else if (statusLower === 'inactive') normalizedStatus = 'Inactive';
        else if (statusLower === 'active') normalizedStatus = 'Active';
      }
      return {
        id: queue.id,
        position: queue.position,
        status: normalizedStatus
      };
    });

    return this.http.put(`${this.apiUrl}/bulk-update`, { queues: queueItems, deletedQueueIds });
  }

  archiveQueue(sourceDate: Date, targetDate?: Date): Observable<any> {
    const requestBody: { sourceDate: string; targetDate?: string } = {
      sourceDate: this.formatBangkokDate(sourceDate)
    };
    if (targetDate) {
      requestBody.targetDate = this.formatBangkokDate(targetDate);
    }
    return this.http.post(`${this.apiUrl}/archive`, requestBody);
  }

  createQueue(request: { employeeId: string; position: number; status: 'Active' | 'Busy' | 'Inactive'; queueDate: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}`, {
      employeeId: request.employeeId,
      position: request.position,
      status: request.status,
      queueDate: request.queueDate
    });
  }

  getMyQueueInfo(): Observable<MyQueueInfoResponse> {
    return this.http.get<MyQueueInfoResponse>(`${this.apiUrl}/my-info`);
  }
}

