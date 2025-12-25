import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  GetMyTasksResponse, 
  CreateJobRequest, 
  CreateJobResponse, 
  UpdateJobStatusRequest, 
  UpdateJobStatusResponse 
} from '../models/task.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private apiUrl = `${environment.apiUrl}/job`;

  constructor(private http: HttpClient) {}

  getMyTasks(): Observable<GetMyTasksResponse> {
    return this.http.get<GetMyTasksResponse>(`${this.apiUrl}/my-tasks`);
  }

  createJob(request: CreateJobRequest): Observable<CreateJobResponse> {
    return this.http.post<CreateJobResponse>(`${this.apiUrl}`, request);
  }

  updateJobStatus(id: string, request: UpdateJobStatusRequest): Observable<UpdateJobStatusResponse> {
    return this.http.put<UpdateJobStatusResponse>(`${this.apiUrl}/${id}/status`, request);
  }
}

