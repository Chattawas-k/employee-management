import { Component, OnInit, OnDestroy, signal, computed, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { ManagerQueueService } from '../../services/manager-queue.service';
import { SignalRService } from '../../services/signalr.service';
import { ToastService } from '../../services/toast.service';
import { ManagerTicket } from '../../models/manager.model';
import { FilterBarComponent } from '../../shared/components/filter-bar/filter-bar.component';
import { DataTableComponent, TableColumn } from '../../shared/components/data-table/data-table.component';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { TicketDetailDrawerComponent } from '../../shared/components/ticket-detail-drawer/ticket-detail-drawer.component';
import { ForceAssignDialogComponent } from '../../shared/components/force-assign-dialog/force-assign-dialog.component';
import { TransferDialogComponent } from '../../shared/components/transfer-dialog/transfer-dialog.component';
import { EscalateDialogComponent } from '../../shared/components/escalate-dialog/escalate-dialog.component';
import { CancelDialogComponent } from '../../shared/components/cancel-dialog/cancel-dialog.component';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-manager-live-queue',
  standalone: true,
  imports: [
    CommonModule,
    FilterBarComponent,
    DataTableComponent,
    PaginationComponent,
    TicketDetailDrawerComponent,
    ForceAssignDialogComponent,
    TransferDialogComponent,
    EscalateDialogComponent,
    CancelDialogComponent
  ],
  templateUrl: './manager-live-queue.component.html',
  styleUrls: ['./manager-live-queue.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ManagerLiveQueueComponent implements OnInit, OnDestroy {
  tickets = signal<ManagerTicket[]>([]);
  isLoading = signal(false);
  totalCount = signal(0);
  currentPage = signal(1);
  pageSize = signal(50);
  totalPages = signal(1);

  // Filters
  selectedStatus = signal<string>('');
  selectedChannel = signal<string>('');
  selectedCategory = signal<string>('');
  selectedStaff = signal<string>('');
  dateFrom = signal<Date | null>(null);
  dateTo = signal<Date | null>(null);
  isSlaAtRisk = signal<boolean | null>(null);
  isEscalated = signal<boolean | null>(null);

  // UI State
  selectedTicket = signal<ManagerTicket | null>(null);
  showTicketDrawer = signal(false);
  showForceAssignDialog = signal(false);
  showTransferDialog = signal(false);
  showEscalateDialog = signal(false);
  showCancelDialog = signal(false);
  actionTicketId = signal<string>('');
  actionTicketNumber = computed(() => {
    const ticket = this.tickets().find(t => t.id === this.actionTicketId());
    return ticket?.jobNumber || '';
  });
  actionTicketAssignee = computed(() => {
    const ticket = this.tickets().find(t => t.id === this.actionTicketId());
    return ticket?.assignedStaffName;
  });
  actionTicketAssigneeId = computed(() => {
    const ticket = this.tickets().find(t => t.id === this.actionTicketId());
    return ticket?.assignedStaffId;
  });

  // Table columns
  columns: TableColumn[] = [
    { key: 'jobNumber', label: 'เลขที่', sortable: true },
    { key: 'customer', label: 'ลูกค้า', sortable: true },
    { key: 'channel', label: 'ช่องทาง', sortable: true },
    { key: 'category', label: 'หมวดหมู่', sortable: true },
    { key: 'status', label: 'สถานะ', sortable: true },
    { key: 'priority', label: 'ความสำคัญ', sortable: true },
    { key: 'assignedStaffName', label: 'ทีมงาน', sortable: true },
    { key: 'createdDate', label: 'สร้างเมื่อ', sortable: true },
    { key: 'actions', label: 'การดำเนินการ', sortable: false }
  ];

  // Options for filters
  statusOptions: string[] = ['Pending', 'Assigned', 'InProgress', 'ClosedWon', 'ClosedLost', 'Cancelled'];
  channelOptions: string[] = ['Phone', 'Chat', 'Walk-in', 'Email'];
  categoryOptions: string[] = []; // Will be loaded from data

  private autoRefreshInterval: any;

  constructor(
    private queueService: ManagerQueueService,
    private signalRService: SignalRService,
    private toastService: ToastService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit(): Promise<void> {
    // Check for ticketId in query params
    this.route.queryParams.subscribe(params => {
      if (params['ticketId']) {
        this.loadTicketDetail(params['ticketId']);
      }
    });

    await this.initializeSignalR();
    await this.loadTickets();
    this.startAutoRefresh();
  }

  ngOnDestroy(): void {
    this.cleanupSignalR();
    this.stopAutoRefresh();
  }

  private async initializeSignalR(): Promise<void> {
    try {
      await this.signalRService.startConnection();
      this.signalRService.onQueueUpdated(() => {
        this.loadTickets();
      });
      this.signalRService.onJobStatusChanged(() => {
        this.loadTickets();
      });
    } catch (error) {
      console.error('Failed to initialize SignalR:', error);
    }
  }

  private cleanupSignalR(): void {
    this.signalRService.offQueueUpdated();
    this.signalRService.offJobStatusChanged();
  }

  async loadTickets(): Promise<void> {
    this.isLoading.set(true);
    this.cdr.markForCheck();

    const status = this.selectedStatus() || undefined;
    const dateFrom = this.dateFrom();
    const dateTo = this.dateTo();

    this.queueService.getTickets(
      status, 
      dateFrom || undefined, 
      dateTo || undefined,
      this.selectedChannel() || undefined,
      this.selectedCategory() || undefined,
      this.selectedStaff() || undefined,
      this.isSlaAtRisk() ?? undefined,
      this.isEscalated() ?? undefined,
      this.currentPage(),
      this.pageSize()
    ).pipe(
      catchError(error => {
        console.error('Error loading tickets:', error);
        this.toastService.error('เกิดข้อผิดพลาดในการโหลดข้อมูล Tickets');
        return of({ tickets: [], totalCount: 0, pageNumber: 1, pageSize: 50, totalPages: 0 });
      }),
      finalize(() => {
        this.isLoading.set(false);
        this.cdr.markForCheck();
      })
    ).subscribe(response => {
      this.tickets.set(response.tickets);
      this.totalCount.set(response.totalCount);
      this.currentPage.set(response.pageNumber);
      this.totalPages.set(response.totalPages);
      
      // Extract unique categories from all tickets (would need separate call or cache)
      const categories = [...new Set(response.tickets.map(t => t.category).filter(c => c))];
      this.categoryOptions = categories;
      
      this.cdr.markForCheck();
    });
  }

  onFilterChange(filters: any): void {
    this.dateFrom.set(filters.dateFrom || null);
    this.dateTo.set(filters.dateTo || null);
    this.selectedStatus.set(filters.status || '');
    this.selectedChannel.set(filters.channel || '');
    this.selectedCategory.set(filters.category || '');
    this.selectedStaff.set(filters.staffId || '');
    this.currentPage.set(1);
    this.loadTickets();
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
    this.loadTickets();
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadTickets();
  }

  onTicketClick(ticket: ManagerTicket): void {
    this.selectedTicket.set(ticket);
    this.showTicketDrawer.set(true);
  }

  onTicketDrawerClose(): void {
    this.showTicketDrawer.set(false);
    this.selectedTicket.set(null);
  }

  onForceAssignClick(ticket: ManagerTicket): void {
    this.actionTicketId.set(ticket.id);
    this.showForceAssignDialog.set(true);
  }

  onForceAssignConfirm(data: { jobId: string; staffId: string; reason?: string }): void {
    this.queueService.forceAssign(data.jobId, data.staffId, data.reason).pipe(
      catchError(error => {
        console.error('Error force assigning:', error);
        this.toastService.error('เกิดข้อผิดพลาดในการ Force Assign');
        return of(null);
      })
    ).subscribe(response => {
      if (response) {
        this.toastService.success('Force Assign สำเร็จ');
        this.showForceAssignDialog.set(false);
        this.loadTickets();
      }
    });
  }

  onTransferClick(ticket: ManagerTicket): void {
    this.actionTicketId.set(ticket.id);
    this.showTransferDialog.set(true);
  }

  onTransferConfirm(data: { jobId: string; toStaffId: string; reason: string }): void {
    this.queueService.transfer(data.jobId, data.toStaffId, data.reason).pipe(
      catchError(error => {
        console.error('Error transferring:', error);
        this.toastService.error('เกิดข้อผิดพลาดในการ Transfer');
        return of(null);
      })
    ).subscribe(response => {
      if (response) {
        this.toastService.success('Transfer สำเร็จ');
        this.showTransferDialog.set(false);
        this.loadTickets();
      }
    });
  }

  onEscalateClick(ticket: ManagerTicket): void {
    this.actionTicketId.set(ticket.id);
    this.showEscalateDialog.set(true);
  }

  onEscalateConfirm(data: { jobId: string; reason?: string }): void {
    this.queueService.escalate(data.jobId, data.reason).pipe(
      catchError(error => {
        console.error('Error escalating:', error);
        this.toastService.error('เกิดข้อผิดพลาดในการ Escalate');
        return of(null);
      })
    ).subscribe(response => {
      if (response) {
        this.toastService.success('Escalate สำเร็จ');
        this.showEscalateDialog.set(false);
        this.loadTickets();
      }
    });
  }

  onCancelClick(ticket: ManagerTicket): void {
    this.actionTicketId.set(ticket.id);
    this.showCancelDialog.set(true);
  }

  onCancelConfirm(data: { jobId: string; reason: string }): void {
    this.queueService.cancel(data.jobId, data.reason).pipe(
      catchError(error => {
        console.error('Error cancelling:', error);
        this.toastService.error('เกิดข้อผิดพลาดในการ Cancel');
        return of(null);
      })
    ).subscribe(response => {
      if (response) {
        this.toastService.success('Cancel สำเร็จ');
        this.showCancelDialog.set(false);
        this.loadTickets();
      }
    });
  }

  private async loadTicketDetail(ticketId: string): Promise<void> {
    this.queueService.getTicket(ticketId).pipe(
      catchError(error => {
        console.error('Error loading ticket detail:', error);
        return of(null);
      })
    ).subscribe(ticket => {
      if (ticket) {
        // Convert to ManagerTicket format if needed
        this.selectedTicket.set(ticket as any);
        this.showTicketDrawer.set(true);
        this.cdr.markForCheck();
      }
    });
  }

  private startAutoRefresh(): void {
    this.stopAutoRefresh();
    this.autoRefreshInterval = setInterval(() => {
      this.loadTickets();
    }, 30000); // 30 seconds
  }

  private stopAutoRefresh(): void {
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
      this.autoRefreshInterval = null;
    }
  }

  getStatusBadgeClass(status: string): string {
    const statusLower = status.toLowerCase();
    if (statusLower === 'pending') return 'bg-yellow-100 text-yellow-700';
    if (statusLower === 'assigned') return 'bg-blue-100 text-blue-700';
    if (statusLower === 'inprogress') return 'bg-purple-100 text-purple-700';
    if (statusLower === 'closedwon') return 'bg-green-100 text-green-700';
    if (statusLower === 'closedlost') return 'bg-red-100 text-red-700';
    return 'bg-gray-100 text-gray-700';
  }

  getTableData(): any[] {
    return this.tickets().map(ticket => ({
      ...ticket,
      statusBadge: `<span class="px-2 py-1 text-xs font-medium rounded-full ${this.getStatusBadgeClass(ticket.status)}">${ticket.status}</span>`,
      priorityBadge: `<span class="px-2 py-1 text-xs font-medium rounded border ${ticket.priority === 'Urgent' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-gray-100 text-gray-700 border-gray-200'}">${ticket.priority}</span>`,
      waitTime: this.formatWaitTime(ticket.createdDate),
      createdDateFormatted: new Date(ticket.createdDate).toLocaleString('th-TH')
    }));
  }

  handleTableAction(event: { action: string; row: any }): void {
    const ticket = this.tickets().find(t => t.id === event.row.id);
    if (!ticket) return;

    switch (event.action) {
      case 'force-assign':
        this.onForceAssignClick(ticket);
        break;
      case 'transfer':
        this.onTransferClick(ticket);
        break;
      case 'escalate':
        this.onEscalateClick(ticket);
        break;
      case 'cancel':
        this.onCancelClick(ticket);
        break;
    }
  }

  formatWaitTime(createdDate: string): string {
    const created = new Date(createdDate);
    const now = new Date();
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) return `${diffMins} นาที`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} ชั่วโมง`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} วัน`;
  }
}
