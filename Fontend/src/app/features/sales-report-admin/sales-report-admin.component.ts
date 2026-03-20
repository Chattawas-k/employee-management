import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, OnDestroy, OnInit, ViewChild, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SalesReportDetailDialogComponent } from '../../shared/components/sales-report-detail-dialog/sales-report-detail-dialog.component';
import { SalesReportDialogComponent } from '../../shared/components/sales-report-dialog/sales-report-dialog.component';
import { OpenJobDialogComponent } from '../../shared/components/open-job-dialog/open-job-dialog.component';
import { DateRangePickerDialogComponent, DateRangeYmd } from '../../shared/components/date-range-picker-dialog/date-range-picker-dialog.component';
import { SalesReport, ReportStatus } from '../../models/sales-report.model';
import { SalesReportAdminService } from '../../services/sales-report-admin.service';
import { ToastService } from '../../services/toast.service';
import { StaffService } from '../../services/staff.service';
import { StaffListItem } from '../../models/staff.model';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-sales-report-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, SalesReportDetailDialogComponent, SalesReportDialogComponent, OpenJobDialogComponent, DateRangePickerDialogComponent],
  templateUrl: './sales-report-admin.component.html',
  styleUrls: ['./sales-report-admin.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SalesReportAdminComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('tabsNav', { static: false }) tabsNav!: ElementRef<HTMLElement>;

  showLeftScroll = signal(false);
  showRightScroll = signal(false);
  private resizeObserver?: ResizeObserver;

  isLoading = signal(false);
  isExporting = signal(false);

  // Filters
  dateFrom = signal<string>(''); // YYYY-MM-DD
  dateTo = signal<string>('');   // YYYY-MM-DD
  assigneeId = signal<string>(''); // staffId
  searchTerm = signal('');
  showDateRangeDialog = signal(false);
  dialogStartYmd = computed(() => this.dateFrom() || this.toYmd(new Date()));
  dialogEndYmd = computed(() => this.dateTo() || this.toYmd(new Date()));

  displayDateRangeLabel = computed(() => {
    const s = this.dateFrom();
    const e = this.dateTo();
    if (!s || !e) return '';
    const fmt = new Intl.DateTimeFormat('th-TH-u-ca-gregory-nu-latn', { month: 'short', day: 'numeric', year: 'numeric' });
    const sd = new Date(`${s}T00:00:00`);
    const ed = new Date(`${e}T00:00:00`);
    return s === e ? fmt.format(sd) : `${fmt.format(sd)} - ${fmt.format(ed)}`;
  });

  staffOptions = signal<StaffListItem[]>([]);

  // Tabs and data
  activeTab = signal<ReportStatus | 'All'>('All');
  allReports = signal<SalesReport[]>([]);
  countsData = signal<Record<ReportStatus | 'All', number>>({ All: 0, Success: 0, Pending: 0, Failed: 0, Rejected: 0 });

  counts = computed(() => this.countsData());

  // Pagination
  itemsPerPage = signal(8);
  currentPage = signal(1);
  totalCount = signal(0);

  totalPages = computed(() => {
    const total = this.totalCount();
    const size = this.itemsPerPage();
    return Math.max(1, Math.ceil((total || 0) / size));
  });

  pages = computed(() => {
    const total = this.totalPages();
    const current = Math.min(Math.max(1, this.currentPage()), total);
    const pages: number[] = [];

    let start = Math.max(1, current - 2);
    let end = Math.min(total, current + 2);

    if (current <= 3) {
      start = 1;
      end = Math.min(5, total);
    }
    if (current >= total - 2) {
      start = Math.max(1, total - 4);
      end = total;
    }

    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  });

  paginatedReports = computed(() => this.allReports());

  // Dialog state (reuse same dialogs as sales-report)
  showDetailDialog = signal(false);
  selectedReport = signal<SalesReport | null>(null);
  showEditReportDialog = signal(false);
  reportToEdit = signal<SalesReport | null>(null);
  statusToEdit = signal<ReportStatus | null>(null);
  showOpenJobDialog = signal(false);

  constructor(
    private service: SalesReportAdminService,
    private staffService: StaffService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadStaffOptions();
    this.reloadAll();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.checkScrollPosition();
      this.setupResizeObserver();
    }, 100);
  }

  ngOnDestroy(): void {
    if (this.resizeObserver) this.resizeObserver.disconnect();
  }

  private loadStaffOptions(): void {
    this.staffService.getStaffList().pipe(
      catchError(err => {
        console.error('Failed to load staff list:', err);
        return of({ staff: [] });
      })
    ).subscribe(res => {
      const staff = (res?.staff ?? []).slice().sort((a, b) => a.fullName.localeCompare(b.fullName));
      this.staffOptions.set(staff);
    });
  }

  private buildQueryOptions() {
    return {
      status: this.activeTab(),
      pageNumber: this.currentPage(),
      pageSize: this.itemsPerPage(),
      dateFrom: this.dateFrom() || undefined,
      dateTo: this.dateTo() || undefined,
      assigneeId: this.assigneeId() || undefined,
      search: this.searchTerm().trim() || undefined
    };
  }

  private buildCountsOptions() {
    return {
      dateFrom: this.dateFrom() || undefined,
      dateTo: this.dateTo() || undefined,
      assigneeId: this.assigneeId() || undefined,
      search: this.searchTerm().trim() || undefined
    };
  }

  private reloadAll(): void {
    this.loadCounts();
    this.loadSalesReports();
  }

  private loadCounts(): void {
    this.service.getCounts(this.buildCountsOptions()).pipe(
      catchError(err => {
        console.error('Failed to load counts:', err);
        return of({ all: 0, success: 0, pending: 0, failed: 0, rejected: 0 });
      })
    ).subscribe(res => {
      this.countsData.set({
        All: res.all ?? 0,
        Success: res.success ?? 0,
        Pending: res.pending ?? 0,
        Failed: res.failed ?? 0,
        Rejected: res.rejected ?? 0
      });

      // keep totalCount aligned with current tab
      const tab = this.activeTab();
      const totals = this.countsData();
      this.totalCount.set(totals[tab] || 0);
    });
  }

  private loadSalesReports(): void {
    this.isLoading.set(true);
    this.service.getSalesReports(this.buildQueryOptions()).pipe(
      catchError(err => {
        console.error('Failed to load sales reports:', err);
        this.toastService.error('เกิดข้อผิดพลาดในการโหลดรายงานขาย');
        return of({ reports: [] });
      }),
      finalize(() => this.isLoading.set(false))
    ).subscribe(res => {
      const reports = this.mapApiDataToSalesReports(res.reports || []);
      this.allReports.set(reports);
    });
  }

  onSearchTermChange(term: string): void {
    this.searchTerm.set(term);
    this.currentPage.set(1);
    this.reloadAll();
  }

  clearAllFilters(): void {
    this.searchTerm.set('');
    this.dateFrom.set('');
    this.dateTo.set('');
    this.assigneeId.set('');
    this.currentPage.set(1);
    this.reloadAll();
  }

  hasActiveFilters = computed(() => {
    return !!(this.searchTerm() || this.dateFrom() || this.dateTo() || this.assigneeId());
  });

  onDateFromChange(value: string): void {
    this.dateFrom.set(value || '');
    this.currentPage.set(1);
    this.reloadAll();
  }

  onDateToChange(value: string): void {
    this.dateTo.set(value || '');
    this.currentPage.set(1);
    this.reloadAll();
  }

  openDateRangeDialog(): void {
    this.showDateRangeDialog.set(true);
  }

  closeDateRangeDialog(): void {
    this.showDateRangeDialog.set(false);
  }

  applyDateRange(range: DateRangeYmd): void {
    this.dateFrom.set(range.startYmd);
    this.dateTo.set(range.endYmd);
    this.currentPage.set(1);
    this.showDateRangeDialog.set(false);
    this.reloadAll();
  }

  onAssigneeChange(value: string): void {
    this.assigneeId.set(value || '');
    this.currentPage.set(1);
    this.reloadAll();
  }

  setTab(tab: ReportStatus | 'All'): void {
    this.activeTab.set(tab);
    this.currentPage.set(1);
    const totals = this.countsData();
    this.totalCount.set(totals[tab] || 0);
    this.loadSalesReports();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.loadSalesReports();
  }

  firstPage(): void { this.goToPage(1); }
  previousPage(): void { this.goToPage(this.currentPage() - 1); }
  nextPage(): void { this.goToPage(this.currentPage() + 1); }
  lastPage(): void { this.goToPage(this.totalPages()); }

  exportAdminSalesReport(): void {
    if (this.isExporting()) return;
    this.isExporting.set(true);
    this.service.exportXlsx({
      status: this.activeTab(),
      dateFrom: this.dateFrom() || undefined,
      dateTo: this.dateTo() || undefined,
      assigneeId: this.assigneeId() || undefined,
      search: this.searchTerm().trim() || undefined
    }).pipe(
      finalize(() => this.isExporting.set(false)),
      catchError(err => {
        console.error('Export failed:', err);
        this.toastService.error('Export ล้มเหลว');
        return of(null);
      })
    ).subscribe(resp => {
      if (!resp?.body) return;
      const fileName = this.tryParseFileName(resp.headers.get('content-disposition') ?? resp.headers.get('Content-Disposition')) ?? 'sales-report_admin.xlsx';
      const url = window.URL.createObjectURL(resp.body);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      this.toastService.success('Export สำเร็จ');
    });
  }

  private tryParseFileName(contentDisposition: string | null): string | null {
    if (!contentDisposition) return null;
    const match = /filename\\*=UTF-8''([^;]+)|filename=\"?([^\";]+)\"?/i.exec(contentDisposition);
    const raw = match?.[1] ?? match?.[2];
    if (!raw) return null;
    try { return decodeURIComponent(raw); } catch { return raw; }
  }

  // Tabs scroll helpers (copied)
  onTabsScroll(): void { this.checkScrollPosition(); }

  private setupResizeObserver(): void {
    if (typeof ResizeObserver !== 'undefined' && this.tabsNav?.nativeElement) {
      this.resizeObserver = new ResizeObserver(() => this.checkScrollPosition());
      this.resizeObserver.observe(this.tabsNav.nativeElement);
    }
    window.addEventListener('resize', () => this.checkScrollPosition());
  }

  private checkScrollPosition(): void {
    if (!this.tabsNav?.nativeElement) return;
    const el = this.tabsNav.nativeElement;
    this.showLeftScroll.set(el.scrollLeft > 0);
    this.showRightScroll.set(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  }

  scrollLeft(): void {
    if (!this.tabsNav?.nativeElement) return;
    const el = this.tabsNav.nativeElement;
    el.scrollBy({ left: -(el.clientWidth * 0.8), behavior: 'smooth' });
  }

  scrollRight(): void {
    if (!this.tabsNav?.nativeElement) return;
    const el = this.tabsNav.nativeElement;
    el.scrollBy({ left: el.clientWidth * 0.8, behavior: 'smooth' });
  }

  // Detail/edit dialogs: keep same behavior as existing page
  openDetailDialog(report: SalesReport): void {
    this.selectedReport.set(report);
    this.showDetailDialog.set(true);
  }
  closeDetailDialog(): void {
    this.showDetailDialog.set(false);
    this.selectedReport.set(null);
  }
  handleUpdateStatus(status: ReportStatus): void {
    this.reportToEdit.set(this.selectedReport());
    this.statusToEdit.set(status);
    this.closeDetailDialog();
    this.showEditReportDialog.set(true);
  }
  handleSaveReport(_: any): void {
    // Admin summary page: editing not in scope now (keep UI same but do nothing)
    this.closeEditReportDialog();
  }
  closeEditReportDialog(): void {
    this.showEditReportDialog.set(false);
    this.reportToEdit.set(null);
    this.statusToEdit.set(null);
  }
  closeOpenJobDialog(): void { this.showOpenJobDialog.set(false); }
  confirmOpenJob(_: any): void { this.showOpenJobDialog.set(false); }

  // Map API dto -> SalesReport (reuse logic from SalesReportComponent)
  private mapApiDataToSalesReports(apiReports: any[]): SalesReport[] {
    if (!Array.isArray(apiReports)) return [];
    const valid: SalesReport[] = [];

    for (const api of apiReports) {
      let status: ReportStatus = 'Pending';
      const salesStatus = (api.salesStatus || '').toLowerCase().trim();
      if (salesStatus === 'success' || salesStatus === 'สำเร็จ') status = 'Success';
      else if (salesStatus === 'failed' || salesStatus === 'ไม่สำเร็จ') status = 'Failed';
      else if (salesStatus === 'rejected' || salesStatus === 'cancelled' || salesStatus === 'ปฏิเสธ') status = 'Rejected';
      else status = 'Pending';

      const interestedProducts = api.productCategory
        ? String(api.productCategory).split(',').map((p: string) => p.trim()).filter((p: string) => p.length > 0)
        : [];

      const submittedAt = api.submittedAt ? new Date(api.submittedAt) : new Date();
      const saleDate = api.saleDate ? new Date(api.saleDate) : undefined;

      valid.push({
        id: String(api.id ?? ''),
        jobNumber: api.jobNumber || '',
        jobRunningCode: api.jobRunningCode ?? null,
        customerName: api.customerName || '',
        contactInfo: api.customerContact || '',
        status,
        interestedProducts,
        reasons: api.reasons || [],
        submittedAt,
        saleDate,
        salesperson: {
          name: api.assigneeName || 'ไม่ระบุ',
          avatarUrl: (api.assigneeAvatar && String(api.assigneeAvatar).trim().length > 0)
            ? String(api.assigneeAvatar)
            : `https://ui-avatars.com/api/?name=${encodeURIComponent(api.assigneeName || 'User')}&background=6366f1&color=fff&size=128`
        },
        notes: api.description || ''
      });
    }

    return valid;
  }

  // UI helpers (copied)
  getChipDisplay(items: string[]): { display: string[]; remainder: number } {
    const max = 2;
    if (items.length <= max) return { display: items, remainder: 0 };
    return { display: items.slice(0, max), remainder: items.length - max };
  }
  getTooltip(items: string[]): string { return items.join(', '); }

  formatThaiDateTime(date?: Date): string {
    if (!date) return '-';
    const d = new Date(date);
    const dateOptions: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
    const timeOptions: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', hour12: false };
    const thaiDate = new Intl.DateTimeFormat('th-TH', dateOptions).format(d);
    const thaiTime = new Intl.DateTimeFormat('th-TH', timeOptions).format(d);
    return `${thaiDate} (${thaiTime} น.)`;
  }

  getCustomerInitials(customerName: string): string {
    if (!customerName || customerName.trim().length === 0) return '?';
    const cleaned = customerName.replace(/^(คุณ|บริษัท|โครงการ)\\s+/i, '').trim();
    if (cleaned.length >= 2) return cleaned.substring(0, 2);
    return cleaned.substring(0, 1);
  }

  getCustomerAvatarColor(status: ReportStatus | string | undefined): string {
    switch (status) {
      case 'Success': return 'bg-green-500';
      case 'Pending': return 'bg-yellow-500';
      case 'Failed': return 'bg-red-500';
      case 'Rejected': return 'bg-rose-500';
      default: return 'bg-slate-500';
    }
  }

  getStatusIcon(status: ReportStatus): { color: string; text: string } {
    switch (status) {
      case 'Success': return { color: 'bg-green-500', text: 'สำเร็จ' };
      case 'Pending': return { color: 'bg-yellow-500', text: 'รอตัดสินใจ' };
      case 'Failed': return { color: 'bg-red-500', text: 'ไม่สำเร็จ' };
      case 'Rejected': return { color: 'bg-rose-500', text: 'ปฏิเสธงาน' };
    }
  }

  private toYmd(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}

