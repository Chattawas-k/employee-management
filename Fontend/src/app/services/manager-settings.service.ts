import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { QueueRule } from '../models/manager.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ManagerSettingsService {
  private apiUrl = `${environment.apiUrl}/manager/settings`;

  constructor(private http: HttpClient) {}

  getQueueRules(): Observable<QueueRule> {
    return this.http.get<QueueRule>(`${this.apiUrl}/queue-rules`);
  }

  updateQueueRules(rules: Partial<QueueRule>): Observable<{ id: string; isActive: boolean }> {
    return this.http.put<{ id: string; isActive: boolean }>(`${this.apiUrl}/queue-rules`, rules);
  }
}
