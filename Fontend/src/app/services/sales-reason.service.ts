import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CreateSalesReasonRequest, GetSalesReasonsResponse, SalesReasonType, UpdateSalesReasonRequest } from '../models/sales-reason.model';

@Injectable({
  providedIn: 'root'
})
export class SalesReasonService {
  private apiUrl = `${environment.apiUrl}/sales-reasons`;

  constructor(private http: HttpClient) {}

  getByType(type: SalesReasonType, includeInactive = false): Observable<GetSalesReasonsResponse> {
    return this.http.get<GetSalesReasonsResponse>(`${this.apiUrl}?type=${encodeURIComponent(type)}&includeInactive=${includeInactive}`);
  }

  create(request: CreateSalesReasonRequest) {
    return this.http.post(this.apiUrl, request);
  }

  update(id: string, request: UpdateSalesReasonRequest) {
    return this.http.put(`${this.apiUrl}/${id}`, request);
  }

  delete(id: string) {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

