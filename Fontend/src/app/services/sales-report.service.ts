import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface SalesReportDto {
  id: string;
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

  getSalesReports(status?: string): Observable<GetSalesReportsResponse> {
    let url = `${this.apiUrl}/sales-reports`;
    if (status && status !== 'All') {
      // Map frontend status to backend status (lowercase)
      const backendStatus = status.toLowerCase();
      url += `?status=${encodeURIComponent(backendStatus)}`;
    }
    return this.http.get<GetSalesReportsResponse>(url, {
      observe: 'body',
      responseType: 'json'
    });
  }
}

