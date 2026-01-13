import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { DailyAuditListResponse, EmployeeDailyAuditResponse } from '../models/employee-status-audit.model';

const USE_MOCK = false;

@Injectable({ providedIn: 'root' })
export class EmployeeStatusAuditService {
  private apiUrl = `${environment.apiUrl}/employee-status-audit`;

  constructor(private http: HttpClient) {}

  getDaily(params: {
    date: string; // yyyy-mm-dd
    search?: string;
    statuses?: number[];
    actorType?: number;
    anomalies?: string[];
    sort?: string;
  }): Observable<DailyAuditListResponse> {
    if (USE_MOCK) return of(this.mockDaily(params.date));

    let httpParams = new HttpParams().set('date', params.date);
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.sort) httpParams = httpParams.set('sort', params.sort);
    if (typeof params.actorType === 'number') httpParams = httpParams.set('actorType', String(params.actorType));
    (params.statuses ?? []).forEach(s => (httpParams = httpParams.append('statuses', String(s))));
    (params.anomalies ?? []).forEach(a => (httpParams = httpParams.append('anomalies', a)));

    return this.http.get<DailyAuditListResponse>(`${this.apiUrl}/daily`, { params: httpParams });
  }

  getEmployeeDaily(params: {
    employeeId: string;
    date: string;
    statuses?: number[];
    actorType?: number;
    onlyAnomaly?: boolean;
  }): Observable<EmployeeDailyAuditResponse> {
    if (USE_MOCK) return of(this.mockEmployee(params.employeeId, params.date));

    let httpParams = new HttpParams().set('date', params.date);
    if (typeof params.actorType === 'number') httpParams = httpParams.set('actorType', String(params.actorType));
    if (params.onlyAnomaly) httpParams = httpParams.set('onlyAnomaly', 'true');
    (params.statuses ?? []).forEach(s => (httpParams = httpParams.append('statuses', String(s))));

    return this.http.get<EmployeeDailyAuditResponse>(`${this.apiUrl}/${params.employeeId}/daily`, { params: httpParams });
  }

  private mockDaily(date: string): DailyAuditListResponse {
    return {
      date,
      summary: { totalEmployees: 3, readyNow: 1, anomalyCases: 1 },
      employees: [
        {
          employeeId: '00000000-0000-0000-0000-000000000001',
          employeeName: 'A',
          currentStatus: 1,
          readyMinutes: 300,
          breakMinutes: 60,
          notReadyMinutes: 120,
          offDutyMinutes: 0,
          changeCount: 4,
          lastEventAt: new Date().toISOString(),
          lastEventStatus: 1,
          anomalyFlags: [],
        },
        {
          employeeId: '00000000-0000-0000-0000-000000000002',
          employeeName: 'B',
          currentStatus: 3,
          readyMinutes: 120,
          breakMinutes: 200,
          notReadyMinutes: 0,
          offDutyMinutes: 0,
          changeCount: 12,
          lastEventAt: new Date().toISOString(),
          lastEventStatus: 3,
          anomalyFlags: ['FREQUENT_CHANGES', 'LONG_BREAK'],
        },
        {
          employeeId: '00000000-0000-0000-0000-000000000003',
          employeeName: 'C',
          currentStatus: 4,
          readyMinutes: 0,
          breakMinutes: 0,
          notReadyMinutes: 480,
          offDutyMinutes: 0,
          changeCount: 1,
          lastEventAt: new Date().toISOString(),
          lastEventStatus: 4,
          anomalyFlags: [],
        },
      ],
    };
  }

  private mockEmployee(employeeId: string, date: string): EmployeeDailyAuditResponse {
    const now = new Date();
    return {
      employeeId,
      employeeName: 'Mock Employee',
      date,
      readyMinutes: 320,
      breakMinutes: 60,
      notReadyMinutes: 80,
      offDutyMinutes: 0,
      changeCount: 4,
      currentStatus: 1,
      anomalyFlags: [],
      insight: 'ปกติ',
      miniDayBar: [
        { start: now.toISOString(), end: null, status: 1, durationMinutes: 30, isRunning: true },
      ],
      timeline: [
        {
          id: '1',
          occurredAt: now.toISOString(),
          fromStatus: 4,
          toStatus: 1,
          durationMinutes: 30,
          isRunning: true,
          actorType: 'Self',
          source: 'Web',
          reason: 'เริ่มงาน',
        },
      ],
    };
  }
}

