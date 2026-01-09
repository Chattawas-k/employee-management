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

  getAll(departmentId?: string, forceRefresh: boolean = false): Observable<PositionDto[]> {
    let params = new HttpParams();
    if (departmentId) {
      params = params.set('departmentId', departmentId);
    }
    // Add cache busting parameter if force refresh
    if (forceRefresh) {
      params = params.set('_t', Date.now().toString());
    }
    return this.http.get<PositionDto[]>(`${this.apiUrl}`, { params });
  }

  create(position: Omit<PositionDto, 'id'>): Observable<PositionDto> {
    return this.http.post<PositionDto>(`${this.apiUrl}`, position);
  }

  update(id: string, position: Partial<PositionDto>): Observable<PositionDto> {
    return this.http.put<PositionDto>(`${this.apiUrl}/${id}`, { ...position, id });
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

