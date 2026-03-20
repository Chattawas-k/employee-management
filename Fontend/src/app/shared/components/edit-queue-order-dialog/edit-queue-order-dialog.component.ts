import { Component, Input, Output, EventEmitter, signal, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QueueDto } from '../../../models/queue.model';
import { AddEmployeeToQueueDialogComponent } from '../add-employee-to-queue-dialog/add-employee-to-queue-dialog.component';
import { ConfirmDialogService } from '../../../services/confirm-dialog.service';
import { EmployeeDropdownDto } from '../../../models/employee.model';

@Component({
  selector: 'app-edit-queue-order-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, AddEmployeeToQueueDialogComponent],
  templateUrl: './edit-queue-order-dialog.component.html',
  styleUrls: ['./edit-queue-order-dialog.component.scss']
})
export class EditQueueOrderDialogComponent implements OnInit, OnChanges {
  @Input() queues: QueueDto[] = [];
  @Input() queueDate: Date = new Date();
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<{ queues: QueueDto[]; deletedQueueIds: string[]; updateMaster: boolean }>();

  reorderedQueues = signal<QueueDto[]>([]);
  draggedIndex = signal<number | null>(null);
  showAddDialog = signal(false);
  deletedQueueIds = signal<string[]>([]);

  constructor(private confirmDialog: ConfirmDialogService) {}

