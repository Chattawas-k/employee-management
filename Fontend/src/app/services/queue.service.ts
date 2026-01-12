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

  getQueuesByDate(date: Date): Observable<GetQueuesByDateResponse> {
    const dateStr = date.toISOString().split('T')[0];
    return this.http.get<GetQueuesByDateResponse>(`${this.apiUrl}/date/${dateStr}`);
  }

  getQueueSummary(date: Date): Observable<QueueSummaryResponse> {
    const dateStr = date.toISOString().split('T')[0];
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

  bulkUpdateQueues(queues: Array<{ id: string; position: number; status: string }>): Observable<any> {
    return this.updateQueueOrder(queues);
  }

  archiveQueue(sourceDate: Date, targetDate?: Date): Observable<any> {
    const requestBody: { sourceDate: string; targetDate?: string } = {
      sourceDate: sourceDate.toISOString().split('T')[0]
    };
    if (targetDate) {
      requestBody.targetDate = targetDate.toISOString().split('T')[0];
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

