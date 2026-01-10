import { Component, OnInit, OnDestroy, signal, computed, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ManagerDealsService } from '../../services/manager-deals.service';
import { SignalRService } from '../../services/signalr.service';
import { ToastService } from '../../services/toast.service';
import { ManagerDeal, DealsSummary } from '../../models/manager.model';
import { FilterBarComponent } from '../../shared/components/filter-bar/filter-bar.component';
import { DataTableComponent, TableColumn } from '../../shared/components/data-table/data-table.component';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { ChartCardComponent } from '../manager-dashboard/components/chart-card/chart-card.component';
import { KpiCardComponent } from '../manager-dashboard/components/kpi-card/kpi-card.component';
import { catchError, finalize } from 'rxjs/operators';
import { of, forkJoin } from 'rxjs';

@Component({
  selector: 'app-manager-deals-sales',
  standalone: true,
  imports: [
    CommonModule,
    FilterBarComponent,
    DataTableComponent,
    PaginationComponent,
    ChartCardComponent,
    KpiCardComponent
  ],
  templateUrl: './manager-deals-sales.component.html',
  styleUrls: ['./manager-deals-sales.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ManagerDealsSalesComponent implements OnInit, OnDestroy {
  deals = signal<ManagerDeal[]>([]);
  summary = signal<DealsSummary | null>(null);
  isLoading = signal(false);
  totalCount = signal(0);
  currentPage = signal(1);
  pageSize = signal(50);
  totalPages = signal(1);

  // Filters
  dateFrom = signal<Date | null>(null);
  dateTo = signal<Date | null>(null);
  selectedStaff = signal<string>('');
  selectedCategory = signal<string>('');
  selectedChannel = signal<string>('');
  selectedOutcome = signal<string>('');

  // Options
  staffOptions: Array<{ id: string; name: string }> = [];
  categoryOptions: string[] = [];
  channelOptions: string[] = ['Phone', 'Chat', 'Walk-in', 'Email'];
  outcomeOptions: string[] = ['ClosedWon', 'ClosedLost'];

  // Table columns
  columns: TableColumn[] = [
    { key: 'jobNumber', label: 'เลขที่', sortable: true },
    { key: 'customer', label: 'ลูกค้า', sortable: true },
    { key: 'channel', label: 'ช่องทาง', sortable: true },
    { key: 'category', label: 'หมวดหมู่', sortable: true },
    { key: 'staffName', label: 'ทีมงาน', sortable: true },
    { key: 'outcome', label: 'ผลลัพธ์', sortable: true },
    { key: 'saleValue', label: 'ยอดขาย', sortable: true, align: 'right' },
    { key: 'createdDate', label: 'สร้างเมื่อ', sortable: true },
    { key: 'closedDate', label: 'ปิดเมื่อ', sortable: true }
  ];

  private autoRefreshInterval: any;

  constructor(
    private dealsService: ManagerDealsService,
    private signalRService: SignalRService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit(): Promise<void> {
    await this.initializeSignalR();
    await this.loadData();
    this.startAutoRefresh();
  }

  ngOnDestroy(): void {
    this.cleanupSignalR();
    this.stopAutoRefresh();
  }

  private async initializeSignalR(): Promise<void> {
    try {
      await this.signalRService.startConnection();
      this.signalRService.onJobStatusChanged(() => {
        this.loadData();
      });
    } catch (error) {
      console.error('Failed to initialize SignalR:', error);
    }
  }

  private cleanupSignalR(): void {
    this.signalRService.offJobStatusChanged();
  }

  async loadData(): Promise<void> {
    this.isLoading.set(true);
    this.cdr.markForCheck();

    const dateFrom = this.dateFrom();
    const dateTo = this.dateTo();

    forkJoin({
      deals: this.dealsService.getDeals(
        dateFrom || undefined,
        dateTo || undefined,
        this.selectedStaff() || undefined,
        this.selectedCategory() || undefined,
        this.selectedChannel() || undefined,
        this.selectedOutcome() as any || undefined
      ).pipe(
        catchError(error => {
          console.error('Error loading deals:', error);
          this.toastService.error('เกิดข้อผิดพลาดในการโหลดข้อมูล Deals');
          return of({ deals: [] });
        })
      ),
      summary: this.dealsService.getDealsSummary(dateFrom || undefined, dateTo || undefined).pipe(
        catchError(error => {
          console.error('Error loading summary:', error);
          return of({
            totalSales: 0,
            avgDeal: 0,
            conversionRate: 0,
            topStaff: '',
            topCategory: ''
          } as DealsSummary);
        })
      )
    }).pipe(
      finalize(() => {
        this.isLoading.set(false);
        this.cdr.markForCheck();
      })
    ).subscribe(({ deals, summary }) => {
      this.deals.set(deals.deals);
      this.totalCount.set(deals.deals.length);
      this.summary.set(summary);

      // Extract unique categories
      const categories = [...new Set(deals.deals.map(d => d.category).filter(c => c))];
      this.categoryOptions = categories;

      this.cdr.markForCheck();
    });
  }

  onFilterChange(filters: any): void {
    this.dateFrom.set(filters.dateFrom || null);
    this.dateTo.set(filters.dateTo || null);
    this.selectedStaff.set(filters.staffId || '');
    this.selectedCategory.set(filters.category || '');
    this.currentPage.set(1);
    this.loadData();
  }

  onQuickFilterSelect(filter: string): void {
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
    
    this.currentPage.set(1);
    this.loadData();
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadData();
  }

  getTableData(): any[] {
    return this.deals().map(deal => ({
      ...deal,
      saleValueFormatted: deal.saleValue ? `฿${deal.saleValue.toLocaleString()}` : '-',
      createdDateFormatted: new Date(deal.createdDate).toLocaleString('th-TH'),
      closedDateFormatted: deal.closedDate ? new Date(deal.closedDate).toLocaleString('th-TH') : '-',
      outcomeBadge: `<span class="px-2 py-1 text-xs font-medium rounded-full ${deal.outcome === 'ClosedWon' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">${deal.outcome}</span>`
    }));
  }

  private startAutoRefresh(): void {
    this.stopAutoRefresh();
    this.autoRefreshInterval = setInterval(() => {
      this.loadData();
    }, 30000); // 30 seconds
  }

  private stopAutoRefresh(): void {
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
      this.autoRefreshInterval = null;
    }
  }
}
