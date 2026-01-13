export interface QueueDto {
  id: string;
  employeeId: string;
  employeeName: string;
  positionName?: string;
  departmentName?: string;
  position: number;
  round?: number;
  status: 'active' | 'inactive' | 'busy' | 'Active' | 'Inactive' | 'Busy';
  // Backend returns enum as string (camelCase). Keep this as string and normalize in UI.
  availabilityStatus: string;
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
  LunchBreak = 3,
  Unavailable = 4,
  Leave = 5,
  OffsiteCustomer = 6
}

export interface UpdateMyQueueStatusRequest {
  status: string;
}

export interface UpdateMyQueueStatusResponse {
  id: string;
  employeeId: string;
  position: number;
  availabilityStatus: string;
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
  availabilityStatus: string; // e.g. "available", "busy", "lunchBreak", "unavailable", "leave", "offsiteCustomer"
}

export interface MigrateInactiveStatusRequest {
  targetStatus: 'LunchBreak' | 'Unavailable' | 'Break'; // allow legacy Break
}

export interface MigrateInactiveStatusResponse {
  migratedCount: number;
  message: string;
}

