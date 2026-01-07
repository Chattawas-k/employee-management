export interface QueueDto {
  id: string;
  employeeId: string;
  employeeName: string;
  positionName?: string;
  departmentName?: string;
  position: number;
  status: 'active' | 'inactive' | 'busy' | 'Active' | 'Inactive' | 'Busy';
  queueDate: string;
}

export interface GetQueuesByDateResponse extends Array<QueueDto> {}

export interface QueueSummaryJobDto {
  id: string;
  jobNumber: string;
  title: string;
  customer: string;
  description: string;
  assigneeId: string;
  assigneeName?: string;
  status: string;
  priority: string;
  createdDate: string;
  updatedDate?: string;
  statusLogs: QueueSummaryStatusLogDto[];
}

export interface QueueSummaryStatusLogDto {
  status: string;
  timestamp: string;
}

export interface QueueSummaryResponse {
  jobs: QueueSummaryJobDto[];
}

export interface UpdateMyQueueStatusRequest {
  status: 'active' | 'busy' | 'inactive';
}

export interface UpdateMyQueueStatusResponse {
  id: string;
  employeeId: string;
  position: number;
  status: 'active' | 'busy' | 'inactive';
  updatedDate?: string;
}

