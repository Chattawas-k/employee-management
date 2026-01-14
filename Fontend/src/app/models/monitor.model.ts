export interface MonitorCounts {
  waitingTotal: number;
  servingTotal: number;
}

export interface MonitorStaffItem {
  employeeId: string;
  employeeName: string;
  queuePosition: number; // relative position (1..n)
  avatar?: string;
}

export interface MonitorServingItem {
  employeeId: string;
  employeeName: string;
  jobNumber?: string | null;
  jobRunningCode?: string | null;
  queueStatus: string;
  availabilityStatus: string;
  avatar?: string;
}

export interface MonitorSnapshotResponse {
  date: string; // ISO date
  generatedAt: string; // ISO datetime
  counts: MonitorCounts;
  nextQueue?: MonitorStaffItem | null;
  waitingList: MonitorStaffItem[];
  servingNow: MonitorServingItem[];
}

