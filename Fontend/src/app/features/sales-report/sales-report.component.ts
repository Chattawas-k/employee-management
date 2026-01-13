import { ChangeDetectionStrategy, Component, signal, computed, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CalloutCardComponent } from '../../shared/components/callout-card/callout-card.component';
import { SalesReportDetailDialogComponent } from '../../shared/components/sales-report-detail-dialog/sales-report-detail-dialog.component';
import { SalesReportDialogComponent } from '../../shared/components/sales-report-dialog/sales-report-dialog.component';
import { OpenJobDialogComponent } from '../../shared/components/open-job-dialog/open-job-dialog.component';
import { SalesReport, ReportStatus } from '../../models/sales-report.model';
import { SalesReportService } from '../../services/sales-report.service';
import { TaskService } from '../../services/task.service';
import { AuthService } from '../../services/auth.service';
import { JobPriority, JobStatus } from '../../models/task.model';
import { getEmployeeIdFromToken } from '../../utils/jwt.util';
import { catchError, finalize, switchMap, map } from 'rxjs/operators';
import { of } from 'rxjs';
import { ToastService } from '../../services/toast.service';
import { MyStatusStore } from '../../services/my-status.store';
import { ReceiveCustomerService } from '../../services/receive-customer.service';

// Re-export for backward compatibility
export type { ReportStatus } from '../../models/sales-report.model';
export type { SalesReport } from '../../models/sales-report.model';

