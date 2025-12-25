import { ChangeDetectionStrategy, Component, signal, output, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SalesReportDetailDialogComponent } from '../sales-report-detail-dialog/sales-report-detail-dialog.component';
import { SalesReportDialogComponent } from '../sales-report-dialog/sales-report-dialog.component';

export type ReportStatus = 'Success' | 'Pending' | 'Failed';

export interface SalesReport {
  id: string;
  customerName: string;
  contactInfo: string;
  status: ReportStatus;
  interestedProducts: string[];
  reasons: string[];
  submittedAt: Date;
  saleDate?: Date;
  salesperson: {
    name: string;
    avatarUrl: string;
  };
  saleValue?: number;
  invoiceId?: string;
  nextFollowUp?: Date;
  notes?: string;
  competitor?: string;
}

@Component({
  selector: 'app-sales-report',
  standalone: true,
  imports: [CommonModule, FormsModule, SalesReportDetailDialogComponent, SalesReportDialogComponent],
  templateUrl: './sales-report.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SalesReportComponent {
  menuClick = output<void>();
  statusBannerInfo = input<{ title: string; subtitle: string; } | null>(null);

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

  searchTerm = signal('');
  activeTab = signal<ReportStatus | 'All'>('All');
  showDetailDialog = signal(false);
  selectedReport = signal<SalesReport | null>(null);

  // Edit dialog state
  showEditReportDialog = signal(false);
  reportToEdit = signal<SalesReport | null>(null);
  statusToEdit = signal<ReportStatus | null>(null);

  // Pagination state
  itemsPerPage = signal(8);
  currentPage = signal(1);

  // Duplicated from sales-report-dialog for data transformation
  private readonly interestedProductsList = [
    { controlName: 'livingRoom', label: 'โซฟาและห้องนั่งเล่น' },
    { controlName: 'bedroom', label: 'ชุดห้องนอน' },
    { controlName: 'dining', label: 'โต๊ะอาหาร' },
    { controlName: 'kitchen', label: 'ชุดครัว' },
    { controlName: 'office', label: 'เฟอร์นิเจอร์สำนักงาน' },
    { controlName: 'outdoor', label: 'เฟอร์นิเจอร์นอกบ้าน' },
    { controlName: 'lighting', label: 'โคมไฟและของตกแต่ง' },
    { controlName: 'storage', label: 'ตู้และชั้นวางของ' },
    { controlName: 'kids', label: 'เฟอร์นิเจอร์เด็ก' }
  ];
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
    const reports = this.allReports();
    const result = reports.reduce((acc, report) => {
      acc[report.status] = (acc[report.status] || 0) + 1;
      return acc;
    }, { All: reports.length } as Record<ReportStatus | 'All', number>);
    return result;
  });

  sortedReports = computed(() => {
    return this.allReports().sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());
  });

  filteredReports = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const tab = this.activeTab();
    let reports = this.sortedReports();

    if (tab !== 'All') {
      reports = reports.filter(report => report.status === tab);
    }

    if (!term) {
      return reports;
    }

    return reports.filter(report =>
      report.customerName.toLowerCase().includes(term) ||
      report.contactInfo.toLowerCase().includes(term) ||
      report.id.toLowerCase().includes(term) ||
      report.interestedProducts.some(p => p.toLowerCase().includes(term))
    );
  });
  
  totalPages = computed(() => {
    if (this.filteredReports().length === 0) return 1;
    return Math.ceil(this.filteredReports().length / this.itemsPerPage());
  });
  
  pages = computed(() => {
    return Array.from({ length: this.totalPages() }, (_, i) => i + 1);
  });

  paginatedReports = computed(() => {
    const reports = this.filteredReports();
    const page = this.currentPage();
    const perPage = this.itemsPerPage();
    const start = (page - 1) * perPage;
    const end = start + perPage;
    return reports.slice(start, end);
  });

  onSearchTermChange(term: string) {
    this.searchTerm.set(term);
    this.currentPage.set(1);
  }

  setTab(tab: ReportStatus | 'All') {
    this.activeTab.set(tab);
    this.currentPage.set(1);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  nextPage() {
    this.goToPage(this.currentPage() + 1);
  }

  previousPage() {
    this.goToPage(this.currentPage() - 1);
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

    const interestedProducts = this.interestedProductsList
      .filter(p => formData.interestedProducts[p.controlName])
      .map(p => p.label);
    
    const reasons = [...this.pendingReasons, ...this.failedReasons]
      .filter(r => formData.reasons[r.controlName])
      .map(r => r.label);

    const updatedReport: SalesReport = {
      ...reportToUpdate,
      customerName: formData.customerName,
      contactInfo: formData.contactInfo,
      status: formData.status,
      interestedProducts,
      reasons,
      notes: formData.additionalInfo,
      submittedAt: new Date(), // Update timestamp
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
}