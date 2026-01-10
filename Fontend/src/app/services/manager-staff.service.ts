import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ManagerStaff, StaffDetail } from '../models/manager.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ManagerStaffService {
  private apiUrl = `${environment.apiUrl}/manager/staff`;

  constructor(private http: HttpClient) {}

  getStaff(dateFrom?: Date, dateTo?: Date): Observable<{ staff: ManagerStaff[] }> {
    let params = new HttpParams();
    if (dateFrom) params = params.set('dateFrom', dateFrom.toISOString());
    if (dateTo) params = params.set('dateTo', dateTo.toISOString());
    return this.http.get<{ staff: ManagerStaff[] }>(`${this.apiUrl}`, { params });
  }

  getStaffDetail(id: string, dateFrom?: Date, dateTo?: Date): Observable<StaffDetail> {
    let params = new HttpParams();
    if (dateFrom) params = params.set('dateFrom', dateFrom.toISOString());
    if (dateTo) params = params.set('dateTo', dateTo.toISOString());
    return this.http.get<StaffDetail>(`${this.apiUrl}/${id}/detail`, { params });
  }
}
