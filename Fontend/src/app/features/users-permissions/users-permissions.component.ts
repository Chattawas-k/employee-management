import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StaffService } from '../../services/staff.service';
import { ToastService } from '../../services/toast.service';
import { StaffListItem } from '../../models/staff.model';
import { StaffDialogComponent } from '../../shared/components/staff-dialog/staff-dialog.component';
import { getDeterministicAvatarColors, getInitials } from '../../shared/utils/avatar.util';

@Component({
  selector: 'app-users-permissions',
  standalone: true,
  imports: [CommonModule, StaffDialogComponent],
  templateUrl: './users-permissions.component.html',
  styleUrls: ['./users-permissions.component.scss']
})
export class UsersPermissionsComponent implements OnInit {
  staff = signal<StaffListItem[]>([]);
  isLoading = signal(false);

  selectedStaff = signal<StaffListItem | null>(null);
  isDialogOpen = signal(false);

  private imageFailed = new Set<string>();

  constructor(
    private staffService: StaffService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadStaff();
  }

  loadStaff(): void {
    this.isLoading.set(true);
    this.staffService.getStaffList().subscribe({
      next: (res) => {
        this.staff.set(res.staff || []);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading staff list:', error);
        this.toastService.error('เกิดข้อผิดพลาดในการโหลดข้อมูลพนักงาน');
        this.isLoading.set(false);
      }
    });
  }

  onAddStaff(): void {
    this.selectedStaff.set(null);
    this.isDialogOpen.set(true);
  }

  onEditStaff(item: StaffListItem): void {
    this.selectedStaff.set(item);
    this.isDialogOpen.set(true);
  }

  onDialogClose(): void {
    this.isDialogOpen.set(false);
    this.selectedStaff.set(null);
  }

  onDialogSaved(): void {
    this.loadStaff();
  }

  toggleAccountStatus(item: StaffListItem): void {
    const shouldEnable = item.accountStatus === 'disabled';
    this.staffService.setStaffStatus(item.staffId, { isActive: shouldEnable }).subscribe({
      next: () => {
        this.toastService.success(shouldEnable ? 'เปิดใช้งานบัญชีแล้ว' : 'ปิดใช้งานบัญชีแล้ว');
        this.loadStaff();
      },
      error: (error) => {
        console.error('Error toggling staff status:', error);
        this.toastService.error('เกิดข้อผิดพลาดในการเปลี่ยนสถานะบัญชี');
      }
    });
  }

  getAccountStatusLabel(status: StaffListItem['accountStatus']): string {
    return status === 'active' ? 'Active' : 'Disabled';
  }

  getAccountStatusClass(status: StaffListItem['accountStatus']): string {
    return status === 'active'
      ? 'bg-green-100 text-green-700'
      : 'bg-gray-100 text-gray-700';
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
}

