import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GetHistoryResponse } from '../models/employee.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EmployeeStatusHistoryService {
  private apiUrl = `${environment.apiUrl}/employee-status-history`;

  constructor(private http: HttpClient) {}

  getHistory(
    employeeId?: string,
    startDate?: Date,
    endDate?: Date,
    changeReason?: number
  ): Observable<GetHistoryResponse> {
    let params = new HttpParams();
    
    if (employeeId) {
      params = params.set('employeeId', employeeId);
    }
    
    if (startDate) {
      params = params.set('startDate', startDate.toISOString());
    }
    
    if (endDate) {
      params = params.set('endDate', endDate.toISOString());
    }
    
    if (changeReason !== undefined) {
      params = params.set('changeReason', changeReason.toString());
    }

    return this.http.get<GetHistoryResponse>(this.apiUrl, { params });
  }
}

