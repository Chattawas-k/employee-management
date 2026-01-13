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

  private formatBangkokDate(date: Date): string {
    // Always format as YYYY-MM-DD in Asia/Bangkok (avoid toISOString() UTC day shift)
    try {
      const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Bangkok',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).formatToParts(date);

      const get = (type: string) => parts.find(p => p.type === type)?.value ?? '';
      const y = get('year');
      const m = get('month');
      const d = get('day');
      if (y && m && d) return `${y}-${m}-${d}`;
    } catch {
      // Fallback below
    }

    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  getSnapshot(date?: Date): Observable<MonitorSnapshotResponse> {
    let params = new HttpParams();
    if (date) {
      params = params.set('date', this.formatBangkokDate(date));
    }
    return this.http.get<MonitorSnapshotResponse>(`${this.apiUrl}/snapshot`, { params });
  }
}

