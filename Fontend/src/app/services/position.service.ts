import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PositionDto {
  id: string;
  name: string;
  description?: string;
  departmentId: string;
  departmentName?: string;
  isActive: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PositionService {
  private apiUrl = `${environment.apiUrl}/position`;

  constructor(private http: HttpClient) {}

  getAll(departmentId?: string): Observable<PositionDto[]> {
    let params = new HttpParams();
    if (departmentId) {
      params = params.set('departmentId', departmentId);
    }
    return this.http.get<PositionDto[]>(`${this.apiUrl}`, { params });
  }
}

