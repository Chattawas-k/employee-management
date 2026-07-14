import { Component, OnInit, OnDestroy, signal, computed, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ManagerDashboardService } from '../../services/manager-dashboard.service';
import { SalesReportAdminService, AdminSalesReportCountsResponse } from '../../services/sales-report-admin.service';
import { SignalRService } from '../../services/signalr.service';
import { ToastService } from '../../services/toast.service';
import {
  ManagerDashboardKpis,
  QueueSnapshotTicket,
  StaffSnapshot,
  ChartData,
  Alert
} from '../../models/manager.model';
import { KpiCardComponent } from '../manager-dashboard/components/kpi-card/kpi-card.component';
import { ChartCardComponent } from '../manager-dashboard/components/chart-card/chart-card.component';
import { QueueSnapshotPanelComponent } from '../manager-dashboard/components/queue-snapshot-panel/queue-snapshot-panel.component';
import { StaffSnapshotPanelComponent } from '../manager-dashboard/components/staff-snapshot-panel/staff-snapshot-panel.component';
import { AlertBadgeComponent } from '../manager-dashboard/components/alert-badge/alert-badge.component';
import { SummaryCardComponent } from '../../shared/components/summary-card/summary-card.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { DateRangePickerDialogComponent, DateRangeYmd } from '../../shared/components/date-range-picker-dialog/date-range-picker-dialog.component';
import { catchError, of } from 'rxjs';

interface DateFilterOption {
  key: string;
  label: string;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    KpiCardComponent,
    ChartCardComponent,
    QueueSnapshotPanelComponent,
    StaffSnapshotPanelComponent,
    AlertBadgeComponent,
    SummaryCardComponent,
    IconComponent,
    DateRangePickerDialogComponent
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  // Data signals
  kpis = signal<ManagerDashboardKpis | null>(null);
  charts = signal<ChartData | null>(null);
  queueSnapshot = signal<QueueSnapshotTicket[]>([]);
  staffSnapshot = signal<StaffSnapshot[]>([]);
  alerts = signal<Alert[]>([]);
  counts = signal<AdminSalesReportCountsResponse | null>(null);

  // UI state
  isLoading = signal(false);
  lastUpdated = signal<Date | null>(null);
  dateFrom = signal<Date | null>(null);
  dateTo = signal<Date | null>(null);
  selectedDateFilter = signal<string>('today');

  hasAlerts = computed(() => this.alerts().length > 0);

  // Custom date-range picker
  readonly maxRangeDays = 30;
  showDateRangeDialog = signal(false);
  dialogStartYmd = computed(() => this.toYmd(this.dateFrom()) ?? this.toYmd(new Date())!);
  dialogEndYmd = computed(() => this.toYmd(this.dateTo()) ?? this.toYmd(new Date())!);
  customRangeLabel = computed(() => {
    const from = this.dateFrom();
    const to = this.dateTo();
    if (!from || !to) return 'เลือกช่วง';
    const fmt = new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short' });
    const f = fmt.format(from);
    const t = fmt.format(to);
    return f === t ? f : `${f} - ${t}`;
  });

  readonly dateFilters: DateFilterOption[] = [
    { key: 'today', label: 'วันนี้' },
    { key: 'yesterday', label: 'เมื่อวาน' },
    { key: 'last7days', label: '7 วัน' },
    { key: 'last30days', label: '30 วัน' },
    { key: 'thismonth', label: 'เดือนนี้' }
  ];

  private autoRefreshInterval: any;
  private readonly AUTO_REFRESH_INTERVAL_MS = 30000; // 30s

