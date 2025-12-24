export interface Job {
  id: string;
  title: string;
  customer: string;
  description: string;
  assigneeId: string;
  assigneeName?: string;
  assignee?: string;
  status: 'Pending' | 'In Progress' | 'Done' | 'Rejected' | 'InProgress';
  priority: 'Low' | 'Normal' | 'High' | 'Urgent';
  createdDate: string;
  updatedDate?: string;
  createdAt?: string;
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

