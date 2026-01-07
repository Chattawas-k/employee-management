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

