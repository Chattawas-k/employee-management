export interface GetJobAssignmentListResponse {
  id: string;
  name: string;
  role: string;
  avatarUrl?: string;
  status: 'พร้อมรับงาน' | 'ติดลูกค้า' | 'พัก/ลางาน';
  statusClass: string;
  currentTasks: number;
  queuePosition: number;
}

