import { AvailabilityStatusKey } from '../shared/utils/availability-status.util';

export type StatusActorType = 'Unknown' | 'Self' | 'Admin' | 'System';
export type StatusChangeSource = 'Unknown' | 'Web' | 'Mobile' | 'Cron';

export interface DailyAuditSummaryDto {
  totalEmployees: number;
  readyNow: number;
  anomalyCases: number;
}

export interface DailyAuditEmployeeRowDto {
  employeeId: string;
  employeeName: string;
  currentStatus: number; // backend enum int
  readyMinutes: number;
  breakMinutes: number;
  notReadyMinutes: number;
  offDutyMinutes: number;
  changeCount: number;
  lastEventAt: string | null;
  lastEventStatus: number | null;
  anomalyFlags: string[];
}

export interface DailyAuditListResponse {
  date: string; // yyyy-mm-dd
  summary: DailyAuditSummaryDto;
  employees: DailyAuditEmployeeRowDto[];
}

export interface TimelineSegmentDto {
  start: string;
  end: string | null;
  status: number;
  durationMinutes: number;
  isRunning: boolean;
}

export interface TimelineEventDto {
  id: string;
  occurredAt: string;
  fromStatus: number | null;
  toStatus: number;
  durationMinutes: number;
  isRunning: boolean;
  actorType: StatusActorType | number;
  source: StatusChangeSource | number;
  reason: string | null;
}

export interface EmployeeDailyAuditResponse {
  employeeId: string;
  employeeName: string;
  date: string;
  readyMinutes: number;
  breakMinutes: number;
  notReadyMinutes: number;
  offDutyMinutes: number;
  changeCount: number;
  currentStatus: number;
  anomalyFlags: string[];
  insight: string;
  miniDayBar: TimelineSegmentDto[];
  timeline: TimelineEventDto[];
}

