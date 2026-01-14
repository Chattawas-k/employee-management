import { Component, HostListener, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PositionService, PositionDto } from '../../services/position.service';
import { PositionDialogComponent } from '../../shared/components/position-dialog/position-dialog.component';
import { ToastService } from '../../services/toast.service';
import { catchError, debounceTime, distinctUntilChanged, Subject, of } from 'rxjs';
import { StaffService } from '../../services/staff.service';
import { StaffListItem } from '../../models/staff.model';
import { StaffDialogComponent } from '../../shared/components/staff-dialog/staff-dialog.component';
import { getDeterministicAvatarColors, getInitials } from '../../shared/utils/avatar.util';
import { AdminPasswordLinkDialogComponent } from '../../shared/components/admin-password-link-dialog/admin-password-link-dialog.component';
import { GeneratePasswordLinkResponse, PasswordLinkType } from '../../models/password-link.model';

@Component({
  selector: 'app-employee-management',
  standalone: true,
  imports: [CommonModule, FormsModule, StaffDialogComponent, PositionDialogComponent, AdminPasswordLinkDialogComponent],
  templateUrl: './employee-management.component.html',
  styleUrls: ['./employee-management.component.scss']
})
export class EmployeeManagementComponent implements OnInit {
  activeTab = signal<'staff' | 'positions'>('staff');
  
  // Staff (employees + login + roles)
  staff = signal<StaffListItem[]>([]);
  isLoadingStaff = signal(false);
  searchTerm = signal('');

  // Row action menu (rendered as fixed overlay to avoid table/overflow clipping)
  staffActionMenu = signal<{ item: StaffListItem; left: number; top: number } | null>(null);
  positionActionMenu = signal<{ item: PositionDto; left: number; top: number } | null>(null);

  selectedStaff = signal<StaffListItem | null>(null);
  isStaffDialogOpen = signal(false);

  // Password link modal
  isPasswordLinkDialogOpen = signal(false);
  passwordLinkDialogTitle = signal('ลิงก์ตั้งรหัสผ่าน');
  passwordLinkData = signal<GeneratePasswordLinkResponse | null>(null);
  
  // Positions
  positions = signal<PositionDto[]>([]);
  isLoadingPositions = signal(false);
  selectedPosition = signal<PositionDto | null>(null);
  isPositionDialogOpen = signal(false);
  
  private searchSubject = new Subject<string>();
  private imageFailed = new Set<string>();

  constructor(
    private staffService: StaffService,
    private positionService: PositionService,
    private toastService: ToastService
  ) {}

  @HostListener('document:click')
  onDocumentClick(): void {
    if (this.staffActionMenu()) {
      this.staffActionMenu.set(null);
    }
    if (this.positionActionMenu()) {
      this.positionActionMenu.set(null);
    }
  }

