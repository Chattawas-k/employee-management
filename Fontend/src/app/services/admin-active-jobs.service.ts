import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { GetActiveJobsResponse } from '../models/task.model';

@Injectable({
  providedIn: 'root'
})
export class AdminActiveJobsService {
  private apiUrl = `${environment.apiUrl}/admin/active-jobs`;

  constructor(private http: HttpClient) {}

  getActiveJobs(options: {
    assigneeId?: string;
    search?: string;
  } = {}): Observable<GetActiveJobsResponse> {
    let params = new HttpParams();
    if (options.assigneeId) params = params.set('assigneeId', options.assigneeId);
    if (options.search) params = params.set('search', options.search);

    return this.http.get<GetActiveJobsResponse>(this.apiUrl, { params });
  }
}
