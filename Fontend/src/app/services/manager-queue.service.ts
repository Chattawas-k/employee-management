import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ManagerTicket } from '../models/manager.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ManagerQueueService {
  private apiUrl = `${environment.apiUrl}/manager/queue`;

  constructor(private http: HttpClient) {}

  getTickets(
    status?: string, 
    dateFrom?: Date, 
    dateTo?: Date,
    channel?: string,
    category?: string,
    assignedStaffId?: string,
    isSlaAtRisk?: boolean,
    isEscalated?: boolean,
    pageNumber: number = 1,
    pageSize: number = 50
  ): Observable<{ tickets: ManagerTicket[]; totalCount: number; pageNumber: number; pageSize: number; totalPages: number }> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());
    
    if (status) params = params.set('status', status);
    if (dateFrom) params = params.set('dateFrom', dateFrom.toISOString());
    if (dateTo) params = params.set('dateTo', dateTo.toISOString());
    if (channel) params = params.set('channel', channel);
    if (category) params = params.set('category', category);
    if (assignedStaffId) params = params.set('assignedStaffId', assignedStaffId);
    if (isSlaAtRisk !== undefined) params = params.set('isSlaAtRisk', isSlaAtRisk.toString());
    if (isEscalated !== undefined) params = params.set('isEscalated', isEscalated.toString());
    
    return this.http.get<{ tickets: ManagerTicket[]; totalCount: number; pageNumber: number; pageSize: number; totalPages: number }>(`${this.apiUrl}/tickets`, { params });
  }

  getTicket(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/tickets/${id}`);
  }

  forceAssign(jobId: string, staffId: string, reason?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/tickets/${jobId}/force-assign`, {
      jobId,
      staffId,
      reason
    });
  }

  transfer(jobId: string, toStaffId: string, reason: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/tickets/${jobId}/transfer`, {
      jobId,
      toStaffId,
      reason
    });
  }

  escalate(jobId: string, reason?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/tickets/${jobId}/escalate`, {
      jobId,
      reason
    });
  }

  cancel(jobId: string, reason: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/tickets/${jobId}/cancel`, {
      jobId,
      reason
    });
  }
}
