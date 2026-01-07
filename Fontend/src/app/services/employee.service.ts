import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { EmployeeDto, EmployeeDropdownDto } from '../models/employee.model';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private apiUrl = `${environment.apiUrl}/employee`;

  constructor(private http: HttpClient) {}

  getMyEmployeeInfo(): Observable<EmployeeDto> {
    return this.http.get<EmployeeDto>(`${this.apiUrl}/me`);
  }

  getAllEmployees(status?: 'Active' | 'Inactive'): Observable<EmployeeDropdownDto[]> {
    let params = new HttpParams();
    if (status) {
      params = params.set('status', status);
    }
    return this.http.get<EmployeeDropdownDto[]>(`${this.apiUrl}/dropdown-list`, { params });
  }
}

