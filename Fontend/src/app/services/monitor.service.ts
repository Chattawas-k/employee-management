import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { MonitorSnapshotResponse } from '../models/monitor.model';

@Injectable({
  providedIn: 'root'
})
export class MonitorService {
  private apiUrl = `${environment.apiUrl}/monitor`;

  constructor(private http: HttpClient) {}

  getSnapshot(date?: Date): Observable<MonitorSnapshotResponse> {
    let params = new HttpParams();
    if (date) {
      params = params.set('date', date.toISOString().split('T')[0]);
    }
    return this.http.get<MonitorSnapshotResponse>(`${this.apiUrl}/snapshot`, { params });
  }
}

