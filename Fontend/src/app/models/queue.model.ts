export interface QueueDto {
  id: string;
  employeeId: string;
  employeeName: string;
  positionName?: string;
  departmentName?: string;
  position: number;
  status: 'active' | 'inactive' | 'busy' | 'Active' | 'Inactive' | 'Busy';
  availabilityStatus: 'available' | 'busy' | 'break' | 'unavailable' | 'notworking' | 'Available' | 'Busy' | 'Break' | 'Unavailable' | 'NotWorking';
  queueDate: string;
  updatedDate?: string;
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

export enum AvailabilityStatus {
  Available = 1,
  Busy = 2,
  Break = 3,
  Unavailable = 4,
  NotWorking = 5
}

export interface UpdateMyQueueStatusRequest {
  status: 'available' | 'busy' | 'break' | 'unavailable' | 'notworking';
}

export interface UpdateMyQueueStatusResponse {
  id: string;
  employeeId: string;
  position: number;
  availabilityStatus: 'available' | 'busy' | 'break' | 'unavailable' | 'notworking' | 'Available' | 'Busy' | 'Break' | 'Unavailable' | 'NotWorking';
  status: 'Active' | 'Busy' | 'Inactive';
  updatedDate?: string;
}

export interface BulkUpdateQueueItem {
  id: string;
  position: number;
  status: 'Active' | 'Busy' | 'Inactive';
}

export interface BulkUpdateQueueRequest {
  queues: BulkUpdateQueueItem[];
}

export interface BulkUpdateQueueResponse {
  updatedCount: number;
  updatedDate: string;
}

export interface ArchiveQueueRequest {
  sourceDate: string;
  targetDate?: string;
}

export interface ArchiveQueueResponse {
  archivedCount: number;
  sourceDate: string;
  targetDate: string;
}

export interface MyQueueInfoResponse {
  myQueuePosition: number;
  queuesRemaining: number;
  currentlyServing: {
    name: string;
    queuePosition: number;
    avatarUrl?: string;
  } | null;
  isInQueue: boolean;
  queueStatus: string; // "Active", "Busy", "Inactive" (for backward compatibility)
  availabilityStatus: string; // "Available", "Busy", "Break", "Unavailable", "NotWorking"
}

export interface MigrateInactiveStatusRequest {
  targetStatus: 'Break' | 'Unavailable';
}

export interface MigrateInactiveStatusResponse {
  migratedCount: number;
  message: string;
}

