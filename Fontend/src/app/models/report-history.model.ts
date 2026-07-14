export interface ReportHistorySnapshot {
  customerName: string;
  customerContact: string;
  salesStatus: string;
  jobStatus: string;
  reasons: string[];
  productCategory: string;
  description: string;
  saleValue?: number | null;
  saleDate?: string | null;
}

export interface ReportHistoryEntry {
  id: string;
  jobId: string;
  version: number;
  isOriginal: boolean;
  changedFields: string[];
  editedByEmployeeId?: string | null;
  editedByName?: string | null;
  editedDate: string;
  editNote?: string | null;
  snapshot: ReportHistorySnapshot;
}

export interface GetReportHistoryResponse {
  versions: ReportHistoryEntry[];
}

/** Payload sent to PUT /job/{id}/report */
export interface EditReportPayload {
  id: string;
  report: {
    customerName: string;
    customerContact: string;
    salesStatus: string; // 'success' | 'failed' | 'pending'
    reasonIds: string[];
    productCategory: string; // comma-separated category names
    description: string;
    saleValue?: number | null;
    saleDate?: string | null;
  };
  editNote?: string | null;
  isAdminOverride?: boolean;
}
