import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

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

  getSalesReports(status?: string, page?: number, pageSize?: number): Observable<GetSalesReportsResponse> {
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
    
    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }
    
    return this.http.get<GetSalesReportsResponse>(url, {
      observe: 'body',
      responseType: 'json'
    });
  }

  exportMySalesReportsXlsx(): Observable<HttpResponse<Blob>> {
    const url = `${this.apiUrl}/sales-reports/export`;
    return this.http.get(url, {
      observe: 'response',
      responseType: 'blob'
    });
  }
}

