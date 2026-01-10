import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuditLogEntry } from '../models/manager.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ManagerAuditService {
  private apiUrl = `${environment.apiUrl}/manager/audit`;

  constructor(private http: HttpClient) {}

  getAuditLog(
    actorId?: string,
    actionType?: string,
    entityType?: string,
    entityId?: string,
    dateFrom?: Date,
    dateTo?: Date,
    pageNumber: number = 1,
    pageSize: number = 50
  ): Observable<{ logs: AuditLogEntry[]; totalCount: number; pageNumber: number; pageSize: number }> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());
    
    if (actorId) params = params.set('actorId', actorId);
    if (actionType) params = params.set('actionType', actionType);
    if (entityType) params = params.set('entityType', entityType);
    if (entityId) params = params.set('entityId', entityId);
    if (dateFrom) params = params.set('dateFrom', dateFrom.toISOString());
    if (dateTo) params = params.set('dateTo', dateTo.toISOString());
    
    return this.http.get<{ logs: AuditLogEntry[]; totalCount: number; pageNumber: number; pageSize: number }>(
      `${this.apiUrl}`, 
      { params }
    );
  }

  getAuditLogDetail(id: string): Observable<AuditLogEntry> {
    return this.http.get<AuditLogEntry>(`${this.apiUrl}/${id}`);
  }
}
