export interface EmployeeDto {
  id: string;
  name: string;
  phone?: string;
  status: 'Active' | 'Inactive';
  positionId: string;
  positionName?: string;
  departmentName?: string;
  avatar?: string;
  createdDate: string;
}

export interface EmployeeDropdownDto {
  id: string;
  name: string;
  positionName?: string;
  departmentName?: string;
  avatar?: string;
}

export enum ChangeReason {
  Auto = 1,
  Manual = 2
}

export interface EmployeeStatusHistoryDto {
  id: string;
  employeeId: string;
  employeeName: string;
  // Backend returns enum values (number) by default; keep as union for safety.
  previousStatus: string | number | null;
  newStatus: string | number;
  changeReason: ChangeReason;
  changedBy: string | null;
  changedByName: string | null;
  changedDate: string;
  notes: string | null;
}

export interface GetHistoryResponse {
  histories: EmployeeStatusHistoryDto[];
}

export interface MigrateInactiveStatusRequest {
  targetStatus: 'Break' | 'Unavailable';
}

export interface MigrateInactiveStatusResponse {
  migratedCount: number;
  message: string;
}

export interface EmployeeSearchItem {
  id: string;
  name: string;
  phone?: string;
  status: 'Active' | 'Inactive';
  positionId: string;
  positionName?: string;
  departmentName?: string;
  avatar?: string;
}

export interface EmployeeSearchResponse {
  items: EmployeeSearchItem[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface EmployeeSearchRequest {
  keyword?: string;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  status?: 'Active' | 'Inactive';
  departmentId?: string;
  positionId?: string;
}

export interface CreateEmployeeRequest {
  name: string;
  phone?: string;
  status: 'Active' | 'Inactive';
  positionId: string;
  avatar?: string;
}

export interface UpdateEmployeeRequest {
  id: string;
  name: string;
  phone?: string;
  status: 'Active' | 'Inactive';
  positionId: string;
  avatar?: string;
}