  ngOnInit(): void {
    // Load initial data based on default tab (staff)
    this.loadStaff();
    
    // Setup debounced search
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      // local filtering; no server pagination for staff list
    ).subscribe({
      next: (term) => this.searchTerm.set(term)
    });
  }

  setActiveTab(tab: 'staff' | 'positions'): void {
    // Always reload data when clicking tab, even if it's the same tab
    if (tab === 'staff') {
      this.activeTab.set(tab);
      this.loadStaff(true);
    } else if (tab === 'positions') {
      this.activeTab.set(tab);
      this.loadPositions(true); // Force refresh to get latest data
    }
  }

  onSearchChange(term: string): void {
    this.searchSubject.next(term);
  }

  loadStaff(forceRefresh: boolean = false): void {
    this.isLoadingStaff.set(true);
    this.staffService.getStaffList().pipe(
      catchError(error => {
        console.error('Error loading staff list:', error);
        this.toastService.error('เกิดข้อผิดพลาดในการโหลดข้อมูลพนักงาน');
        this.isLoadingStaff.set(false);
        return of({ staff: [] });
      })
    ).subscribe({
      next: (res) => {
        this.staff.set(res.staff || []);
        this.isLoadingStaff.set(false);
      }
    });
  }

  filteredStaff = computed(() => {
    const term = (this.searchTerm() || '').trim().toLowerCase();
    if (!term) return this.staff();
    return this.staff().filter(s =>
      s.fullName.toLowerCase().includes(term) ||
      (s.position || '').toLowerCase().includes(term) ||
      (s.email || '').toLowerCase().includes(term) ||
      (s.userName || '').toLowerCase().includes(term) ||
      (s.roles || []).some(r => r.toLowerCase().includes(term))
    );
  });

  onAddStaff(): void {
    this.selectedStaff.set(null);
    this.isStaffDialogOpen.set(true);
  }

  onEditStaff(item: StaffListItem): void {
    this.closeStaffActionMenu();
    this.selectedStaff.set(item);
    this.isStaffDialogOpen.set(true);
  }

  onStaffDialogClose(): void {
    this.isStaffDialogOpen.set(false);
    this.selectedStaff.set(null);
  }

  onStaffDialogSaved(): void {
    this.loadStaff(true);
  }

  toggleAccountStatus(item: StaffListItem): void {
    this.closeStaffActionMenu();
    const shouldEnable = item.accountStatus === 'disabled';
    this.staffService.setStaffStatus(item.staffId, { isActive: shouldEnable }).subscribe({
      next: () => {
        this.toastService.success(shouldEnable ? 'เปิดใช้งานบัญชีแล้ว' : 'ปิดใช้งานบัญชีแล้ว');
        this.loadStaff(true);
      },
      error: (error) => {
        console.error('Error toggling staff status:', error);
        this.toastService.error('เกิดข้อผิดพลาดในการเปลี่ยนสถานะบัญชี');
      }
    });
  }

  generatePasswordLink(item: StaffListItem, type: PasswordLinkType): void {
    this.closeStaffActionMenu();
    const title = type === 'invite' ? 'สร้างลิงก์ตั้งรหัสผ่าน' : 'สร้างลิงก์รีเซ็ตรหัสผ่านใหม่';
    this.passwordLinkDialogTitle.set(title);
    this.passwordLinkData.set(null);
    this.isPasswordLinkDialogOpen.set(true);

    this.staffService.generatePasswordLink(item.staffId, { type }).subscribe({
      next: (res) => {
        this.passwordLinkData.set(res);
      },
      error: (error) => {
        console.error('Error generating password link:', error);
        this.toastService.error('เกิดข้อผิดพลาดในการสร้างลิงก์');
        this.isPasswordLinkDialogOpen.set(false);
      }
    });
  }

  closePasswordLinkDialog(): void {
    this.isPasswordLinkDialogOpen.set(false);
    this.passwordLinkData.set(null);
  }

  toggleStaffActionMenu(item: StaffListItem, event: MouseEvent): void {
    const current = this.staffActionMenu();
    if (current?.item.staffId === item.staffId) {
      this.staffActionMenu.set(null);
      return;
    }

    const target = event.currentTarget as HTMLElement | null;
    if (!target) {
      this.staffActionMenu.set({ item, left: 8, top: 8 });
      return;
    }

    const rect = target.getBoundingClientRect();
    const MENU_WIDTH = 224; // Tailwind w-56
    const MENU_HEIGHT = 240; // approx for 4 items + divider
    const GAP = 8;

    let left = rect.right - MENU_WIDTH;
    left = Math.max(GAP, Math.min(left, window.innerWidth - MENU_WIDTH - GAP));

    // Prefer open downward; if not enough space, open upward
    const openDownTop = rect.bottom + GAP;
    const openUpTop = rect.top - GAP - MENU_HEIGHT;
    const top = (openDownTop + MENU_HEIGHT <= window.innerHeight) ? openDownTop : Math.max(GAP, openUpTop);

    this.staffActionMenu.set({ item, left, top });
  }

  isStaffActionMenuOpen(staffId: string): boolean {
    return this.staffActionMenu()?.item.staffId === staffId;
  }

  closeStaffActionMenu(): void {
    this.staffActionMenu.set(null);
  }

  togglePositionActionMenu(item: PositionDto, event: MouseEvent): void {
    const current = this.positionActionMenu();
    if (current?.item.id === item.id) {
      this.positionActionMenu.set(null);
      return;
    }

    const target = event.currentTarget as HTMLElement | null;
    if (!target) {
      this.positionActionMenu.set({ item, left: 8, top: 8 });
      return;
    }

    const rect = target.getBoundingClientRect();
    const MENU_WIDTH = 224; // w-56
    const MENU_HEIGHT = 140; // approx for 2 items
    const GAP = 8;

    let left = rect.right - MENU_WIDTH;
    left = Math.max(GAP, Math.min(left, window.innerWidth - MENU_WIDTH - GAP));

    const openDownTop = rect.bottom + GAP;
    const openUpTop = rect.top - GAP - MENU_HEIGHT;
    const top = (openDownTop + MENU_HEIGHT <= window.innerHeight) ? openDownTop : Math.max(GAP, openUpTop);

    this.positionActionMenu.set({ item, left, top });
  }

  isPositionActionMenuOpen(positionId: string): boolean {
    return this.positionActionMenu()?.item.id === positionId;
  }

  closePositionActionMenu(): void {
    this.positionActionMenu.set(null);
  }

  getAccountStatusLabel(status: StaffListItem['accountStatus']): string {
    return status === 'active' ? 'Active' : 'Disabled';
  }

  getAccountStatusClass(status: StaffListItem['accountStatus']): string {
    return status === 'active'
      ? 'bg-green-100 text-green-700'
      : 'bg-gray-100 text-gray-700';
  }

  getPrimaryRoleLabel(roles: string[] | undefined): string {
    const list = roles || [];
    const normalized = list.map(r => r.toLowerCase());
    if (normalized.includes('superadmin')) return 'SuperAdmin';
    if (normalized.includes('admin')) return 'Admin';
    if (normalized.includes('manager')) return 'Manager';
    if (normalized.includes('basic')) return 'Basic';
    return list[0] || '-';
  }

  shouldShowImage(item: StaffListItem): boolean {
    const url = item.profileImageUrl;
    return !!url && !this.imageFailed.has(item.staffId);
  }

  markImageFailed(item: StaffListItem): void {
    this.imageFailed.add(item.staffId);
  }

  getInitials(fullName: string): string {
    return getInitials(fullName);
  }

  getAvatarStyle(staffId: string): { [k: string]: string } {
    const colors = getDeterministicAvatarColors(staffId);
    return {
      backgroundColor: colors.backgroundColor,
      color: colors.textColor
    };
  }

  // Position methods
  loadPositions(forceRefresh: boolean = false): void {
    this.isLoadingPositions.set(true);
    this.positionService.getAll(undefined, forceRefresh).pipe(
      catchError(error => {
        console.error('Error loading positions:', error);
        this.toastService.error('เกิดข้อผิดพลาดในการโหลดข้อมูลตำแหน่ง');
        this.isLoadingPositions.set(false);
        return of([]);
      })
    ).subscribe({
      next: (positions) => {
        this.positions.set(positions);
        this.isLoadingPositions.set(false);
      }
    });
  }

  onAddPosition(): void {
    this.selectedPosition.set(null);
    this.isPositionDialogOpen.set(true);
  }

  onEditPosition(position: PositionDto): void {
    this.selectedPosition.set(position);
    this.isPositionDialogOpen.set(true);
  }

  onDeletePosition(position: PositionDto): void {
    if (confirm(`คุณต้องการลบตำแหน่ง "${position.name}" ใช่หรือไม่?`)) {
      this.positionService.delete(position.id).subscribe({
        next: () => {
          this.toastService.success('ลบตำแหน่งสำเร็จ');
          this.loadPositions(true); // Force refresh
        },
        error: (error) => {
          console.error('Error deleting position:', error);
          this.toastService.error('เกิดข้อผิดพลาดในการลบตำแหน่ง');
        }
      });
    }
  }

  onPositionDialogClose(): void {
    this.isPositionDialogOpen.set(false);
    this.selectedPosition.set(null);
  }

  onPositionDialogSaved(): void {
    // Force refresh to bypass cache
    this.loadPositions(true);
  }

  Math = Math; // Expose Math to template
}
