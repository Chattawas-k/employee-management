export type ReportStatus = 'Success' | 'Pending' | 'Failed' | 'Rejected';

export interface SalesReport {
  id: string;
  jobNumber: string;
  jobRunningCode?: string | null;
  customerName: string;
  contactInfo: string;
  status: ReportStatus;
  interestedProducts: string[];
  reasons: string[];
  submittedAt: Date;
  saleDate?: Date;
  assigneeId?: string; // owner (the employee who recorded the report) — used to gate edit permission
  salesperson: {
    name: string;
    avatarUrl: string;
  };
  saleValue?: number;
  invoiceId?: string;
  nextFollowUp?: Date;
  notes?: string;
  competitor?: string;
  closedByAdminName?: string;
}

