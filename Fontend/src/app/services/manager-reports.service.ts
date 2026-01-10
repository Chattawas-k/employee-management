import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ManagerReportsService {
  private apiUrl = `${environment.apiUrl}/manager/reports`;

  constructor(private http: HttpClient) {}

  getQueuePerformance(dateFrom?: Date, dateTo?: Date): Observable<any> {
    let params = new HttpParams();
    if (dateFrom) params = params.set('dateFrom', dateFrom.toISOString());
    if (dateTo) params = params.set('dateTo', dateTo.toISOString());
    return this.http.get(`${this.apiUrl}/queue-performance`, { params });
  }

  getStaffPerformance(dateFrom?: Date, dateTo?: Date): Observable<any> {
    let params = new HttpParams();
    if (dateFrom) params = params.set('dateFrom', dateFrom.toISOString());
    if (dateTo) params = params.set('dateTo', dateTo.toISOString());
    return this.http.get(`${this.apiUrl}/staff-performance`, { params });
  }

  getCategoryReport(dateFrom?: Date, dateTo?: Date): Observable<any> {
    let params = new HttpParams();
    if (dateFrom) params = params.set('dateFrom', dateFrom.toISOString());
    if (dateTo) params = params.set('dateTo', dateTo.toISOString());
    return this.http.get(`${this.apiUrl}/category`, { params });
  }

  getLostReasons(dateFrom?: Date, dateTo?: Date): Observable<any> {
    let params = new HttpParams();
    if (dateFrom) params = params.set('dateFrom', dateFrom.toISOString());
    if (dateTo) params = params.set('dateTo', dateTo.toISOString());
    return this.http.get(`${this.apiUrl}/lost-reasons`, { params });
  }
}
