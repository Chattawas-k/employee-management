import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  ManagerDashboardKpis, 
  QueueSnapshotTicket, 
  StaffSnapshot, 
  ChartData, 
  Alert 
} from '../models/manager.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ManagerDashboardService {
  private apiUrl = `${environment.apiUrl}/manager/dashboard`;

  constructor(private http: HttpClient) {}

  getKpis(dateFrom?: Date, dateTo?: Date): Observable<ManagerDashboardKpis> {
    let params = new HttpParams();
    if (dateFrom) params = params.set('dateFrom', this.toLocalYmd(dateFrom));
    if (dateTo) params = params.set('dateTo', this.toLocalYmd(dateTo));
    return this.http.get<ManagerDashboardKpis>(`${this.apiUrl}/kpis`, { params });
  }

  /**
   * Format a Date as a local YYYY-MM-DD business date. The backend interprets these
   * as Bangkok days, so we must NOT use toISOString() (which converts to UTC and can
   * shift the date by a day for a UTC+7 browser).
   */
  private toLocalYmd(d: Date): string {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  getQueueSnapshot(topCount: number = 10): Observable<{ tickets: QueueSnapshotTicket[] }> {
    const params = new HttpParams().set('topCount', topCount.toString());
    return this.http.get<{ tickets: QueueSnapshotTicket[] }>(`${this.apiUrl}/queue-snapshot`, { params });
  }

  getStaffSnapshot(): Observable<{ staff: StaffSnapshot[] }> {
    return this.http.get<{ staff: StaffSnapshot[] }>(`${this.apiUrl}/staff-snapshot`);
  }

  getCharts(dateFrom?: Date, dateTo?: Date): Observable<ChartData> {
    let params = new HttpParams();
    if (dateFrom) params = params.set('dateFrom', this.toLocalYmd(dateFrom));
    if (dateTo) params = params.set('dateTo', this.toLocalYmd(dateTo));
    return this.http.get<ChartData>(`${this.apiUrl}/charts`, { params });
  }

  getAlerts(): Observable<{ alerts: Alert[] }> {
    return this.http.get<{ alerts: Alert[] }>(`${this.apiUrl}/alerts`);
  }
}
