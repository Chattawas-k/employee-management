import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: any) => string;
}

export interface SortConfig {
  column: string;
  direction: 'asc' | 'desc';
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DataTableComponent {
  @Input() columns: TableColumn[] = [];
  @Input() data: any[] = [];
  @Input() isLoading: boolean = false;
  @Input() sortConfig: SortConfig | null = null;
  @Input() rowClickable: boolean = true;
  @Output() sortChange = new EventEmitter<SortConfig>();
  @Output() rowClick = new EventEmitter<any>();
  @Output() actionClick = new EventEmitter<{ action: string; row: any }>();

  onSort(column: TableColumn): void {
    if (!column.sortable) return;

    const currentSort = this.sortConfig;
    let newDirection: 'asc' | 'desc' = 'asc';

    if (currentSort && currentSort.column === column.key) {
      newDirection = currentSort.direction === 'asc' ? 'desc' : 'asc';
    }

    this.sortChange.emit({ column: column.key, direction: newDirection });
  }

  onRowClick(row: any): void {
    if (this.rowClickable) {
      this.rowClick.emit(row);
    }
  }

  getSortIcon(column: TableColumn): string {
    if (!column.sortable || !this.sortConfig || this.sortConfig.column !== column.key) {
      return 'sort';
    }
    return this.sortConfig.direction === 'asc' ? 'sort-up' : 'sort-down';
  }

  renderCell(column: TableColumn, row: any): string {
    if (column.key === 'status' && row.statusBadge) {
      return row.statusBadge;
    }
    if (column.key === 'isActive' && row.statusBadge) {
      return row.statusBadge;
    }
    if (column.key === 'priority' && row.priorityBadge) {
      return row.priorityBadge;
    }
    if (column.key === 'createdDate' && row.createdDateFormatted) {
      return row.createdDateFormatted;
    }
    if (column.key === 'description' && row.descriptionDisplay) {
      return row.descriptionDisplay;
    }
    if (column.key === 'waitTime' && row.waitTime) {
      return row.waitTime;
    }
    if (column.render) {
      return column.render(row[column.key], row);
    }
    return row[column.key]?.toString() || '';
  }

  handleAction(action: string, row: any): void {
    this.actionClick.emit({ action, row });
  }
}
