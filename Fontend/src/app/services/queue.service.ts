import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GetQueuesByDateResponse, QueueSummaryResponse, UpdateMyQueueStatusRequest, UpdateMyQueueStatusResponse } from '../models/queue.model';
import { environment } from '../../environments/environment';

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

  updateMyQueueStatus(status: 'active' | 'busy' | 'inactive'): Observable<UpdateMyQueueStatusResponse> {
    const requestBody: UpdateMyQueueStatusRequest = { status };
    return this.http.put<UpdateMyQueueStatusResponse>(`${this.apiUrl}/my-status`, requestBody);
  }
}

