import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
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
  assigneeAvatar?: string;
  invoiceId?: string;
}

export interface GetSalesReportsResponse {
  reports: SalesReportDto[];
}

export interface AdminSalesReportCountsResponse {
  all: number;
  success: number;
  pending: number;
  failed: number;
  rejected: number;
}

@Injectable({
  providedIn: 'root'
})
export class SalesReportAdminService {
  private apiUrl = `${environment.apiUrl}/admin/sales-reports`;

  constructor(private http: HttpClient) {}

  getSalesReports(options: {
    status?: string;
    pageNumber?: number;
    pageSize?: number;
    dateFrom?: string; // YYYY-MM-DD
    dateTo?: string;   // YYYY-MM-DD
    assigneeId?: string;
    search?: string;
  }): Observable<GetSalesReportsResponse> {
    let params = new HttpParams();
    if (options.status && options.status !== 'All') params = params.set('status', options.status.toLowerCase());
    if (options.pageNumber) params = params.set('pageNumber', String(options.pageNumber));
    if (options.pageSize) params = params.set('pageSize', String(options.pageSize));
    if (options.dateFrom) params = params.set('dateFrom', options.dateFrom);
    if (options.dateTo) params = params.set('dateTo', options.dateTo);
    if (options.assigneeId) params = params.set('assigneeId', options.assigneeId);
    if (options.search) params = params.set('search', options.search);

    return this.http.get<GetSalesReportsResponse>(this.apiUrl, { params });
  }

  getCounts(options: {
    dateFrom?: string;
    dateTo?: string;
    assigneeId?: string;
    search?: string;
  }): Observable<AdminSalesReportCountsResponse> {
    let params = new HttpParams();
    if (options.dateFrom) params = params.set('dateFrom', options.dateFrom);
    if (options.dateTo) params = params.set('dateTo', options.dateTo);
    if (options.assigneeId) params = params.set('assigneeId', options.assigneeId);
    if (options.search) params = params.set('search', options.search);

    return this.http.get<AdminSalesReportCountsResponse>(`${this.apiUrl}/counts`, { params });
  }

  exportXlsx(options: {
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    assigneeId?: string;
    search?: string;
  }): Observable<HttpResponse<Blob>> {
    let params = new HttpParams();
    if (options.status && options.status !== 'All') params = params.set('status', options.status.toLowerCase());
    if (options.dateFrom) params = params.set('dateFrom', options.dateFrom);
    if (options.dateTo) params = params.set('dateTo', options.dateTo);
    if (options.assigneeId) params = params.set('assigneeId', options.assigneeId);
    if (options.search) params = params.set('search', options.search);

    return this.http.get(`${this.apiUrl}/export`, {
      params,
      observe: 'response',
      responseType: 'blob'
    });
  }
}

