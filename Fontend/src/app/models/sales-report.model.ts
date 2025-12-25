export type ReportStatus = 'Success' | 'Pending' | 'Failed';

export interface SalesReport {
  id: string;
  customerName: string;
  contactInfo: string;
  status: ReportStatus;
  interestedProducts: string[];
  reasons: string[];
  submittedAt: Date;
  saleDate?: Date;
  salesperson: {
    name: string;
    avatarUrl: string;
  };
  saleValue?: number;
  invoiceId?: string;
  nextFollowUp?: Date;
  notes?: string;
  competitor?: string;
}

