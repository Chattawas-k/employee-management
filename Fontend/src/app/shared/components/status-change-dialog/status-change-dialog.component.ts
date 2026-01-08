import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-status-change-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './status-change-dialog.component.html',
  styleUrls: ['./status-change-dialog.component.scss']
})
export class StatusChangeDialogComponent {
  @Input() currentStatus!: string;
  @Input() newStatus!: string;
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  getStatusLabel(status: string): string {
    const statusMap: { [key: string]: string } = {
      'available': 'พร้อมรับงาน',
      'busy': 'ติดลูกค้า',
      'break': 'พัก',
      'unavailable': 'ไม่พร้อมรับงาน',
      'notworking': 'ไม่ได้ทำงาน'
    };
    return statusMap[status] || status;
  }

  getStatusIconClasses(): string {
    const status = this.newStatus;
    const bgColorMap: { [key: string]: string } = {
      'available': 'bg-green-100',
      'busy': 'bg-orange-100',
      'break': 'bg-yellow-100',
      'unavailable': 'bg-gray-100',
      'notworking': 'bg-red-100'
    };
    const textColorMap: { [key: string]: string } = {
      'available': 'text-green-600',
      'busy': 'text-orange-600',
      'break': 'text-yellow-600',
      'unavailable': 'text-gray-600',
      'notworking': 'text-red-600'
    };
    
    const bgColor = bgColorMap[status] || 'bg-blue-100';
    const textColor = textColorMap[status] || 'text-blue-600';
    
    return `${bgColor} ${textColor}`;
  }

  getIconBgClass(): string {
    const status = this.newStatus;
    const bgColorMap: { [key: string]: string } = {
      'available': 'bg-green-100',
      'busy': 'bg-orange-100',
      'break': 'bg-yellow-100',
      'unavailable': 'bg-gray-100',
      'notworking': 'bg-red-100'
    };
    return bgColorMap[status] || 'bg-blue-100';
  }

  getIconTextClass(): string {
    const status = this.newStatus;
    const textColorMap: { [key: string]: string } = {
      'available': 'text-green-600',
      'busy': 'text-orange-600',
      'break': 'text-yellow-600',
      'unavailable': 'text-gray-600',
      'notworking': 'text-red-600'
    };
    return textColorMap[status] || 'text-blue-600';
  }
}

