import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { EditReportPayload, GetReportHistoryResponse } from '../models/report-history.model';

export interface SalesReportDto {
  id: string;
  jobNumber: string;
  jobRunningCode?: string | null;
  customerName: string;
  customerContact: string;
  salesStatus: string;
  reasons: string[];
  productCategory: string;
  description: string;
  submittedAt: string;
  saleDate?: string;
  saleValue?: number;
  assigneeId: string;
  assigneeName?: string;
  invoiceId?: string;
}

export interface GetSalesReportsResponse {
  reports: SalesReportDto[]; // Backend returns "Reports" (PascalCase) but JSON serialization converts to camelCase "reports"
}

@Injectable({
  providedIn: 'root'
})
export class SalesReportService {
  private apiUrl = `${environment.apiUrl}/job`;

  constructor(private http: HttpClient) {}

  getSalesReports(status?: string, page?: number, pageSize?: number, dateFrom?: string, dateTo?: string, assigneeId?: string): Observable<GetSalesReportsResponse> {
    let url = `${this.apiUrl}/sales-reports`;
    const params: string[] = [];
    
    if (status && status !== 'All') {
      // Map frontend status to backend status (lowercase)
      const backendStatus = status.toLowerCase();
      params.push(`status=${encodeURIComponent(backendStatus)}`);
    }
    
    if (page !== undefined && page !== null) {
      params.push(`pageNumber=${encodeURIComponent(page)}`);
    }
    
    if (pageSize !== undefined && pageSize !== null) {
      params.push(`pageSize=${encodeURIComponent(pageSize)}`);
    }
    
    if (dateFrom) {
      params.push(`dateFrom=${encodeURIComponent(dateFrom)}`);
    }
    
    if (dateTo) {
      params.push(`dateTo=${encodeURIComponent(dateTo)}`);
    }
    
    if (assigneeId) {
      params.push(`assigneeId=${encodeURIComponent(assigneeId)}`);
    }
    
    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }
    
    return this.http.get<GetSalesReportsResponse>(url, {
      observe: 'body',
      responseType: 'json'
    });
  }

  exportMySalesReportsXlsx(search?: string, dateFrom?: string, dateTo?: string, status?: string): Observable<HttpResponse<Blob>> {
    let url = `${this.apiUrl}/sales-reports/export`;
    const params: string[] = [];
    
    if (search) {
      params.push(`search=${encodeURIComponent(search)}`);
    }
    
    if (dateFrom) {
      params.push(`dateFrom=${encodeURIComponent(dateFrom)}`);
    }
    
    if (dateTo) {
      params.push(`dateTo=${encodeURIComponent(dateTo)}`);
    }
    
    if (status && status !== 'all') {
      params.push(`status=${encodeURIComponent(status)}`);
    }
    
    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }
    
    return this.http.get(url, {
      observe: 'response',
      responseType: 'blob'
    });
  }

  /** Update a previously-saved sales report. Persists to backend and records an edit-history entry. */
  editReport(id: string, payload: EditReportPayload): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/report`, payload);
  }

  /** Fetch the full edit history (original + each edit) for a job's sales report. */
  getReportHistory(id: string): Observable<GetReportHistoryResponse> {
    return this.http.get<GetReportHistoryResponse>(`${this.apiUrl}/${id}/report-history`);
  }
}

