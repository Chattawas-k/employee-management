export enum JobStatus {
  Pending = 1,
  InProgress = 2,
  Done = 3,
  Rejected = 4
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
  reasons: string[];
  productCategory: string;
  description: string;
}

export interface JobDto {
  id: string;
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
}

export interface CreateJobResponse {
  id: string;
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
}

export interface UpdateJobStatusReportDto {
  customerName: string;
  customerContact: string;
  salesStatus: string;
  reasons: string[];
  productCategory: string;
  description: string;
}

export interface UpdateJobStatusResponse {
  id: string;
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

