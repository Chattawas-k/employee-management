import { Component, Input, Output, EventEmitter, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

export interface TableColumn<T = any> {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  template?: TemplateRef<any>;
}

export interface TablePagination {
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export type SortDirection = 'asc' | 'desc' | null;

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss']
})
export class TableComponent<T = any> {
  @Input() columns: TableColumn<T>[] = [];
  @Input() data: T[] = [];
  @Input() pagination: TablePagination | null = null;
  @Input() loading = false;
  @Input() emptyMessage = 'ไม่พบข้อมูล';
  @Input() trackByFn?: (index: number, item: T) => any;
  @Input() currentSortKey: string | null = null;
  @Input() currentSortDirection: SortDirection = null;
  
  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();
  @Output() sortChange = new EventEmitter<{ key: string; direction: SortDirection }>();

  onSort(column: TableColumn<T>): void {
    if (!column.sortable) return;

    const currentKey = this.currentSortKey;
    const currentDirection = this.currentSortDirection;
    
    let newDirection: SortDirection;
    
    if (currentKey === column.key) {
      // Toggle: asc -> desc -> null
      if (currentDirection === 'asc') {
        newDirection = 'desc';
      } else if (currentDirection === 'desc') {
        newDirection = null;
      } else {
        newDirection = 'asc';
      }
    } else {
      newDirection = 'asc';
    }

    this.sortChange.emit({ 
      key: newDirection ? column.key : '', 
      direction: newDirection 
    });
  }

  onPageChange(page: number): void {
    if (page < 1 || (this.pagination && page > this.pagination.totalPages)) {
      return;
    }
    this.pageChange.emit(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onPageSizeChange(size: number): void {
    this.pageSizeChange.emit(size);
  }

  getPageNumbers(): number[] {
    if (!this.pagination) return [];
    
    const totalPages = this.pagination.totalPages;
    const current = this.pagination.pageNumber;
    const pages: number[] = [];
    
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      if (current > 3) {
        pages.push(-1); // Ellipsis
      }
      
      const start = Math.max(2, current - 1);
      const end = Math.min(totalPages - 1, current + 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (current < totalPages - 2) {
        pages.push(-1); // Ellipsis
      }
      
      pages.push(totalPages);
    }
    
    return pages;
  }

  getSortIcon(column: TableColumn<T>): string | null {
    if (!column.sortable || this.currentSortKey !== column.key) {
      return null;
    }
    return this.currentSortDirection === 'asc' ? 'chevron-up' : 'chevron-down';
  }

  getValue(item: T, key: string): any {
    const keys = key.split('.');
    let value: any = item;
    for (const k of keys) {
      value = value?.[k];
    }
    return value ?? '-';
  }

  Math = Math;
}

