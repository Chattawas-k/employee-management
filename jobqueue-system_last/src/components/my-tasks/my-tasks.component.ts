import { ChangeDetectionStrategy, Component, signal, output, computed, input } from '@angular/core';
import { TaskColumnComponent, Task } from '../task-column/task-column.component';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';
import { SalesReportDialogComponent } from '../sales-report-dialog/sales-report-dialog.component';
import { TaskDetailDialogComponent } from '../task-detail-dialog/task-detail-dialog.component';
import { OpenJobDialogComponent } from '../open-job-dialog/open-job-dialog.component';
import { RejectTaskDialogComponent } from '../reject-task-dialog/reject-task-dialog.component';

export type AvailabilityStatus = 'available' | 'busy' | 'break' | 'unavailable';

@Component({
  selector: 'app-my-tasks',
  standalone: true,
  templateUrl: './my-tasks.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TaskColumnComponent, ConfirmationDialogComponent, SalesReportDialogComponent, TaskDetailDialogComponent, OpenJobDialogComponent, RejectTaskDialogComponent]
})
export class MyTasksComponent {
  menuClick = output<void>();
  statusChangeRequest = output<AvailabilityStatus>();
  availabilityStatus = input.required<AvailabilityStatus>();
  statusBannerInfo = input<{ title: string; subtitle: string; } | null>(null);
  
  isMyTurn = signal(true);
  currentUser = signal('สมศักดิ์ รักงาน (Bob)');
  
  queuesRemaining = signal(1);
  myQueuePosition = signal(2);
  currentlyServing = signal({
    name: 'สมศักดิ์ รักงาน (Bob)',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop',
    queuePosition: 1
  });

  showStartDialog = signal(false);
  showRejectDialog = signal(false);
  showSalesReportDialog = signal(false);
  showTaskDetailDialog = signal(false);
  showOpenJobDialog = signal(false);
  selectedTask = signal<Task | null>(null);

  todoTasks = signal<Task[]>([
    {
      id: '#105',
      createdAt: '13 ธ.ค. 2568 (12.06 น.)',
      priority: 'ทั่วไป',
      priorityClass: 'border-blue-300 bg-blue-100 text-blue-800',
      buttonText: 'เริ่มงาน',
      buttonIcon: 'refresh',
      buttonClass: 'bg-indigo-600 hover:bg-indigo-700 text-white',
      startedAt: null,
      completedAt: null,
      jobTitle: 'Walk-in Customer',
      customerName: 'ลูกค้า #105',
      details: 'สอบถามรายละเอียดสินค้าโปรโมชั่น',
      status: 'pending'
    },
    {
      id: '#104',
      createdAt: '13 ธ.ค. 2568 (12.06 น.)',
      priority: 'ทั่วไป',
      priorityClass: 'border-blue-300 bg-blue-100 text-blue-800',
      buttonText: 'เริ่มงาน',
      buttonIcon: 'refresh',
      buttonClass: 'bg-indigo-600 hover:bg-indigo-700 text-white',
      startedAt: null,
      completedAt: null,
      jobTitle: 'Walk-in Customer',
      customerName: 'ลูกค้า #104',
      details: 'ต้องการดูตัวอย่างผ้าม่าน',
      status: 'pending'
    },
    {
      id: '#103',
      createdAt: '9 ธ.ค. 2568 (13.11 น.)',
      priority: 'ทั่วไป',
      priorityClass: 'border-blue-300 bg-blue-100 text-blue-800',
      buttonText: 'เริ่มงาน',
      buttonIcon: 'refresh',
      buttonClass: 'bg-indigo-600 hover:bg-indigo-700 text-white',
      startedAt: null,
      completedAt: null,
      jobTitle: 'Walk-in Customer',
      customerName: 'ลูกค้า #103',
      details: 'สนใจชุดครัวบิ้วท์อิน',
      status: 'pending'
    }
  ]);

  inProgressTasks = signal<Task[]>([]);

  completedTasks = signal<Task[]>([
     {
      id: '#101',
      createdAt: '15 ธ.ค. 2568 (16.30 น.)',
      priority: 'ด่วน',
      priorityClass: 'border-orange-300 bg-orange-100 text-orange-800',
      buttonText: 'เสร็จสิ้น',
      buttonIcon: 'check',
      buttonClass: 'bg-gray-200 text-gray-500 cursor-not-allowed',
      startedAt: '15 ธ.ค. 2568 (16.32 น.)',
      completedAt: '15 ธ.ค. 2568 (16.34 น.)',
      jobTitle: 'Walk-in Customer',
      customerName: 'คุณสมหญิง',
      details: 'รับสินค้าที่สั่งจองไว้',
      status: 'completed',
      salesReportData: { status: 'Success' }
    },
    {
      id: '#102',
      createdAt: '24 ต.ค. 2566 (11.00 น.)',
      priority: 'ทั่วไป',
      priorityClass: 'border-gray-300 bg-gray-200 text-gray-500',
      buttonText: 'เสร็จสิ้น',
      buttonIcon: 'check',
      buttonClass: 'bg-gray-200 text-gray-500 cursor-not-allowed',
      startedAt: '24 ต.ค. 2566 (11.05 น.)',
      completedAt: '24 ต.ค. 2566 (11.45 น.)',
      jobTitle: 'Walk-in Customer',
      customerName: 'คุณวิชัย',
      details: 'ซื้อชุดห้องนอน',
      status: 'completed',
      salesReportData: { status: 'Failed' }
    }
  ]);

