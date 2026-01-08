import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface DepartmentDto {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class DepartmentService {
  private apiUrl = `${environment.apiUrl}/department`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<DepartmentDto[]> {
    return this.http.get<DepartmentDto[]>(`${this.apiUrl}`);
  }
}

