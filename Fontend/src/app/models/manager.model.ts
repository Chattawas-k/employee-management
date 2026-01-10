// Manager Dashboard Models
export interface ManagerDashboardKpis {
  customersWaitingNow: number;
  avgWaitTimeMinutes: number;
  readyStaffCount: number;
  activeConversations: number;
  salesToday: number;
  conversionToday: number;
  slaBreachCount: number;
  topCategoryToday: string;
}

export interface QueueSnapshotTicket {
  id: string;
  jobNumber: string;
  customer: string;
  channel: string;
  waitTime: string; // ISO duration string
  priority: string;
  status: string;
  assignedStaffName?: string;
  isSlaAtRisk: boolean;
}

export interface StaffSnapshot {
  id: string;
  name: string;
  status: string;
  timeInCurrentStatus: string; // ISO duration string
  activeLoad: number;
  todayHandled: number;
  todayWon: number;
  categoryTags: string[];
}

export interface ChartData {
  queueTrend: QueueTrendData;
  conversionFunnel: ConversionFunnelData;
  categoryMix: CategoryMixData;
  staffLeaderboard: StaffLeaderboardData;
}

export interface QueueTrendData {
  points: QueueTrendPoint[];
}

export interface QueueTrendPoint {
  date: string;
  created: number;
  closed: number;
}

export interface ConversionFunnelData {
  waiting: number;
  assigned: number;
  inProgress: number;
  closedWon: number;
  closedLost: number;
}

export interface CategoryMixData {
  items: CategoryMixItem[];
}

export interface CategoryMixItem {
  category: string;
  amount: number;
  count: number;
}

export interface StaffLeaderboardData {
  bySales: StaffLeaderboardItem[];
  byConversion: StaffLeaderboardItem[];
}

export interface StaffLeaderboardItem {
  staffId: string;
  staffName: string;
  salesAmount: number;
  conversionRate: number;
  handledCount: number;
}

export interface Alert {
  id: string;
  severity: 'Low' | 'Medium' | 'High';
  type: string;
  message: string;
  timestamp: string;
}

// Manager Queue Models
export interface ManagerTicket {
  id: string;
  jobNumber: string;
  customer: string;
  channel: string;
  category: string;
  status: string;
  priority: string;
  assignedStaffId?: string;
  assignedStaffName?: string;
  createdDate: string;
  assignedDate?: string;
  startedDate?: string;
  closedDate?: string;
  isSlaAtRisk: boolean;
  isEscalated: boolean;
}

// Manager Staff Models
export interface ManagerStaff {
  id: string;
  name: string;
  status: string;
  timeInCurrentStatus: string;
  activeLoad: number;
  todayHandled: number;
  todayWon: number;
  todayLost: number;
  conversionRate: number;
  avgCloseTime: string;
  categoryTags: string[];
}

export interface StaffDetail {
  id: string;
  name: string;
  statusTimeline: StatusTimelineItem[];
  activeTickets: ActiveTicket[];
  todayPerformance: TodayPerformance;
  categoryPerformance: CategoryPerformance[];
}

export interface StatusTimelineItem {
  status: string;
  timestamp: string;
  reason?: string;
}

export interface ActiveTicket {
  jobId: string;
  jobNumber: string;
  customer: string;
  status: string;
  isSlaAtRisk: boolean;
}

export interface TodayPerformance {
  handled: number;
  won: number;
  lost: number;
  conversionRate: number;
  salesAmount: number;
}

export interface CategoryPerformance {
  category: string;
  wonCount: number;
  salesAmount: number;
}

// Manager Deals Models
export interface ManagerDeal {
  id: string;
  jobNumber: string;
  customer: string;
  channel: string;
  category: string;
  staffId: string;
  staffName: string;
  outcome: string;
  saleValue?: number;
  createdDate: string;
  closedDate?: string;
}

export interface DealsSummary {
  totalSales: number;
  avgDeal: number;
  conversionRate: number;
  topStaff: string;
  topCategory: string;
}

// Audit Log Models
export interface AuditLogEntry {
  id: string;
  actorId: string;
  actorName: string;
  actionType: string;
  entityType: string;
  entityId: string;
  beforeJson?: string;
  afterJson?: string;
  reason?: string;
  timestamp: string;
  ipAddress?: string;
}

// Queue Rules Models
export interface QueueRule {
  id: string;
  slaWaitingMinutes: number;
  slaAssignedMinutes: number;
  maxConcurrentPerStaff: number;
  readyStaffThreshold: number;
  busyTimeThresholdMinutes: number;
  isActive: boolean;
}

// Filter Models
export interface ManagerFilters {
  dateFrom?: Date;
  dateTo?: Date;
  branchId?: string;
  teamId?: string;
  shiftId?: string;
  channel?: string;
  category?: string;
  staffId?: string;
}
