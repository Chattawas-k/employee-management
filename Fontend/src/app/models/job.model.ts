export interface Job {
  id: number;
  title: string;
  customer: string;
  description: string;
  assignee: string;
  status: 'Pending' | 'In Progress' | 'Done' | 'Rejected';
  priority: 'Low' | 'Normal' | 'High' | 'Urgent';
  createdAt: string;
  updatedAt?: string;
  statusLogs?: StatusLog[];
  report?: JobReport;
}

export interface StatusLog {
  status: string;
  timestamp: string;
}

export interface JobReport {
  customerName: string;
  customerContact: string;
  salesStatus: 'success' | 'failed' | 'pending';
  reasons: string[];
  productCategory: string;
  description: string;
}