@Component({
  selector: 'app-sales-report',
  standalone: true,
  imports: [CommonModule, FormsModule, CalloutCardComponent, SalesReportDetailDialogComponent, SalesReportDialogComponent, OpenJobDialogComponent],
  templateUrl: './sales-report.component.html',
  styleUrls: ['./sales-report.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SalesReportComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('tabsNav', { static: false }) tabsNav!: ElementRef<HTMLElement>;
  
  showLeftScroll = signal(false);
  showRightScroll = signal(false);
  
  private resizeObserver?: ResizeObserver;
  isLoading = signal(false);
  allReports = signal<SalesReport[]>([]);
  totalCount = signal(0); // Total count from API for pagination
  private maxSeenCount = 0; // Track maximum count we've seen to improve estimation
  
  // Centralized status (same across pages)
  private myStatusStore = inject(MyStatusStore);
  private receiveCustomerService = inject(ReceiveCustomerService);
  availabilityStatus = this.myStatusStore.availabilityStatus;
  isMyTurn = this.myStatusStore.isMyTurn;
  showOpenJobDialog = signal(false);

  constructor(
    private salesReportService: SalesReportService,
    private taskService: TaskService,
    private authService: AuthService,
    private toastService: ToastService,
  ) {}
  
  // Mock data removed - now using API data
  /*
  allReports = signal<SalesReport[]>([
    {
      id: 'SR-001',
      customerName: 'บริษัท ดีไซน์ แอนด์ เดคคอร์',
      contactInfo: '089-111-2233',
      status: 'Pending',
      interestedProducts: ['โซฟาและห้องนั่งเล่น', 'ชุดห้องนอน', 'โคมไฟและของตกแต่ง', 'ตู้และชั้นวางของ', 'เฟอร์นิเจอร์เด็ก'],
      reasons: ['ขอไปตัดสินใจก่อน', 'เปรียบเทียบกับที่อื่น', 'รอโปรโมชั่น'],
      submittedAt: new Date('2025-12-14T15:30:00'),
      salesperson: { name: 'สมชาย ใจดี', avatarUrl: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?q=80&w=200&auto=format&fit=crop' },
      nextFollowUp: new Date('2025-12-20T10:00:00'),
      notes: 'ลูกค้านำใบเสนอราคาไปเปรียบเทียบกับ Index และ SB Design Square แจ้งว่าจะติดต่อกลับภายในวันที่ 20'
    },
    {
      id: 'SR-002',
      customerName: 'คุณวิภาวรรณ',
      contactInfo: '081-234-5678',
      status: 'Success',
      interestedProducts: ['โซฟาและห้องนั่งเล่น'],
      reasons: [],
      submittedAt: new Date('2025-12-14T11:45:00'),
      saleDate: new Date('2025-12-14T11:40:00'),
      salesperson: { name: 'สมศักดิ์ รักงาน', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop' },
      saleValue: 45000,
      invoiceId: 'INV-2025-12-034'
    },
    {
      id: 'SR-003',
      customerName: 'คุณสมศักดิ์',
      contactInfo: '090-555-1212',
      status: 'Failed',
      interestedProducts: ['ชุดห้องนอน', 'ตู้และชั้นวางของ'],
      reasons: ['ราคาสูงไป', 'เจอที่อื่นถูกกว่า'],
      submittedAt: new Date('2025-12-13T18:00:00'),
      salesperson: { name: 'สมชาย ใจดี', avatarUrl: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?q=80&w=200&auto=format&fit=crop' },
      competitor: 'IKEA',
      notes: 'ลูกค้าแจ้งว่าเจอโปรโมชั่นที่ IKEA ซึ่งราคาถูกกว่าประมาณ 15% และมีการรับประกันนานกว่า'
    },
    {
      id: 'SR-004',
      customerName: 'โครงการ The Grand',
      contactInfo: '02-987-6543',
      status: 'Success',
      interestedProducts: ['เฟอร์นิเจอร์สำนักงาน'],
      reasons: [],
      submittedAt: new Date('2025-12-12T14:20:00'),
      saleDate: new Date('2025-12-12T14:00:00'),
      salesperson: { name: 'สมศักดิ์ รักงาน', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop' },
      saleValue: 125500,
      invoiceId: 'INV-2025-12-029'
    },
    {
      id: 'SR-005',
      customerName: 'คุณมาลี',
      contactInfo: '088-777-9999',
      status: 'Failed',
      interestedProducts: ['ชุดครัว'],
      reasons: ['เปลี่ยนใจ/ไม่ต้องการแล้ว'],
      submittedAt: new Date('2025-12-11T10:05:00'),
      salesperson: { name: 'สมศักดิ์ รักงาน', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop' },
      notes: 'ลูกค้าเปลี่ยนแผนการตกแต่งบ้าน ทำให้ไม่ต้องการชุดครัวใหม่แล้ว'
    },
    {
      id: 'SR-006',
      customerName: 'คุณสมชาย',
      contactInfo: '081-123-4567',
      status: 'Success',
      interestedProducts: ['โต๊ะอาหาร'],
      reasons: [],
      submittedAt: new Date('2025-12-10T16:00:00'),
      saleDate: new Date('2025-12-10T15:50:00'),
      salesperson: { name: 'สมชาย ใจดี', avatarUrl: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?q=80&w=200&auto=format&fit=crop' },
      saleValue: 22000,
      invoiceId: 'INV-2025-12-025'
    },
    ...Array.from({ length: 16 }, (_, i) => i + 7).map(num => {
        const id = `SR-${num.toString().padStart(3, '0')}`;
        const statuses: ReportStatus[] = ['Success', 'Pending', 'Failed'];
        const status = statuses[num % 3];
        const date = new Date(new Date('2025-12-10').getTime() - (num * 24 * 60 * 60 * 1000));
        const isSuccess = status === 'Success';
        return {
          id: id,
          customerName: `ลูกค้าทดสอบ #${num}`,
          contactInfo: `080-000-${num.toString().padStart(4, '0')}`,
          status: status,
          interestedProducts: ['สินค้าทดสอบ'],
          reasons: isSuccess ? [] : ['เหตุผลทดสอบ'],
          submittedAt: date,
          saleDate: isSuccess ? new Date(date.getTime() - (10 * 60 * 1000)) : undefined,
          salesperson: { name: (num % 2 === 0 ? 'สมชาย ใจดี' : 'สมศักดิ์ รักงาน'), avatarUrl: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?q=80&w=200&auto=format&fit=crop' },
          saleValue: isSuccess ? Math.floor(Math.random() * 100000) + 10000 : undefined,
          invoiceId: isSuccess ? `INV-2025-12-${num.toString().padStart(3, '0')}` : undefined
        };
    })
  ]);
  */

  ngOnInit(): void {
    this.myStatusStore.init();
    // Load initial data with current tab and page
    this.loadSalesReports(this.activeTab(), this.currentPage());
    // Load counts separately to show in tabs
    this.loadCounts();
  }

  ngAfterViewInit(): void {
    // Check scroll position after view init
    setTimeout(() => {
      this.checkScrollPosition();
      this.setupResizeObserver();
    }, 100);
  }

  ngOnDestroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  acceptCustomer() {
    this.receiveCustomerService.open();
  }

  closeOpenJobDialog() {
    this.showOpenJobDialog.set(false);
  }

  confirmOpenJob(jobData: any) {
    const token = this.authService.getToken();
    const employeeId = getEmployeeIdFromToken(token);
    
    if (!employeeId) {
      this.toastService.error('ไม่พบข้อมูลพนักงาน');
      return;
    }

    const priority = jobData.priority === 'Urgent' ? JobPriority.Urgent : JobPriority.Normal;
    
    this.isLoading.set(true);
    this.taskService.createJob({
      title: jobData.jobTitle,
      customer: jobData.customerName,
      description: jobData.details || '',
      assigneeId: employeeId,
      priority,
      channel: jobData.channel || 'Walk-in',
      productCategoryId: jobData.productCategoryId || undefined
    }).pipe(
      // After creating job, immediately update status to InProgress
      switchMap(createResponse => {
        if (!createResponse) {
          return of(null);
        }
        // Update status to InProgress automatically
        return this.taskService.updateJobStatus(createResponse.id, {
          id: createResponse.id,
          status: JobStatus.InProgress
        }).pipe(
          map(updateResponse => ({ createResponse, updateResponse }))
        );
      }),
      catchError(error => {
        console.error('Error creating or updating job:', error);
        this.toastService.error('เกิดข้อผิดพลาดในการสร้างงาน');
        return of(null);
      }),
      finalize(() => {
        this.isLoading.set(false);
        this.closeOpenJobDialog();
        // Reload queue info after a short delay to ensure backend has updated
        setTimeout(() => {
          this.myStatusStore.requestRefresh();
        }, 200);
      })
    ).subscribe(response => {
      if (response) {
        this.toastService.success('สร้างงานและเริ่มงานสำเร็จ');
        this.myStatusStore.requestRefresh();
      }
    });
  }

  private setupResizeObserver(): void {
    if (typeof ResizeObserver !== 'undefined' && this.tabsNav?.nativeElement) {
      this.resizeObserver = new ResizeObserver(() => {
        this.checkScrollPosition();
      });
      this.resizeObserver.observe(this.tabsNav.nativeElement);
    }
    
    // Fallback for browsers without ResizeObserver
    window.addEventListener('resize', () => {
      this.checkScrollPosition();
    });
  }

  onTabsScroll(): void {
    this.checkScrollPosition();
  }

  private checkScrollPosition(): void {
    if (!this.tabsNav?.nativeElement) {
      return;
    }

    const element = this.tabsNav.nativeElement;
    const scrollLeft = element.scrollLeft;
    const scrollWidth = element.scrollWidth;
    const clientWidth = element.clientWidth;

    // Show left scroll indicator if scrolled from start
    this.showLeftScroll.set(scrollLeft > 0);
    
    // Show right scroll indicator if can scroll more
    this.showRightScroll.set(scrollLeft < scrollWidth - clientWidth - 1);
  }

  scrollLeft(): void {
    if (!this.tabsNav?.nativeElement) {
      return;
    }
    const element = this.tabsNav.nativeElement;
    const scrollAmount = element.clientWidth * 0.8; // Scroll 80% of visible width
    element.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
  }

  scrollRight(): void {
    if (!this.tabsNav?.nativeElement) {
      return;
    }
    const element = this.tabsNav.nativeElement;
    const scrollAmount = element.clientWidth * 0.8; // Scroll 80% of visible width
    element.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  }

  loadSalesReports(status: ReportStatus | 'All' = 'All', page: number = 1): void {
    this.isLoading.set(true);
    const pageSize = this.itemsPerPage();
    // Map 'All' to undefined for API
    const apiStatus = status === 'All' ? undefined : status;
    this.salesReportService.getSalesReports(apiStatus, page, pageSize).pipe(
      catchError(error => {
        console.error('Error loading sales reports:', error);
        console.error('Error details:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          error: error.error
        });
        
        let errorMessage = 'เกิดข้อผิดพลาดในการโหลดรายงานขาย';
        if (error.status === 401) {
          errorMessage = 'กรุณาเข้าสู่ระบบใหม่';
        } else if (error.status === 403) {
          errorMessage = 'คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้';
        } else if (error.status === 404) {
          errorMessage = 'ไม่พบ API endpoint';
        } else if (error.status >= 500) {
          errorMessage = 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์';
        }
        
        // Use setTimeout to defer toast display after change detection cycle
        setTimeout(() => {
          this.toastService.error(errorMessage);
        }, 0);
        
        return of({ reports: [] });
      }),
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: (response) => {
        console.log('Sales reports response:', response);
        // Backend returns "Reports" but JSON serialization converts to camelCase "reports"
        const reports = this.mapApiDataToSalesReports(response.reports || []);
        console.log('Mapped reports:', reports);
        this.allReports.set(reports);
        
        // Calculate estimated totalCount based on current tab's data
        const pageSize = this.itemsPerPage();
        const currentPage = this.currentPage();
        const itemsInCurrentPage = reports.length;
        const activeTab = this.activeTab();
        
        // Get expected count from counts() for the current tab
        // This is the actual total count for this tab from the API
        const expectedCount = this.counts()[activeTab] || 0;
        
        // Calculate minimum total count based on current page
        const minTotalCount = (currentPage - 1) * pageSize + itemsInCurrentPage;
        
        // If we have expectedCount from counts(), use it as it's the actual total
        if (expectedCount > 0) {
          // Use the expected count as it's the actual total for this tab
          this.totalCount.set(expectedCount);
          this.maxSeenCount = Math.max(this.maxSeenCount, expectedCount);
        } else {
          // Fallback: estimate based on current page data
          if (itemsInCurrentPage === pageSize) {
            // We know there are at least currentPage * pageSize items
            const estimatedMinCount = currentPage * pageSize;
            this.maxSeenCount = Math.max(this.maxSeenCount, estimatedMinCount);
            this.totalCount.set(this.maxSeenCount);
          } else {
            // Last page or empty - we know the exact count
            this.maxSeenCount = Math.max(this.maxSeenCount, minTotalCount);
            this.totalCount.set(minTotalCount);
          }
        }
        
        console.log('Pagination debug:', {
          currentPage,
          itemsInCurrentPage,
          pageSize,
          minTotalCount,
          maxSeenCount: this.maxSeenCount,
          totalCount: this.totalCount(),
          totalPages: this.totalPages(),
          calculatedPages: Math.ceil(this.totalCount() / pageSize)
        });
      },
      error: (error) => {
        console.error('Unexpected error in subscribe:', error);
        // Use setTimeout to defer toast display after change detection cycle
        setTimeout(() => {
          this.toastService.error('เกิดข้อผิดพลาดที่ไม่คาดคิด');
        }, 0);
      }
    });
  }

  private mapApiDataToSalesReports(apiReports: any[]): SalesReport[] {
    if (!Array.isArray(apiReports)) {
      console.error('Expected array but got:', typeof apiReports, apiReports);
      return [];
    }

    const validReports: SalesReport[] = [];

    for (let index = 0; index < apiReports.length; index++) {
      const apiReport = apiReports[index];
      
      if (!apiReport || typeof apiReport !== 'object') {
        console.warn(`Invalid report at index ${index}:`, apiReport);
        continue;
      }
      // Map salesStatus to ReportStatus (Backend sends lowercase: "success", "failed", "pending")
      // Also handle empty string or null as Pending
      let status: ReportStatus = 'Pending';
      const salesStatus = (apiReport.salesStatus || '').toLowerCase().trim();
      if (salesStatus === 'success' || salesStatus === 'สำเร็จ') {
        status = 'Success';
      } else if (salesStatus === 'failed' || salesStatus === 'ไม่สำเร็จ') {
        status = 'Failed';
      } else {
        // Default to Pending for empty, null, or any other value
        status = 'Pending';
      }

      // Parse product category (comma-separated string) to array
      const interestedProducts = apiReport.productCategory 
        ? apiReport.productCategory.split(',').map((p: string) => p.trim()).filter((p: string) => p.length > 0)
        : [];

      // Convert Guid to string for id
      const id = typeof apiReport.id === 'string' ? apiReport.id : apiReport.id?.toString() || '';

      // Parse dates safely (Backend sends DateTimeOffset as ISO 8601 string)
      let submittedAt: Date;
      try {
        if (apiReport.submittedAt) {
          // Handle both DateTimeOffset format and standard ISO string
          const dateStr = typeof apiReport.submittedAt === 'string' 
            ? apiReport.submittedAt 
            : apiReport.submittedAt.toString();
          submittedAt = new Date(dateStr);
          
          // Validate date
          if (isNaN(submittedAt.getTime())) {
            console.warn('Invalid submittedAt date:', apiReport.submittedAt);
            submittedAt = new Date();
          }
        } else {
          submittedAt = new Date();
        }
      } catch (error) {
        console.warn('Error parsing submittedAt:', apiReport.submittedAt, error);
        submittedAt = new Date();
      }

      let saleDate: Date | undefined;
      if (apiReport.saleDate) {
        try {
          const dateStr = typeof apiReport.saleDate === 'string' 
            ? apiReport.saleDate 
            : apiReport.saleDate.toString();
          saleDate = new Date(dateStr);
          
          // Validate date
          if (isNaN(saleDate.getTime())) {
            console.warn('Invalid saleDate:', apiReport.saleDate);
            saleDate = undefined;
          }
        } catch (error) {
          console.warn('Error parsing saleDate:', apiReport.saleDate, error);
          saleDate = undefined;
        }
      }

      const report: SalesReport = {
        id: id,
        jobNumber: apiReport.jobNumber || '',
        customerName: apiReport.customerName || '',
        contactInfo: apiReport.customerContact || '',
        status: status,
        interestedProducts: interestedProducts,
        reasons: apiReport.reasons || [],
        submittedAt: submittedAt,
        saleDate: saleDate,
        salesperson: {
          name: apiReport.assigneeName || 'ไม่ระบุ',
          avatarUrl: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?q=80&w=200&auto=format&fit=crop'
        },
        saleValue: undefined, // Not available in current API response
        invoiceId: apiReport.invoiceId || undefined,
        nextFollowUp: undefined, // Not available in current API response
        notes: apiReport.description || '',
        competitor: undefined // Not available in current API response
      };
      
      validReports.push(report);
    }

    return validReports;
  }

  searchTerm = signal('');
  activeTab = signal<ReportStatus | 'All'>('All');
  showDetailDialog = signal(false);
  selectedReport = signal<SalesReport | null>(null);
  countsData = signal<Record<ReportStatus | 'All', number>>({ All: 0, Success: 0, Pending: 0, Failed: 0 });

  // Edit dialog state
  showEditReportDialog = signal(false);
  reportToEdit = signal<SalesReport | null>(null);
  statusToEdit = signal<ReportStatus | null>(null);

  // Pagination state
  itemsPerPage = signal(8);
  currentPage = signal(1);

  // Product categories are now loaded from master data, no need for hardcoded list
  private readonly pendingReasons = [
    { controlName: 'wantsToDecide', label: 'ขอไปตัดสินใจก่อน' },
    { controlName: 'waitingForPromo', label: 'รอโปรโมชั่น' },
    { controlName: 'comparing', label: 'เปรียบเทียบกับที่อื่น' },
    { controlName: 'consultingFamily', label: 'ปรึกษาครอบครัว/เพื่อน' },
    { controlName: 'needsMoreInfo', label: 'ต้องการข้อมูลเพิ่มเติม' },
    { controlName: 'waitingForStock', label: 'รอสินค้าเข้า' },
    { controlName: 'financialApproval', label: 'รออนุมัติทางการเงิน' },
    { controlName: 'undecidedOnSpec', label: 'ยังไม่แน่ใจเรื่องสี/ขนาด' },
    { controlName: 'seasonalTiming', label: 'รอฤกษ์/ช่วงเวลาที่เหมาะสม' },
    { controlName: 'wantsToSeeSample', label: 'ต้องการดูสินค้าตัวอย่าง' }
  ];
  private readonly failedReasons = [
    { controlName: 'priceTooHigh', label: 'ราคาสูงไป' },
    { controlName: 'productMismatch', label: 'สินค้าไม่ตรงความต้องการ' },
    { controlName: 'badService', label: 'ไม่พอใจบริการ' },
    { controlName: 'foundCheaper', label: 'เจอที่อื่นถูกกว่า' },
    { controlName: 'longDelivery', label: 'ระยะเวลาจัดส่งนานไป' },
    { controlName: 'outOfStock', label: 'สินค้าหมด/เลิกผลิต' },
    { controlName: 'negativeReview', label: 'เห็นรีวิวไม่ดี' },
    { controlName: 'competitorOffer', label: 'ข้อเสนอของคู่แข่งดีกว่า' },
    { controlName: 'changedMind', label: 'เปลี่ยนใจ/ไม่ต้องการแล้ว' },
    { controlName: 'budgetCut', label: 'งบประมาณไม่พอ' }
  ];

  counts = computed(() => {
    return this.countsData();
  });

  private loadCounts(): void {
    // Load all reports without pagination to get counts
    this.salesReportService.getSalesReports(undefined).pipe(
      catchError(error => {
        console.error('Error loading counts:', error);
        return of({ reports: [] });
      })
    ).subscribe({
      next: (response) => {
        const reports = this.mapApiDataToSalesReports(response.reports || []);
        const result = reports.reduce((acc, report) => {
          acc[report.status] = (acc[report.status] || 0) + 1;
          return acc;
        }, { All: reports.length } as Record<ReportStatus | 'All', number>);
        this.countsData.set(result);
      }
    });
  }

  // Reports are already filtered and paginated by API, just apply search filter
  filteredReports = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const reports = this.allReports();

    if (!term) {
      return reports;
    }

    return reports.filter(report =>
      report.customerName.toLowerCase().includes(term) ||
      report.contactInfo.toLowerCase().includes(term) ||
      report.jobNumber.toLowerCase().includes(term) ||
      report.interestedProducts.some(p => p.toLowerCase().includes(term))
    );
  });
  
  totalPages = computed(() => {
    const total = this.totalCount();
    const pageSize = this.itemsPerPage();
    const currentPage = this.currentPage();
    const currentItems = this.allReports().length;
    
    if (total === 0) return 1;
    
    // Calculate total pages based on total count
    let calculatedPages = Math.ceil(total / pageSize);
    
    // If we have a full page of data, there's likely at least one more page
    // So ensure we show at least currentPage + 1 pages if we have full page
    if (currentItems === pageSize && calculatedPages <= currentPage) {
      calculatedPages = currentPage + 1;
    }
    
    // Ensure at least 1 page
    return Math.max(1, calculatedPages);
  });
  
  pages = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];
    
    // Ensure current page is within valid range
    const validCurrent = Math.min(Math.max(1, current), total);
    
    // Show max 5 pages around current page
    let start = Math.max(1, validCurrent - 2);
    let end = Math.min(total, validCurrent + 2);
    
    // Adjust if we're near the start
    if (validCurrent <= 3) {
      start = 1;
      end = Math.min(5, total);
    }
    
    // Adjust if we're near the end
    if (validCurrent >= total - 2 && total > 0) {
      start = Math.max(1, total - 4);
      end = total;
    }
    
    // Ensure we have at least one page
    if (start > end) {
      start = 1;
      end = Math.max(1, total);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  });

  paginatedReports = computed(() => {
    // If search is active, filter locally; otherwise use API data directly
    return this.filteredReports();
  });

  onSearchTermChange(term: string) {
    this.searchTerm.set(term);
    // Search is done locally, no need to reload API
  }

  setTab(tab: ReportStatus | 'All') {
    this.activeTab.set(tab);
    this.currentPage.set(1);
    // Reset maxSeenCount and totalCount when changing tabs
    this.maxSeenCount = 0;
    this.totalCount.set(0);
    // Reload data with new tab filter
    this.loadSalesReports(tab, 1);
  }

  goToPage(page: number) {
    const totalPages = this.totalPages();
    // Allow going to page even if it might be beyond current estimate
    // The API will return empty or partial data if page doesn't exist
    if (page >= 1) {
      this.currentPage.set(page);
      // Reload data with new page
      this.loadSalesReports(this.activeTab(), page);
    }
  }

  firstPage() {
    if (this.currentPage() > 1) {
      this.goToPage(1);
    }
  }

  previousPage() {
    const prevPage = this.currentPage() - 1;
    if (prevPage >= 1) {
      this.goToPage(prevPage);
    }
  }

  nextPage() {
    const nextPage = this.currentPage() + 1;
    if (nextPage <= this.totalPages()) {
      this.goToPage(nextPage);
    }
  }

  lastPage() {
    const last = this.totalPages();
    if (this.currentPage() < last) {
      this.goToPage(last);
    }
  }

  openDetailDialog(report: SalesReport) {
    this.selectedReport.set(report);
    this.showDetailDialog.set(true);
  }

  closeDetailDialog() {
    this.showDetailDialog.set(false);
    this.selectedReport.set(null);
  }
  
  handleUpdateStatus(status: ReportStatus) {
    this.reportToEdit.set(this.selectedReport());
    this.statusToEdit.set(status);
    this.closeDetailDialog();
    this.showEditReportDialog.set(true);
  }

  handleSaveReport(formData: any) {
    const reportToUpdate = this.reportToEdit();
    if (!reportToUpdate) return;

    // formData.interestedProducts is now an array of category names (from sales-report-dialog)
    const interestedProducts = Array.isArray(formData.interestedProducts) 
      ? formData.interestedProducts 
      : [];
    
    const reasons = [...this.pendingReasons, ...this.failedReasons]
      .filter(r => formData.reasons && formData.reasons[r.controlName])
      .map(r => r.label);

    const updatedReport: SalesReport = {
      ...reportToUpdate,
      customerName: formData.customerName,
      contactInfo: formData.contactInfo,
      status: formData.status,
      interestedProducts,
      reasons,
      notes: formData.additionalInfo,
      submittedAt: new Date(),
      saleValue: formData.status === 'Success' ? formData.saleValue : undefined,
      invoiceId: formData.status === 'Success' ? formData.invoiceId : undefined,
      saleDate: formData.status === 'Success' ? new Date() : undefined,
      nextFollowUp: undefined,
      competitor: undefined
    };

    this.allReports.update(reports => {
      const index = reports.findIndex(r => r.id === updatedReport.id);
      if (index > -1) {
        const newReports = [...reports];
        newReports[index] = updatedReport;
        return newReports;
      }
      return reports;
    });

    this.closeEditReportDialog();
  }
  
  closeEditReportDialog() {
    this.showEditReportDialog.set(false);
    this.reportToEdit.set(null);
    this.statusToEdit.set(null);
  }

  getStatusClass(status: ReportStatus): { tag: string, text: string } {
    switch (status) {
      case 'Success':
        return { tag: 'bg-green-100 text-green-800', text: 'สำเร็จ' };
      case 'Pending':
        return { tag: 'bg-yellow-100 text-yellow-800', text: 'รอตัดสินใจ' };
      case 'Failed':
        return { tag: 'bg-red-100 text-red-700', text: 'ไม่สำเร็จ' };
    }
  }

  getChipDisplay(items: string[]): { display: string[], remainder: number } {
    const maxChips = 2;
    if (items.length <= maxChips) {
      return { display: items, remainder: 0 };
    }
    return {
      display: items.slice(0, maxChips),
      remainder: items.length - maxChips
    };
  }

  getTooltip(items: string[]): string {
    return items.join(', ');
  }

  formatThaiDateTime(date?: Date): string {
    if (!date) {
      return '-';
    }
    const d = new Date(date);
    const dateOptions: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    };
    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    };
    const thaiDate = new Intl.DateTimeFormat('th-TH', dateOptions).format(d);
    const thaiTime = new Intl.DateTimeFormat('th-TH', timeOptions).format(d);
    
    return `${thaiDate} (${thaiTime} น.)`;
  }

  getCustomerInitials(customerName: string): string {
    if (!customerName || customerName.trim().length === 0) {
      return '?';
    }
    
    // Remove common prefixes like "คุณ", "บริษัท", "โครงการ"
    const cleaned = customerName
      .replace(/^(คุณ|บริษัท|โครงการ)\s+/i, '')
      .trim();
    
    if (cleaned.length === 0) {
      return customerName.substring(0, 2).toUpperCase();
    }
    
    // Get first 1-2 characters (Thai characters are single-width)
    if (cleaned.length >= 2) {
      return cleaned.substring(0, 2);
    }
    return cleaned.substring(0, 1);
  }

  getCustomerAvatarColor(customerName: string): string {
    if (!customerName || customerName.trim().length === 0) {
      return 'bg-gray-500';
    }
    
    // Simple hash function to generate consistent color from name
    let hash = 0;
    for (let i = 0; i < customerName.length; i++) {
      hash = customerName.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Map hash to one of the colors: green, purple, blue, pink
    const colors = ['bg-green-500', 'bg-purple-500', 'bg-blue-500', 'bg-pink-500'];
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  }

  getStatusIcon(status: ReportStatus): { color: string, text: string } {
    switch (status) {
      case 'Success':
        return { color: 'bg-green-500', text: 'สำเร็จ' };
      case 'Pending':
        return { color: 'bg-yellow-500', text: 'รอตัดสินใจ' };
      case 'Failed':
        return { color: 'bg-red-500', text: 'ไม่สำเร็จ' };
    }
  }
}
