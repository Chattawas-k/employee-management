import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ManagerDeal, DealsSummary } from '../models/manager.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ManagerDealsService {
  private apiUrl = `${environment.apiUrl}/manager/deals`;

  constructor(private http: HttpClient) {}

  getDeals(
    dateFrom?: Date, 
    dateTo?: Date, 
    staffId?: string, 
    category?: string, 
    channel?: string, 
    outcome?: string
  ): Observable<{ deals: ManagerDeal[] }> {
    let params = new HttpParams();
    if (dateFrom) params = params.set('dateFrom', dateFrom.toISOString());
    if (dateTo) params = params.set('dateTo', dateTo.toISOString());
    if (staffId) params = params.set('staffId', staffId);
    if (category) params = params.set('category', category);
    if (channel) params = params.set('channel', channel);
    if (outcome) params = params.set('outcome', outcome);
    return this.http.get<{ deals: ManagerDeal[] }>(`${this.apiUrl}`, { params });
  }

  getDealsSummary(dateFrom?: Date, dateTo?: Date): Observable<DealsSummary> {
    let params = new HttpParams();
    if (dateFrom) params = params.set('dateFrom', dateFrom.toISOString());
    if (dateTo) params = params.set('dateTo', dateTo.toISOString());
    return this.http.get<DealsSummary>(`${this.apiUrl}/summary`, { params });
  }

  getLostReasons(dateFrom?: Date, dateTo?: Date): Observable<any> {
    let params = new HttpParams();
    if (dateFrom) params = params.set('dateFrom', dateFrom.toISOString());
    if (dateTo) params = params.set('dateTo', dateTo.toISOString());
    return this.http.get(`${this.apiUrl}/lost-reasons`, { params });
  }
}
