import { Component, Input, Output, EventEmitter, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface FilterBarConfig {
  showDateRange?: boolean;
  showQuickFilters?: boolean;
  showStatusFilter?: boolean;
  showChannelFilter?: boolean;
  showCategoryFilter?: boolean;
  showStaffFilter?: boolean;
  showSearch?: boolean;
  quickFilterOptions?: string[];
}

@Component({
  selector: 'app-filter-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './filter-bar.component.html',
  styleUrls: ['./filter-bar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FilterBarComponent {
  @Input() config: FilterBarConfig = {
    showDateRange: true,
    showQuickFilters: true,
    showStatusFilter: false,
    showChannelFilter: false,
    showCategoryFilter: false,
    showStaffFilter: false,
    showSearch: false,
    quickFilterOptions: ['today', 'yesterday', 'last7days', 'last30days', 'thismonth']
  };

  @Input() statusOptions: string[] = [];
  @Input() channelOptions: string[] = [];
  @Input() categoryOptions: string[] = [];
  @Input() staffOptions: Array<{ id: string; name: string }> = [];

  @Output() filterChange = new EventEmitter<any>();
  @Output() quickFilterSelect = new EventEmitter<string>();

  dateFrom = signal<Date | null>(null);
  dateTo = signal<Date | null>(null);
  selectedQuickFilter = signal<string>('today');
  selectedStatus = signal<string>('');
  selectedChannel = signal<string>('');
  selectedCategory = signal<string>('');
  selectedStaff = signal<string>('');
  searchTerm = signal<string>('');

  onQuickFilterSelect(filter: string): void {
    this.selectedQuickFilter.set(filter);
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

    this.emitFilterChange();
    this.quickFilterSelect.emit(filter);
  }

  onDateFromChange(value: string): void {
    this.dateFrom.set(value ? new Date(value) : null);
    this.selectedQuickFilter.set('');
    this.emitFilterChange();
  }

  onDateToChange(value: string): void {
    this.dateTo.set(value ? new Date(value) : null);
    this.selectedQuickFilter.set('');
    this.emitFilterChange();
  }

  onDateChange(): void {
    this.selectedQuickFilter.set('');
    this.emitFilterChange();
  }

  onFilterChange(): void {
    this.emitFilterChange();
  }

  onSearchChange(): void {
    this.emitFilterChange();
  }

  clearFilters(): void {
    this.dateFrom.set(null);
    this.dateTo.set(null);
    this.selectedQuickFilter.set('today');
    this.selectedStatus.set('');
    this.selectedChannel.set('');
    this.selectedCategory.set('');
    this.selectedStaff.set('');
    this.searchTerm.set('');
    this.emitFilterChange();
  }

  private emitFilterChange(): void {
    this.filterChange.emit({
      dateFrom: this.dateFrom(),
      dateTo: this.dateTo(),
      status: this.selectedStatus() || undefined,
      channel: this.selectedChannel() || undefined,
      category: this.selectedCategory() || undefined,
      staffId: this.selectedStaff() || undefined,
      search: this.searchTerm() || undefined
    });
  }
}
