import { ChangeDetectionStrategy, Component, EventEmitter, HostListener, Input, Output, signal } from '@angular/core';
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

  // Action menu is rendered as fixed overlay to avoid table/overflow clipping
  actionMenu = signal<{ row: any; left: number; top: number } | null>(null);

  @HostListener('document:click')
  onDocumentClick(): void {
    if (this.actionMenu()) {
      this.actionMenu.set(null);
    }
  }

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

  toggleActionMenu(row: any, event: MouseEvent): void {
    const current = this.actionMenu();
    if (current?.row?.id && row?.id && current.row.id === row.id) {
      this.actionMenu.set(null);
      return;
    }

    const target = event.currentTarget as HTMLElement | null;
    if (!target) {
      this.actionMenu.set({ row, left: 8, top: 8 });
      return;
    }

    const rect = target.getBoundingClientRect();
    const MENU_WIDTH = 224; // w-56
    const MENU_HEIGHT = 180; // approx for 3 items
    const GAP = 8;

    let left = rect.right - MENU_WIDTH;
    left = Math.max(GAP, Math.min(left, window.innerWidth - MENU_WIDTH - GAP));

    const openDownTop = rect.bottom + GAP;
    const openUpTop = rect.top - GAP - MENU_HEIGHT;
    const top = (openDownTop + MENU_HEIGHT <= window.innerHeight) ? openDownTop : Math.max(GAP, openUpTop);

    this.actionMenu.set({ row, left, top });
  }

  closeActionMenu(): void {
    this.actionMenu.set(null);
  }
}
