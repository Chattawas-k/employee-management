import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { EmployeeDto, EmployeeDropdownDto, EmployeeSearchResponse, EmployeeSearchRequest, CreateEmployeeRequest, UpdateEmployeeRequest } from '../models/employee.model';

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

  search(request: EmployeeSearchRequest): Observable<EmployeeSearchResponse> {
    let params = new HttpParams();
    
    if (request.pageNumber !== undefined) {
      params = params.set('pageNumber', request.pageNumber.toString());
    }
    if (request.pageSize !== undefined) {
      params = params.set('pageSize', request.pageSize.toString());
    }
    
    if (request.keyword) {
      params = params.set('keyword', request.keyword);
    }
    if (request.sortBy) {
      params = params.set('sortBy', request.sortBy);
    }
    if (request.sortDirection) {
      params = params.set('sortDirection', request.sortDirection);
    }
    if (request.status) {
      params = params.set('status', request.status);
    }
    if (request.departmentId) {
      params = params.set('departmentId', request.departmentId);
    }
    if (request.positionId) {
      params = params.set('positionId', request.positionId);
    }

    return this.http.get<EmployeeSearchResponse>(`${this.apiUrl}/search`, { params });
  }

  getById(id: string): Observable<EmployeeDto> {
    return this.http.get<EmployeeDto>(`${this.apiUrl}/${id}`);
  }

  create(request: CreateEmployeeRequest): Observable<EmployeeDto> {
    return this.http.post<EmployeeDto>(`${this.apiUrl}`, request);
  }

  update(id: string, request: UpdateEmployeeRequest): Observable<EmployeeDto> {
    return this.http.put<EmployeeDto>(`${this.apiUrl}/${id}`, request);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