  constructor(
    private dashboardService: ManagerDashboardService,
    private salesReportAdminService: SalesReportAdminService,
    private signalRService: SignalRService,
    private toastService: ToastService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
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
      this.signalRService.onQueueUpdated(() => this.loadQueueSnapshot());
      this.signalRService.onEmployeeStatusChanged(() => this.loadStaffSnapshot());
      this.signalRService.onJobStatusChanged(() => this.loadDashboard());
    } catch (error) {
      console.error('Failed to initialize SignalR:', error);
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
        this.loadCharts(dateFrom, dateTo),
        this.loadCounts(dateFrom, dateTo),
        this.loadQueueSnapshot(),
        this.loadStaffSnapshot(),
        this.loadAlerts()
      ]);
      this.lastUpdated.set(new Date());
    } catch (error) {
      console.error('Error loading dashboard:', error);
      this.toastService.error('เกิดข้อผิดพลาดในการโหลดข้อมูล Dashboard');
    } finally {
      this.isLoading.set(false);
      this.cdr.markForCheck();
    }
  }

  private loadKpis(dateFrom?: Date | null, dateTo?: Date | null): Promise<void> {
    return new Promise((resolve) => {
      this.dashboardService.getKpis(dateFrom || undefined, dateTo || undefined)
        .pipe(catchError(err => { console.error('KPIs error:', err); return of(null); }))
        .subscribe(kpis => {
          if (kpis) { this.kpis.set(kpis); this.cdr.markForCheck(); }
          resolve();
        });
    });
  }

  private loadCharts(dateFrom?: Date | null, dateTo?: Date | null): Promise<void> {
    return new Promise((resolve) => {
      this.dashboardService.getCharts(dateFrom || undefined, dateTo || undefined)
        .pipe(catchError(err => { console.error('Charts error:', err); return of(null); }))
        .subscribe(charts => {
          if (charts) { this.charts.set(charts); this.cdr.markForCheck(); }
          resolve();
        });
    });
  }

  private loadCounts(dateFrom?: Date | null, dateTo?: Date | null): Promise<void> {
    return new Promise((resolve) => {
      this.salesReportAdminService.getCounts({
        dateFrom: this.toYmd(dateFrom),
        dateTo: this.toYmd(dateTo)
      })
        .pipe(catchError(err => { console.error('Counts error:', err); return of(null); }))
        .subscribe(counts => {
          if (counts) { this.counts.set(counts); this.cdr.markForCheck(); }
          resolve();
        });
    });
  }

  private loadQueueSnapshot(): Promise<void> {
    return new Promise((resolve) => {
      this.dashboardService.getQueueSnapshot(10)
        .pipe(catchError(err => { console.error('Queue snapshot error:', err); return of({ tickets: [] }); }))
        .subscribe(res => { this.queueSnapshot.set(res.tickets || []); this.cdr.markForCheck(); resolve(); });
    });
  }

  private loadStaffSnapshot(): Promise<void> {
    return new Promise((resolve) => {
      this.dashboardService.getStaffSnapshot()
        .pipe(catchError(err => { console.error('Staff snapshot error:', err); return of({ staff: [] }); }))
        .subscribe(res => { this.staffSnapshot.set(res.staff || []); this.cdr.markForCheck(); resolve(); });
    });
  }

  private loadAlerts(): Promise<void> {
    return new Promise((resolve) => {
      this.dashboardService.getAlerts()
        .pipe(catchError(err => { console.error('Alerts error:', err); return of({ alerts: [] }); }))
        .subscribe(res => { this.alerts.set(res.alerts || []); this.cdr.markForCheck(); resolve(); });
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
      case 'yesterday': {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        this.dateFrom.set(yesterday);
        this.dateTo.set(new Date(today));
        break;
      }
      case 'last7days': {
        const d = new Date(today);
        d.setDate(d.getDate() - 7);
        this.dateFrom.set(d);
        this.dateTo.set(new Date());
        break;
      }
      case 'last30days': {
        const d = new Date(today);
        d.setDate(d.getDate() - 30);
        this.dateFrom.set(d);
        this.dateTo.set(new Date());
        break;
      }
      case 'thismonth': {
        const d = new Date(today.getFullYear(), today.getMonth(), 1);
        this.dateFrom.set(d);
        this.dateTo.set(new Date());
        break;
      }
    }
    this.loadDashboard();
  }

  openDateRangeDialog(): void {
    this.showDateRangeDialog.set(true);
  }

  closeDateRangeDialog(): void {
    this.showDateRangeDialog.set(false);
  }

  applyDateRange(range: DateRangeYmd): void {
    const from = new Date(`${range.startYmd}T00:00:00`);
    const to = new Date(`${range.endYmd}T00:00:00`);
    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
      return;
    }
    this.selectedDateFilter.set('custom');
    this.dateFrom.set(from);
    this.dateTo.set(to);
    this.showDateRangeDialog.set(false);
    this.loadDashboard();
  }

  onTicketClick(ticket: QueueSnapshotTicket): void {
    this.router.navigate(['/admin-active-jobs']);
  }

  onStaffClick(staff: StaffSnapshot): void {
    this.router.navigate(['/sales-report-admin'], { queryParams: { assigneeId: staff.id } });
  }

  onAlertClick(alert: Alert): void {
    if (alert.type.includes('WAITING') || alert.type.includes('ASSIGNED')) {
      this.router.navigate(['/admin-active-jobs']);
    } else if (alert.type.includes('STAFF')) {
      this.router.navigate(['/settings/employees']);
    }
  }

  onAlertDismiss(alertId: string): void {
    this.alerts.update(list => list.filter(a => a.id !== alertId));
    this.cdr.markForCheck();
  }

  private startAutoRefresh(): void {
    this.stopAutoRefresh();
    this.autoRefreshInterval = setInterval(() => this.loadDashboard(), this.AUTO_REFRESH_INTERVAL_MS);
  }

  private stopAutoRefresh(): void {
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
      this.autoRefreshInterval = null;
    }
  }

  private toYmd(d?: Date | null): string | undefined {
    if (!d) return undefined;
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  formatConversion(rate?: number): string {
    return (rate ?? 0).toFixed(1);
  }

  formatLastUpdated(): string {
    const last = this.lastUpdated();
    if (!last) return '';
    return last.toLocaleString('th-TH', { hour: '2-digit', minute: '2-digit' });
  }
}
