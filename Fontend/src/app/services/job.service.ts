import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Job, StatusLog, JobReport } from '../models/job.model';
import { environment } from '../../environments/environment';

interface GetMyTasksResponse {
  jobs: Job[];
}

interface UpdateStatusRequest {
  id: string;
  status: 'Pending' | 'InProgress' | 'Done' | 'Rejected';
  rejectReason?: string;
  report?: JobReport;
}

interface CreateTaskRequest {
  title: string;
  customer: string;
  description: string;
  assigneeId: string;
  priority: 'Low' | 'Normal' | 'High' | 'Urgent';
}

@Injectable({
  providedIn: 'root'
})
export class JobService {
  private apiUrl = `${environment.apiUrl}/job`;

  constructor(
    private http: HttpClient
  ) {}

  getMyTasks(employeeId: string): Observable<Job[]> {
    return this.http.get<GetMyTasksResponse>(`${this.apiUrl}/my-tasks/${employeeId}`).pipe(
      map(response => {
        return this.mapJobs(response.jobs);
      })
    );
  }

  get(id: string): Observable<Job> {
    return this.http.get<Job>(`${this.apiUrl}/${id}`).pipe(
      map(job => this.mapJob(job))
    );
  }

  createTask(request: CreateTaskRequest): Observable<Job> {
    return this.http.post<Job>(this.apiUrl, request).pipe(
      map(job => this.mapJob(job))
    );
  }

  updateStatus(id: string, status: 'Pending' | 'InProgress' | 'Done' | 'Rejected', rejectReason?: string, report?: JobReport): Observable<Job> {
    // Map frontend status to backend enum string
    const statusMap: { [key: string]: string } = {
      'Pending': 'Pending',
      'In Progress': 'InProgress',
      'InProgress': 'InProgress',
      'Done': 'Done',
      'Rejected': 'Rejected'
    };

    const backendStatus = statusMap[status];

    const request: UpdateStatusRequest = {
      id,
      status: backendStatus as any,
      ...(rejectReason && { rejectReason }),
      ...(report && { report })
    };

    return this.http.put<Job>(`${this.apiUrl}/${id}/status`, request).pipe(
      map(job => {
        return this.mapJob(job);
      }),
      catchError(err => {
        console.error('Status update error:', err);
        return throwError(() => err);
      })
    );
  }

  private mapJobs(jobs: Job[]): Job[] {
    return jobs.map(job => this.mapJob(job));
  }

  private mapJob(job: Job): Job {
    // Map status from backend format to frontend format
    // Backend can send: number (1,2,3,4), string (Pending, InProgress), or lowercase (pending, inprogress)
    const statusMap: { [key: string]: 'Pending' | 'In Progress' | 'Done' | 'Rejected' } = {
      // Number format
      '1': 'Pending',
      '2': 'In Progress',
      '3': 'Done',
      '4': 'Rejected',
      // PascalCase format
      'Pending': 'Pending',
      'InProgress': 'In Progress',
      'Done': 'Done',
      'Rejected': 'Rejected',
      // lowercase format
      'pending': 'Pending',
      'inprogress': 'In Progress',
      'done': 'Done',
      'rejected': 'Rejected'
    };

    // Map status logs
    const mappedStatusLogs = job.statusLogs?.map(log => {
      const logStatus = statusMap[log.status] || statusMap[log.status.toLowerCase()] || log.status;
      return { ...log, status: logStatus };
    });

    const originalStatus = String(job.status);
    const mappedStatus = statusMap[originalStatus] || statusMap[originalStatus.toLowerCase()] || job.status as any;

    return {
      ...job,
      status: mappedStatus,
      assignee: job.assigneeName || '',
      createdAt: job.createdDate,
      updatedAt: job.updatedDate,
      statusLogs: mappedStatusLogs
    };
  }
}

