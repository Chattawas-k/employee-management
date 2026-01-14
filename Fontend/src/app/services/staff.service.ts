import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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
  UpdateStaffProfileBody,
  UpdateStaffProfileResponse
} from '../models/staff.model';
import { GeneratePasswordLinkRequest, GeneratePasswordLinkResponse } from '../models/password-link.model';

@Injectable({
  providedIn: 'root'
})
export class StaffService {
  private apiUrl = `${environment.apiUrl}/admin/staff`;

  constructor(private http: HttpClient) {}

  getStaffList(): Observable<GetStaffListResponse> {
    return this.http.get<GetStaffListResponse>(this.apiUrl);
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