  isAvailable = computed(() => this.availabilityStatus() === 'available');

  private getCurrentFormattedDate(): string {
    const now = new Date();
    const day = now.getDate();
    const month = now.toLocaleString('th-TH', { month: 'short' });
    const year = now.getFullYear() + 543;
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${day} ${month} ${year} (${hours}.${minutes} น.)`;
  }

  acceptCustomer() {
    this.showOpenJobDialog.set(true);
  }
  
  closeOpenJobDialog() {
    this.showOpenJobDialog.set(false);
  }
  
  confirmOpenJob(jobData: any) {
    const totalTasks = this.todoTasks().length + this.inProgressTasks().length + this.completedTasks().length;
    const newTaskId = `#${101 + totalTasks + 2}`;
    
    const isUrgent = jobData.priority === 'Urgent';
    const now = this.getCurrentFormattedDate();

    const newTask: Task = {
      id: newTaskId,
      createdAt: now,
      priority: isUrgent ? 'ด่วน' : 'ทั่วไป',
      priorityClass: isUrgent 
        ? 'border-orange-300 bg-orange-100 text-orange-800' 
        : 'border-blue-300 bg-blue-100 text-blue-800',
      buttonText: 'ปิดงาน',
      buttonIcon: 'check',
      buttonClass: 'bg-emerald-600 hover:bg-emerald-700 text-white',
      startedAt: now,
      completedAt: null,
      jobTitle: jobData.jobTitle,
      customerName: jobData.customerName,
      details: jobData.details,
      status: 'in-progress'
    };

    this.inProgressTasks.update(tasks => [newTask, ...tasks]);
    
    // Update user's state to "waiting in queue"
    this.isMyTurn.set(false);
    
    // Update queue information (mocked data)
    this.currentlyServing.set({
        name: 'เอกชัย มุ่งมั่น (Ethan)',
        avatarUrl: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?q=80&w=200&auto=format&fit=crop',
        queuePosition: 1
    });
    
    this.closeOpenJobDialog();
  }

  handleTaskAction(task: Task) {
    this.selectedTask.set(task);
    if (task.buttonText === 'เริ่มงาน') {
      this.showStartDialog.set(true);
    } else if (task.buttonText === 'ปิดงาน') {
      this.showSalesReportDialog.set(true);
    }
  }

  showTaskDetails(task: Task) {
    this.selectedTask.set(task);
    this.showTaskDetailDialog.set(true);
  }

  closeTaskDetailDialog() {
    this.showTaskDetailDialog.set(false);
    this.selectedTask.set(null);
  }

  handleStartTaskConfirmation() {
    const taskToMove = this.selectedTask();
    if (taskToMove) {
      this.todoTasks.update(tasks => tasks.filter(t => t.id !== taskToMove.id));
      
      const inProgressVersion: Task = {
        ...taskToMove,
        buttonText: 'ปิดงาน',
        buttonIcon: 'check',
        buttonClass: 'bg-emerald-600 hover:bg-emerald-700 text-white',
        startedAt: this.getCurrentFormattedDate(),
        status: 'in-progress'
      };
      this.inProgressTasks.update(tasks => [inProgressVersion, ...tasks]);
    }
    this.closeStartDialog();
  }

  handleRejectTask() {
    this.showStartDialog.set(false);
    this.showRejectDialog.set(true);
  }

  confirmRejectTask(rejectionData: { reason: string }) {
    const taskToReject = this.selectedTask();
    if (taskToReject) {
      this.todoTasks.update(tasks => tasks.filter(t => t.id !== taskToReject.id));
      
      const rejectedTask: Task = {
        ...taskToReject,
        status: 'rejected',
        rejectionReason: rejectionData.reason,
        buttonText: 'ปฏิเสธแล้ว',
        buttonIcon: 'cross',
        buttonClass: 'bg-red-100 text-red-600 cursor-not-allowed border border-red-200',
        completedAt: this.getCurrentFormattedDate()
      };
      
      this.completedTasks.update(tasks => [rejectedTask, ...tasks]);
      console.log(`Task ${taskToReject.id} rejected. Reason: ${rejectionData.reason}`);
    }
    this.closeRejectDialog();
  }

  closeRejectDialog() {
    this.showRejectDialog.set(false);
    this.selectedTask.set(null);
  }

  confirmCompleteTask(reportData: any) {
    const taskToMove = this.selectedTask();
    if (taskToMove) {
      const updatedInProgressTasks = this.inProgressTasks().filter(t => t.id !== taskToMove.id);
      this.inProgressTasks.set(updatedInProgressTasks);

      const completedTask: Task = { 
        ...taskToMove, 
        buttonText: 'เสร็จสิ้น', 
        buttonClass: 'bg-gray-200 text-gray-500 cursor-not-allowed',
        completedAt: this.getCurrentFormattedDate(),
        status: 'completed',
        salesReportData: reportData
      };
      this.completedTasks.update(tasks => [completedTask, ...tasks]);
      console.log('Sales Report Saved:', reportData);

      if (updatedInProgressTasks.length === 0 && this.availabilityStatus() === 'busy') {
        this.statusChangeRequest.emit('available');
      }
    }
    this.closeSalesReportDialog();
  }

  closeStartDialog() {
    this.showStartDialog.set(false);
    this.selectedTask.set(null);
  }

  closeSalesReportDialog() {
    this.showSalesReportDialog.set(false);
    this.selectedTask.set(null);
  }
}