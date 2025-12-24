import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

export interface Position {
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

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): { [key: string]: string } {
    const token = this.authService.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  }

  getAll(departmentId?: string): Observable<Position[]> {
    let url = this.apiUrl;
    if (departmentId) {
      url += `?departmentId=${departmentId}`;
    }
    return this.http.get<Position[]>(url, {
      headers: this.getHeaders()
    });
  }
}

