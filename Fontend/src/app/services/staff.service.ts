import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  CreateStaffRequest,
  CreateStaffResponse,
  GetStaffListResponse,
  ResetStaffPasswordBody,
  ResetStaffPasswordResponse,
  SetStaffRoleBody,
  SetStaffRoleResponse,
  SetStaffStatusBody,
  SetStaffStatusResponse,
  SetStaffAvailabilityStatusBody,
  SetStaffAvailabilityStatusResponse,
  UpdateStaffProfileBody,
  UpdateStaffProfileResponse
} from '../models/staff.model';
import { GeneratePasswordLinkRequest, GeneratePasswordLinkResponse } from '../models/password-link.model';

@Injectable({
  providedIn: 'root'
})
export class StaffService {
  private apiUrl = `${environment.apiUrl}/admin/staff`;
  private employeeApiUrl = `${environment.apiUrl}/employee/staff`;

  constructor(private http: HttpClient) {}

  getStaffList(options?: { basicOnly?: boolean }): Observable<GetStaffListResponse> {
    // Use employee/staff endpoint which works for all roles (Basic, Admin, SuperAdmin)
    // It always returns basic-only staff (Basic role only) for security
    // If admin needs all staff, they should call admin/staff endpoint directly
    if (options?.basicOnly !== false) {
      // Default to basic-only staff via employee endpoint
      return this.http.get<GetStaffListResponse>(this.employeeApiUrl);
    }
    
    // Only use admin endpoint if explicitly requesting all staff (basicOnly = false)
    // This requires Admin or SuperAdmin role
    let params = new HttpParams();
    params = params.set('basicOnly', 'false');
    return this.http.get<GetStaffListResponse>(this.apiUrl, { params });
  }

  createStaff(request: CreateStaffRequest): Observable<CreateStaffResponse> {
    return this.http.post<CreateStaffResponse>(this.apiUrl, request);
  }

  updateStaffProfile(staffId: string, body: UpdateStaffProfileBody): Observable<UpdateStaffProfileResponse> {
    return this.http.put<UpdateStaffProfileResponse>(`${this.apiUrl}/${staffId}`, body);
  }

  setStaffStatus(staffId: string, body: SetStaffStatusBody): Observable<SetStaffStatusResponse> {
    return this.http.put<SetStaffStatusResponse>(`${this.apiUrl}/${staffId}/status`, body);
  }

  setStaffAvailabilityStatus(staffId: string, body: SetStaffAvailabilityStatusBody): Observable<SetStaffAvailabilityStatusResponse> {
    return this.http.put<SetStaffAvailabilityStatusResponse>(`${this.apiUrl}/${staffId}/availability-status`, body);
  }

  setStaffRole(staffId: string, body: SetStaffRoleBody): Observable<SetStaffRoleResponse> {
    return this.http.put<SetStaffRoleResponse>(`${this.apiUrl}/${staffId}/role`, body);
  }

  resetStaffPassword(staffId: string, body: ResetStaffPasswordBody): Observable<ResetStaffPasswordResponse> {
    return this.http.post<ResetStaffPasswordResponse>(`${this.apiUrl}/${staffId}/reset-password`, body);
  }

  generatePasswordLink(staffId: string, body: GeneratePasswordLinkRequest): Observable<GeneratePasswordLinkResponse> {
    return this.http.post<GeneratePasswordLinkResponse>(`${this.apiUrl}/${staffId}/password-link`, body);
  }
}

