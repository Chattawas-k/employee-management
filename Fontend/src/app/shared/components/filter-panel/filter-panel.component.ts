import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface FilterOption {
  value: string | number;
  label: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  options: FilterOption[];
  value: string | number;
  disabled?: boolean;
}

@Component({
  selector: 'app-filter-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './filter-panel.component.html',
  styleUrls: ['./filter-panel.component.scss']
})
export class FilterPanelComponent {
  @Input() filters: FilterConfig[] = [];
  @Output() filterChange = new EventEmitter<{ key: string; value: string | number }>();
  @Output() clearFilters = new EventEmitter<void>();

  onFilterChange(key: string, value: string | number): void {
    this.filterChange.emit({ key, value });
  }

  onClear(): void {
    this.clearFilters.emit();
  }

  hasActiveFilters(): boolean {
    return this.filters.some(filter => {
      const defaultValue = filter.options[0]?.value;
      return filter.value !== defaultValue && filter.value !== 'All' && filter.value !== '';
    });
  }
}

