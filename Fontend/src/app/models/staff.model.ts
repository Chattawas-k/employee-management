export type StaffAccountStatus = 'active' | 'disabled';

export interface StaffListItem {
  staffId: string;
  fullName: string;
  positionId: string;
  position: string;
  profileImageUrl?: string | null;
  email: string;
  userName: string;
  accountStatus: StaffAccountStatus;
  roles: string[];
}

export interface GetStaffListResponse {
  staff: StaffListItem[];
}

export interface CreateStaffRequest {
  fullName: string;
  positionId: string;
  email: string;
  password: string;
  role: string;
  profileImageDataUrl?: string | null;
}

export interface CreateStaffResponse {
  staff: StaffListItem;
}

export interface UpdateStaffProfileBody {
  fullName: string;
  positionId: string;
  profileImageDataUrl?: string | null;
  removeProfileImage: boolean;
}

export interface UpdateStaffProfileResponse {
  staff: StaffListItem;
}

export interface SetStaffStatusBody {
  isActive: boolean;
}

export interface SetStaffStatusResponse {
  staff: StaffListItem;
}

export interface SetStaffRoleBody {
  role: string;
}

export interface SetStaffRoleResponse {
  staff: StaffListItem;
}

export interface ResetStaffPasswordBody {
  newPassword: string;
}

export interface ResetStaffPasswordResponse {
  success: boolean;
}

export interface SetStaffAvailabilityStatusBody {
  status: string;
}

export interface SetStaffAvailabilityStatusResponse {
  employeeId: string;
  availabilityStatus: string | number;
  queueStatus: string;
  updatedDate?: string;
}

