import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { GetMyJobStatusHistoryResponse, JobChangeSource } from '../models/job-status-history.model';

@Injectable({
  providedIn: 'root'
})
export class JobStatusHistoryService {
  private apiUrl = `${environment.apiUrl}/job`;

  constructor(private http: HttpClient) {}

  getMyJobStatusHistory(options: {
    startDate?: string;
    endDate?: string;
    source?: JobChangeSource;
    jobId?: string;
    skip?: number;
    take?: number;
  }): Observable<GetMyJobStatusHistoryResponse> {
    let params = new HttpParams();

    if (options.startDate) params = params.set('startDate', options.startDate);
    if (options.endDate) params = params.set('endDate', options.endDate);
    if (options.source !== undefined) params = params.set('source', String(options.source));
    if (options.jobId) params = params.set('jobId', options.jobId);
    if (options.skip !== undefined) params = params.set('skip', String(options.skip));
    if (options.take !== undefined) params = params.set('take', String(options.take));

    return this.http.get<GetMyJobStatusHistoryResponse>(`${this.apiUrl}/my-status-history`, { params });
  }
}

