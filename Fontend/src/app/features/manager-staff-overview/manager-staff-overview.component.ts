import { Component, OnInit, OnDestroy, signal, computed, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { ManagerStaffService } from '../../services/manager-staff.service';
import { SignalRService } from '../../services/signalr.service';
import { ToastService } from '../../services/toast.service';
import { ManagerStaff, StaffDetail } from '../../models/manager.model';
import { FilterBarComponent } from '../../shared/components/filter-bar/filter-bar.component';
import { StaffDetailDrawerComponent } from '../../shared/components/staff-detail-drawer/staff-detail-drawer.component';
import { ChartCardComponent } from '../manager-dashboard/components/chart-card/chart-card.component';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-manager-staff-overview',
  standalone: true,
  imports: [
    CommonModule,
    FilterBarComponent,
    StaffDetailDrawerComponent,
    ChartCardComponent
  ],
  templateUrl: './manager-staff-overview.component.html',
  styleUrls: ['./manager-staff-overview.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ManagerStaffOverviewComponent implements OnInit, OnDestroy {
  staff = signal<ManagerStaff[]>([]);
  isLoading = signal(false);
  selectedStaff = signal<StaffDetail | null>(null);
  showStaffDrawer = signal(false);

  // Filters
  dateFrom = signal<Date | null>(null);
  dateTo = signal<Date | null>(null);
  selectedStatus = signal<string>('');

  private autoRefreshInterval: any;

  constructor(
    private staffService: ManagerStaffService,
    private signalRService: SignalRService,
    private toastService: ToastService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit(): Promise<void> {
    // Check for staffId in query params
    this.route.queryParams.subscribe(params => {
      if (params['staffId']) {
        this.loadStaffDetail(params['staffId']);
      }
    });

    await this.initializeSignalR();
    await this.loadStaff();
    this.startAutoRefresh();
  }

  ngOnDestroy(): void {
    this.cleanupSignalR();
    this.stopAutoRefresh();
  }

  private async initializeSignalR(): Promise<void> {
    try {
      await this.signalRService.startConnection();
      this.signalRService.onEmployeeStatusChanged(() => {
        this.loadStaff();
      });
    } catch (error) {
      console.error('Failed to initialize SignalR:', error);
    }
  }

  private cleanupSignalR(): void {
    this.signalRService.offEmployeeStatusChanged();
  }

  async loadStaff(): Promise<void> {
    this.isLoading.set(true);
    this.cdr.markForCheck();

    const dateFrom = this.dateFrom();
    const dateTo = this.dateTo();

    this.staffService.getStaff(dateFrom || undefined, dateTo || undefined).pipe(
      catchError(error => {
        console.error('Error loading staff:', error);
        this.toastService.error('เกิดข้อผิดพลาดในการโหลดข้อมูลทีมงาน');
        return of({ staff: [] });
      }),
      finalize(() => {
        this.isLoading.set(false);
        this.cdr.markForCheck();
      })
    ).subscribe(response => {
      let filtered = response.staff;

      // Apply status filter
      if (this.selectedStatus()) {
        filtered = filtered.filter(s => s.status.toLowerCase() === this.selectedStatus().toLowerCase());
      }

      this.staff.set(filtered);
      this.cdr.markForCheck();
    });
  }

  onFilterChange(filters: any): void {
    this.dateFrom.set(filters.dateFrom || null);
    this.dateTo.set(filters.dateTo || null);
    this.selectedStatus.set(filters.status || '');
    this.loadStaff();
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
    
    this.loadStaff();
  }

  onStaffClick(staff: ManagerStaff): void {
    this.loadStaffDetail(staff.id);
  }

  private async loadStaffDetail(staffId: string): Promise<void> {
    this.staffService.getStaffDetail(staffId, this.dateFrom() || undefined, this.dateTo() || undefined).pipe(
      catchError(error => {
        console.error('Error loading staff detail:', error);
        this.toastService.error('เกิดข้อผิดพลาดในการโหลดรายละเอียดทีมงาน');
        return of(null);
      })
    ).subscribe(detail => {
      if (detail) {
        this.selectedStaff.set(detail);
        this.showStaffDrawer.set(true);
        this.cdr.markForCheck();
      }
    });
  }

  onStaffDrawerClose(): void {
    this.showStaffDrawer.set(false);
    this.selectedStaff.set(null);
  }

  getStatusColor(status: string): string {
    const statusLower = status.toLowerCase();
    if (statusLower === 'available' || statusLower === 'พร้อม') {
      return 'bg-green-100 text-green-700 border-green-200';
    } else if (statusLower === 'busy' || statusLower === 'ยุ่ง') {
      return 'bg-red-100 text-red-700 border-red-200';
    } else if (statusLower === 'break' || statusLower === 'พัก') {
      return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    }
    return 'bg-gray-100 text-gray-700 border-gray-200';
  }

  getInitials(name: string): string {
    const words = name.trim().split(/\s+/);
    if (words.length === 0) return '';
    if (words.length === 1) return words[0].charAt(0).toUpperCase();
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  }

  private startAutoRefresh(): void {
    this.stopAutoRefresh();
    this.autoRefreshInterval = setInterval(() => {
      this.loadStaff();
    }, 30000); // 30 seconds
  }

  private stopAutoRefresh(): void {
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
      this.autoRefreshInterval = null;
    }
  }
}
