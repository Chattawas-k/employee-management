import { JobStatus } from './task.model';

export enum JobChangeSource {
  Auto = 1,
  Manual = 2,
  Assigned = 3
}

export interface JobStatusHistoryDto {
  id: string;
  jobId: string;
  jobNumber?: string | null;
  jobRunningCode?: string | null;
  title?: string | null;
  customer?: string | null;
  previousStatus?: JobStatus | string | null;
  newStatus: JobStatus | string;
  changeSource: JobChangeSource | number;
  changedByEmployeeId?: string | null;
  changedByEmployeeName?: string | null;
  changedDate: string;
  notes?: string | null;
  previousAssigneeId?: string | null;
  newAssigneeId?: string | null;
}

export interface GetMyJobStatusHistoryResponse {
  histories: JobStatusHistoryDto[];
}

