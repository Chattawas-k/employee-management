import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Employee, EmployeeSearchRequest, PaginatedList, EmployeeAddRequest, EmployeeUpdateRequest, EmployeeDropdownItem, EmployeeDropdownRequest } from '../models/employee.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private apiUrl = `${environment.apiUrl}/employee`;

  constructor(
    private http: HttpClient
  ) {}

  search(request: EmployeeSearchRequest): Observable<PaginatedList<Employee>> {
    let params = new HttpParams();
    if (request.keyword) {
      params = params.set('keyword', request.keyword);
    }
    if (request.pageNumber) {
      params = params.set('pageNumber', request.pageNumber.toString());
    }
    if (request.pageSize) {
      params = params.set('pageSize', request.pageSize.toString());
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

    return this.http.get<PaginatedList<Employee>>(`${this.apiUrl}/search`, { params });
  }

  get(id: string): Observable<Employee> {
    return this.http.get<Employee>(`${this.apiUrl}/${id}`);
  }

  create(request: EmployeeAddRequest): Observable<Employee> {
    return this.http.post<Employee>(`${this.apiUrl}`, request);
  }

  update(id: string, request: EmployeeUpdateRequest): Observable<Employee> {
    return this.http.put<Employee>(`${this.apiUrl}/${id}`, request);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getDropdownList(request?: EmployeeDropdownRequest): Observable<EmployeeDropdownItem[]> {
    let params = new HttpParams();
    if (request?.status) {
      params = params.set('status', request.status);
    }
    if (request?.departmentId) {
      params = params.set('departmentId', request.departmentId);
    }
    if (request?.positionId) {
      params = params.set('positionId', request.positionId);
    }

    return this.http.get<EmployeeDropdownItem[]>(`${this.apiUrl}/dropdown-list`, { params });
  }
}

