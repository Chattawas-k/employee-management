export interface Schedule {
  id: number;
  empId: string; // Changed to string (Guid) to match Employee.id
  mon: 'Available' | 'Busy' | 'Inactive';
  tue: 'Available' | 'Busy' | 'Inactive';
  wed: 'Available' | 'Busy' | 'Inactive';
  thu: 'Available' | 'Busy' | 'Inactive';
  fri: 'Available' | 'Busy' | 'Inactive';
  sat: 'Available' | 'Busy' | 'Inactive';
  sun: 'Available' | 'Busy' | 'Inactive';
}

export interface Holiday {
  id: number;
  date: string;
  name: string;
  type: 'public' | 'company';
}

export interface Leave {
  id: number;
  empId: string; // Changed to string (Guid) to match Employee.id
  date: string;
  type: string;
  reason: string;
}

