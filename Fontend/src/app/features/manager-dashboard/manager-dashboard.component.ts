import { Component, OnInit, OnDestroy, signal, computed, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ManagerDashboardService } from '../../services/manager-dashboard.service';
import { SignalRService } from '../../services/signalr.service';
import { ToastService } from '../../services/toast.service';
import { 
  ManagerDashboardKpis, 
  QueueSnapshotTicket, 
  StaffSnapshot, 
  ChartData, 
  Alert 
} from '../../models/manager.model';
import { KpiCardComponent } from './components/kpi-card/kpi-card.component';
import { QueueSnapshotPanelComponent } from './components/queue-snapshot-panel/queue-snapshot-panel.component';
import { StaffSnapshotPanelComponent } from './components/staff-snapshot-panel/staff-snapshot-panel.component';
import { ChartCardComponent } from './components/chart-card/chart-card.component';
import { AlertBadgeComponent } from './components/alert-badge/alert-badge.component';
import { catchError, forkJoin, of } from 'rxjs';

@Component({
  selector: 'app-manager-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    KpiCardComponent,
    QueueSnapshotPanelComponent,
    StaffSnapshotPanelComponent,
    ChartCardComponent,
    AlertBadgeComponent
  ],
  templateUrl: './manager-dashboard.component.html',
  styleUrls: ['./manager-dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ManagerDashboardComponent implements OnInit, OnDestroy {
  // Data signals
  kpis = signal<ManagerDashboardKpis | null>(null);
  queueSnapshot = signal<QueueSnapshotTicket[]>([]);
  staffSnapshot = signal<StaffSnapshot[]>([]);
  charts = signal<ChartData | null>(null);
  alerts = signal<Alert[]>([]);
  
  // UI state
  isLoading = signal(false);
  lastUpdated = signal<Date | null>(null);
  dateFrom = signal<Date | null>(null);
  dateTo = signal<Date | null>(null);
  selectedDateFilter = signal<string>('today');
  
  // Computed values
  hasAlerts = computed(() => this.alerts().length > 0);
  criticalAlerts = computed(() => this.alerts().filter(a => a.severity === 'High'));
  
  // Auto-refresh timer
  private autoRefreshInterval: any;
  private readonly AUTO_REFRESH_INTERVAL_MS = 30000; // 30 seconds

  constructor(
    private dashboardService: ManagerDashboardService,
    private signalRService: SignalRService,
    private toastService: ToastService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    // Set default date range (today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    this.dateFrom.set(today);
    this.dateTo.set(new Date());
  }

  async ngOnInit(): Promise<void> {
    await this.initializeSignalR();
    await this.loadDashboard();
    this.startAutoRefresh();
  }

  ngOnDestroy(): void {
    this.cleanupSignalR();
    this.stopAutoRefresh();
  }

  private async initializeSignalR(): Promise<void> {
    try {
      await this.signalRService.startConnection();
      
      // Listen for dashboard updates
      this.signalRService.onQueueUpdated(() => {
        console.log('Queue updated - refreshing queue snapshot');
        this.loadQueueSnapshot();
      });

      this.signalRService.onEmployeeStatusChanged(() => {
        console.log('Employee status changed - refreshing staff snapshot');
        this.loadStaffSnapshot();
      });

      // Note: Manager-specific events need to be added to SignalRService
      // For now, we'll use existing events
      this.signalRService.onJobStatusChanged(() => {
        console.log('Job status changed - refreshing dashboard');
        this.loadDashboard();
      });

    } catch (error) {
      console.error('Failed to initialize SignalR:', error);
      this.toastService.warning('ไม่สามารถเชื่อมต่อ real-time updates ได้');
    }
  }

  private cleanupSignalR(): void {
    this.signalRService.offQueueUpdated();
    this.signalRService.offEmployeeStatusChanged();
    this.signalRService.offJobStatusChanged();
  }

  async loadDashboard(): Promise<void> {
    this.isLoading.set(true);
    this.cdr.markForCheck();

    const dateFrom = this.dateFrom();
    const dateTo = this.dateTo();

    try {
      await Promise.all([
        this.loadKpis(dateFrom, dateTo),
        this.loadQueueSnapshot(),
        this.loadStaffSnapshot(),
        this.loadCharts(dateFrom, dateTo),
        this.loadAlerts()
      ]);
      
      this.lastUpdated.set(new Date());
      this.isLoading.set(false);
      this.cdr.markForCheck();
    } catch (error) {
      console.error('Error loading dashboard:', error);
      this.toastService.error('เกิดข้อผิดพลาดในการโหลดข้อมูล Dashboard');
      this.isLoading.set(false);
      this.cdr.markForCheck();
    }
  }

  private async loadKpis(dateFrom?: Date | null, dateTo?: Date | null): Promise<void> {
    return new Promise((resolve) => {
      this.dashboardService.getKpis(dateFrom || undefined, dateTo || undefined)
        .pipe(
          catchError(error => {
            console.error('Error loading KPIs:', error);
            this.toastService.error('เกิดข้อผิดพลาดในการโหลด KPI');
            return of(null);
          })
        )
        .subscribe(kpis => {
          if (kpis) {
            this.kpis.set(kpis);
            this.cdr.markForCheck();
          }
          resolve();
        });
    });
  }

  private async loadQueueSnapshot(): Promise<void> {
    return new Promise((resolve) => {
      this.dashboardService.getQueueSnapshot(10)
        .pipe(
          catchError(error => {
            console.error('Error loading queue snapshot:', error);
            return of({ tickets: [] });
          })
        )
        .subscribe(response => {
          this.queueSnapshot.set(response.tickets || []);
          this.cdr.markForCheck();
          resolve();
        });
    });
  }

  private async loadStaffSnapshot(): Promise<void> {
    return new Promise((resolve) => {
      this.dashboardService.getStaffSnapshot()
        .pipe(
          catchError(error => {
            console.error('Error loading staff snapshot:', error);
            return of({ staff: [] });
          })
        )
        .subscribe(response => {
          this.staffSnapshot.set(response.staff || []);
          this.cdr.markForCheck();
          resolve();
        });
    });
  }

  private async loadCharts(dateFrom?: Date | null, dateTo?: Date | null): Promise<void> {
    return new Promise((resolve) => {
      this.dashboardService.getCharts(dateFrom || undefined, dateTo || undefined)
        .pipe(
          catchError(error => {
            console.error('Error loading charts:', error);
            this.toastService.error('เกิดข้อผิดพลาดในการโหลด Charts');
            return of(null);
          })
        )
        .subscribe(charts => {
          if (charts) {
            this.charts.set(charts);
            this.cdr.markForCheck();
          }
          resolve();
        });
    });
  }

  private async loadAlerts(): Promise<void> {
    return new Promise((resolve) => {
      this.dashboardService.getAlerts()
        .pipe(
          catchError(error => {
            console.error('Error loading alerts:', error);
            return of({ alerts: [] });
          })
        )
        .subscribe(response => {
          this.alerts.set(response.alerts || []);
          this.cdr.markForCheck();
          resolve();
        });
    });
  }

  refreshDashboard(): void {
    this.loadDashboard();
    this.toastService.info('กำลังรีเฟรชข้อมูล...');
  }

  onDateFilterChange(filter: string): void {
    this.selectedDateFilter.set(filter);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    switch (filter) {
      case 'today':
        this.dateFrom.set(today);
        this.dateTo.set(new Date());
        break;
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        this.dateFrom.set(yesterday);
        this.dateTo.set(new Date(today));
        break;
      case 'last7days':
        const last7Days = new Date(today);
        last7Days.setDate(last7Days.getDate() - 7);
        this.dateFrom.set(last7Days);
        this.dateTo.set(new Date());
        break;
      case 'last30days':
        const last30Days = new Date(today);
        last30Days.setDate(last30Days.getDate() - 30);
        this.dateFrom.set(last30Days);
        this.dateTo.set(new Date());
        break;
      case 'thismonth':
        const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        this.dateFrom.set(thisMonth);
        this.dateTo.set(new Date());
        break;
    }
    
    this.loadDashboard();
  }

  onTicketClick(ticket: QueueSnapshotTicket): void {
    this.router.navigate(['/manager/queue'], { 
      queryParams: { ticketId: ticket.id } 
    });
  }

  onStaffClick(staff: StaffSnapshot): void {
    this.router.navigate(['/manager/staff'], { 
      queryParams: { staffId: staff.id } 
    });
  }

  onAlertClick(alert: Alert): void {
    // Navigate based on alert type
    if (alert.type.includes('QUEUE') || alert.type.includes('WAITING')) {
      this.router.navigate(['/manager/queue']);
    } else if (alert.type.includes('STAFF')) {
      this.router.navigate(['/manager/staff']);
    }
  }

  onAlertDismiss(alertId: string): void {
    this.alerts.update(alerts => alerts.filter(a => a.id !== alertId));
    this.cdr.markForCheck();
  }

  private startAutoRefresh(): void {
    this.stopAutoRefresh(); // Clear any existing interval
    this.autoRefreshInterval = setInterval(() => {
      console.log('Auto-refreshing dashboard...');
      this.loadDashboard();
    }, this.AUTO_REFRESH_INTERVAL_MS);
  }

  private stopAutoRefresh(): void {
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
      this.autoRefreshInterval = null;
    }
  }

  formatLastUpdated(): string {
    const last = this.lastUpdated();
    if (!last) return '';
    
    const now = new Date();
    const diffMs = now.getTime() - last.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'เมื่อสักครู่';
    if (diffMins < 60) return `${diffMins} นาทีที่แล้ว`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`;
    
    return last.toLocaleString('th-TH', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  getRoundedWaitTime(minutes: number): number {
    return Math.round(minutes);
  }

  getFormattedConversion(rate: number): string {
    return rate.toFixed(1);
  }
}
