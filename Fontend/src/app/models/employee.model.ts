export type EmployeeStatus = 'Active' | 'Inactive';

export interface Employee {
  id: string; // Guid from backend
  name: string;
  phone?: string;
  status: EmployeeStatus;
  positionId: string;
  positionName?: string;
  departmentName?: string;
  avatar?: string;
  createdDate?: string;
  updatedDate?: string;
}

export interface EmployeeSearchRequest {
  keyword?: string;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: string;
  status?: EmployeeStatus;
  departmentId?: string;
  positionId?: string;
}

export interface PaginatedList<T> {
  items: T[];
  pageNumber: number;
  totalPages: number;
  totalCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface EmployeeAddRequest {
  name: string;
  phone?: string;
  status: EmployeeStatus;
  positionId: string;
  avatar?: string;
}

export interface EmployeeUpdateRequest {
  id: string;
  name: string;
  phone?: string;
  status: EmployeeStatus;
  positionId: string;
  avatar?: string;
}
