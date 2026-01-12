export type TimePeriod = 'today' | 'yesterday' | 'last7days' | 'last15days' | 'thisMonth' | 'custom';

export interface WorkStatsResponse {
  taskStats: TaskStats;
  salesStats: SalesStats;
  startDate: string;
  endDate: string;
}

export interface TaskStats {
  total: number;
  pending: number;
  inProgress: number;
  completedWon: number;
  completedLost: number;
  cancelled: number;
}

export interface SalesStats {
  total: number;
  success: number;
  pending: number;
  failed: number;
  conversionRate: number;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordResponse {
  success: boolean;
  message: string;
}

export interface QueueInfo {
  status: string;
  position: number;
  totalInQueue: number;
}
