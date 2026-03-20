export enum JobStatus {
  Pending = 1,
  Assigned = 2,
  InProgress = 3,
  ClosedWon = 4,
  ClosedLost = 5,
  Cancelled = 6
}

export enum JobPriority {
  Low = 1,
  Normal = 2,
  High = 3,
  Urgent = 4
}

export interface MyTaskStatusLogDto {
  status: string;
  timestamp: string;
}

export interface MyTaskJobReportDto {
  customerName: string;
  customerContact: string;
  salesStatus: string;
  reasonIds?: string[];
  reasons: string[];
  productCategory: string;
  description: string;
  closedByAdminName?: string;
}

export interface JobDto {
  id: string;
  jobNumber: string;
  jobRunningCode?: string | null;
  title: string;
  customer: string;
  description: string;
  assigneeId: string;
  assigneeName?: string;
  status: JobStatus | string; // Backend sends string (camelCase)
  priority: JobPriority | string; // Backend sends string (camelCase)
  createdDate: string;
  updatedDate?: string;
  statusLogs: MyTaskStatusLogDto[];
  report?: MyTaskJobReportDto;
}

export interface GetMyTasksResponse {
  jobs: JobDto[];
}

export interface CreateJobRequest {
  title: string;
  customer: string;
  description: string;
  assigneeId: string;
  priority: JobPriority;
  channel?: string; // "Phone", "Chat", "Walk-in", "Email"
  productCategoryId?: string; // Product category ID
  category?: string; // Deprecated: Keep for backward compatibility
}

export interface CreateJobResponse {
  id: string;
  jobNumber: string;
  jobRunningCode?: string | null;
  title: string;
  customer: string;
  description: string;
  assigneeId: string;
  assigneeName?: string;
  status: JobStatus;
  priority: JobPriority;
  createdDate: string;
  updatedDate?: string;
}

export interface UpdateJobStatusRequest {
  id: string;
  status: JobStatus;
  rejectReason?: string;
  report?: UpdateJobStatusReportDto;
  isAdminOverride?: boolean;
}

export interface UpdateJobStatusReportDto {
  customerName: string;
  customerContact: string;
  salesStatus: string;
  reasonIds?: string[];
  reasons: string[];
  productCategory: string;
  description: string;
}

export interface ActiveJobDto {
  id: string;
  jobNumber: string;
  jobRunningCode?: string | null;
  title: string;
  customer: string;
  description: string;
  channel: string;
  assigneeId: string;
  assigneeName?: string | null;
  assigneeAvatar?: string | null;
  status: JobStatus;
  priority: JobPriority;
  isEscalated: boolean;
  createdDate: string;
  assignedDate?: string | null;
  startedDate?: string | null;
}

export interface GetActiveJobsResponse {
  jobs: ActiveJobDto[];
  totalCount: number;
}

export interface UpdateJobStatusResponse {
  id: string;
  jobNumber: string;
  jobRunningCode?: string | null;
  title: string;
  customer: string;
  description: string;
  assigneeId: string;
  assigneeName?: string;
  status: JobStatus;
  priority: JobPriority;
  createdDate: string;
  updatedDate?: string;
  statusLogs: MyTaskStatusLogDto[];
  report?: UpdateJobStatusReportDto;
}

export interface JobGetResponse {
  id: string;
  jobNumber: string;
  jobRunningCode?: string | null;
  title: string;
  customer: string;
  description: string;
  assigneeId: string;
  assigneeName?: string;
  status: JobStatus | string;
  priority: JobPriority | string;
  createdDate: string;
  updatedDate?: string;
  statusLogs: MyTaskStatusLogDto[];
  report?: MyTaskJobReportDto;
}