  ngOnInit(): void {
    this.initializeQueues();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['queues']) {
      // Always reinitialize when queues change, including first change
      this.initializeQueues();
    }
  }

  private initializeQueues(): void {
    // Create a copy of queues with updated positions
    const queuesWithPositions = this.queues.map((queue, index) => ({
      ...queue,
      position: index + 1
    }));
    this.reorderedQueues.set(queuesWithPositions);
    // Reset staged deletions whenever we receive new input queues
    this.deletedQueueIds.set([]);
  }

  getEmployeeDisplayName(employeeName: string): { thai: string; english?: string } {
    const match = employeeName.match(/^(.+?)\s*\((.+?)\)$/);
    if (match) {
      return { thai: match[1].trim(), english: match[2].trim() };
    }
    return { thai: employeeName };
  }

  getInitial(employeeName: string): string {
    return employeeName.charAt(0).toUpperCase();
  }

  onDragStart(event: DragEvent, index: number): void {
    this.draggedIndex.set(index);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/html', index.toString());
    }
  }

  onDragOver(event: DragEvent, index: number): void {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
    
    // Add visual feedback
    const target = event.currentTarget as HTMLElement;
    if (target && this.draggedIndex() !== null && this.draggedIndex() !== index) {
      target.classList.add('border-blue-400', 'bg-blue-50');
    }
  }

  onDragLeave(event: DragEvent): void {
    const target = event.currentTarget as HTMLElement;
    if (target) {
      target.classList.remove('border-blue-400', 'bg-blue-50');
    }
  }

  onDrop(event: DragEvent, dropIndex: number): void {
    event.preventDefault();
    const dragIndex = this.draggedIndex();
    
    if (dragIndex === null || dragIndex === dropIndex) {
      this.draggedIndex.set(null);
      return;
    }

    const queues = [...this.reorderedQueues()];
    const draggedItem = queues[dragIndex];
    
    // Remove dragged item
    queues.splice(dragIndex, 1);
    
    // Insert at new position
    queues.splice(dropIndex, 0, draggedItem);
    
    // Update positions
    const updatedQueues = queues.map((queue, index) => ({
      ...queue,
      position: index + 1
    }));
    
    this.reorderedQueues.set(updatedQueues);
    this.draggedIndex.set(null);
  }

  onDragEnd(): void {
    this.draggedIndex.set(null);
  }

  onSaveTodayOnly(): void {
    this.save.emit({ queues: this.reorderedQueues(), deletedQueueIds: this.deletedQueueIds(), updateMaster: false });
  }

  onSaveMaster(): void {
    this.save.emit({ queues: this.reorderedQueues(), deletedQueueIds: this.deletedQueueIds(), updateMaster: true });
  }

  onCancel(): void {
    this.close.emit();
  }

  async onDelete(queueId: string): Promise<void> {
    const ok = await this.confirmDialog.open({
      tone: 'danger',
      iconName: 'trash-2',
      title: 'ลบพนักงานออกจากคิว?',
      message: 'คุณต้องการลบพนักงานออกจากคิวหรือไม่?',
      confirmText: 'ยืนยันและลบ',
      cancelText: 'ยกเลิก',
    });
    if (ok) {
      // Stage deletion locally; actual delete happens on Save (single API call)
      if (!queueId.startsWith('temp-')) {
        this.deletedQueueIds.set([...this.deletedQueueIds(), queueId]);
      }

      // Remove from local list and update positions
      const queues = this.reorderedQueues().filter(q => q.id !== queueId);
      const updatedQueues = queues.map((queue, index) => ({
        ...queue,
        position: index + 1
      }));
      this.reorderedQueues.set(updatedQueues);
    }
  }

  onAddEmployee(): void {
    this.showAddDialog.set(true);
  }

  onAddEmployeeSelected(employees: EmployeeDropdownDto[]): void {
    if (!employees || employees.length === 0) {
      this.showAddDialog.set(false);
      return;
    }

    const existingIds = new Set(this.reorderedQueues().map(q => q.employeeId.toLowerCase()));
    const toAdd = employees.filter(e => !existingIds.has(e.id.toLowerCase()));
    if (toAdd.length === 0) {
      this.showAddDialog.set(false);
      return;
    }

    const current = [...this.reorderedQueues()];
    const maxPosition = current.length > 0 ? Math.max(...current.map(q => q.position)) : 0;
    const queueDateYmd = this.formatBangkokDate(this.queueDate);

    const newQueues: QueueDto[] = toAdd.map((emp, index) => ({
      id: `temp-${emp.id}-${Date.now()}-${index}`,
      employeeId: emp.id,
      employeeName: emp.name,
      positionName: emp.positionName,
      departmentName: emp.departmentName,
      avatar: emp.avatar,
      position: maxPosition + index + 1,
      status: 'Active',
      availabilityStatus: 'available',
      queueDate: queueDateYmd,
    }));

    const updated = [...current, ...newQueues].map((q, i) => ({ ...q, position: i + 1 }));
    this.reorderedQueues.set(updated);
    this.showAddDialog.set(false);
  }

  closeAddDialog(): void {
    this.showAddDialog.set(false);
  }

  private formatBangkokDate(date: Date): string {
    // Always format as YYYY-MM-DD in Asia/Bangkok (avoid toISOString() UTC day shift)
    try {
      const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Bangkok',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).formatToParts(date);

      const get = (type: string) => parts.find(p => p.type === type)?.value ?? '';
      const y = get('year');
      const m = get('month');
      const d = get('day');
      if (y && m && d) return `${y}-${m}-${d}`;
    } catch {
      // Fallback below
    }

    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  onBackdropClick(): void {
    // Only close Edit Dialog if Add Dialog is not open
    if (!this.showAddDialog()) {
      this.close.emit();
    }
  }

  moveUp(index: number): void {
    if (index === 0) return; // Already at top
    
    const queues = [...this.reorderedQueues()];
    const temp = queues[index];
    queues[index] = queues[index - 1];
    queues[index - 1] = temp;
    
    // Update positions
    const updatedQueues = queues.map((queue, i) => ({
      ...queue,
      position: i + 1
    }));
    
    this.reorderedQueues.set(updatedQueues);
  }

  moveDown(index: number): void {
    const queues = [...this.reorderedQueues()];
    if (index === queues.length - 1) return; // Already at bottom
    
    const temp = queues[index];
    queues[index] = queues[index + 1];
    queues[index + 1] = temp;
    
    // Update positions
    const updatedQueues = queues.map((queue, i) => ({
      ...queue,
      position: i + 1
    }));
    
    this.reorderedQueues.set(updatedQueues);
  }

  onPositionChange(index: number, value: string): void {
    const newPosition = parseInt(value, 10);
    const queues = [...this.reorderedQueues()];
    const maxPosition = queues.length;
    
    if (isNaN(newPosition) || newPosition < 1 || newPosition > maxPosition) {
      return; // Invalid position, don't update
    }
    
    // Convert to 0-based index
    const targetIndex = newPosition - 1;
    
    if (targetIndex === index) {
      return; // Already at this position
    }
    
    // Remove item from current position
    const item = queues.splice(index, 1)[0];
    
    // Insert at new position
    queues.splice(targetIndex, 0, item);
    
    // Update positions
    const updatedQueues = queues.map((queue, i) => ({
      ...queue,
      position: i + 1
    }));
    
    this.reorderedQueues.set(updatedQueues);
  }

  canMoveUp(index: number): boolean {
    return index > 0;
  }

  canMoveDown(index: number): boolean {
    return index < this.reorderedQueues().length - 1;
  }
}

