import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { ToastService } from './toast.service';

export interface JobNotification {
  id: string;
  jobId: string;
  jobTitle: string;
  customer: string;
  message: string;
  type: 'job_assigned' | 'job_updated' | 'job_completed';
  timestamp: Date;
  read: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private hubConnection: signalR.HubConnection | null = null;
  private notificationsSubject = new BehaviorSubject<JobNotification[]>([]);
  private connectionStateSubject = new BehaviorSubject<'connected' | 'disconnected' | 'connecting'>('disconnected');
  
  public notifications$ = this.notificationsSubject.asObservable();
  public connectionState$ = this.connectionStateSubject.asObservable();
  
  // Badge count for unread notifications
  public unreadCount$ = new BehaviorSubject<number>(0);

  constructor(
    private authService: AuthService,
    private toastService: ToastService
  ) {}

  /**
   * เริ่มเชื่อมต่อกับ SignalR Hub
   */
  public startConnection(): void {
    const token = this.authService.getToken();
    if (!token) {
      console.warn('⚠️ No auth token found, cannot connect to SignalR hub');
      return;
    }

    const employeeId = this.authService.getCurrentEmployeeId();
    if (!employeeId) {
      console.warn('⚠️ No employee ID found, cannot connect to SignalR hub');
      return;
    }

    // ถ้า connection เปิดอยู่แล้ว ไม่ต้องเปิดใหม่
    if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
      return;
    }

    this.connectionStateSubject.next('connecting');

    // สร้าง connection
    // SignalR Hub อยู่ที่ root level ไม่ได้อยู่ภายใต้ /api/v1
    const baseUrl = environment.apiUrl.replace('/api/v1', '');
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${baseUrl}/hubs/notification`, {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000]) // Retry delays
      .configureLogging(signalR.LogLevel.Information)
      .build();

    // Register event handlers
    this.registerHandlers();

    // เริ่มเชื่อมต่อ
    this.hubConnection
      .start()
      .then(() => {
        this.connectionStateSubject.next('connected');
        // Join room สำหรับ employee นี้
        this.joinEmployeeRoom(employeeId);
      })
      .catch((err: Error) => {
        console.error('Error connecting to SignalR hub:', err);
        this.connectionStateSubject.next('disconnected');
      });

    // Handle reconnecting
    this.hubConnection.onreconnecting((error?: Error) => {
      this.connectionStateSubject.next('connecting');
    });

    // Handle reconnected
    this.hubConnection.onreconnected((connectionId?: string) => {
      this.connectionStateSubject.next('connected');
      // Re-join room after reconnect
      this.joinEmployeeRoom(employeeId);
    });

    // Handle closed
    this.hubConnection.onclose((error?: Error) => {
      this.connectionStateSubject.next('disconnected');
    });
  }

  /**
   * ปิดการเชื่อมต่อ SignalR
   */
  public stopConnection(): void {
    if (this.hubConnection) {
      this.hubConnection
        .stop()
        .then(() => {
          this.connectionStateSubject.next('disconnected');
        })
        .catch((err: Error) => console.error('Error stopping SignalR connection:', err));
    }
  }

  /**
   * เข้าร่วม room สำหรับ employee
   */
  private joinEmployeeRoom(employeeId: string): void {
    if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
      this.hubConnection
        .invoke('JoinEmployeeRoom', employeeId)
        .catch((err: Error) => console.error('Error joining employee room:', err));
    }
  }

  /**
   * ลงทะเบียน event handlers สำหรับรับ notifications
   */
  private registerHandlers(): void {
    if (!this.hubConnection) return;

    // รับ notification เมื่อมีงานใหม่ถูก assign
    this.hubConnection.on('ReceiveJobAssigned', (jobId: string, jobTitle: string, customer: string) => {
      const notification: JobNotification = {
        id: this.generateId(),
        jobId,
        jobTitle,
        customer,
        message: `งานใหม่: "${jobTitle}" จากลูกค้า "${customer}"`,
        type: 'job_assigned',
        timestamp: new Date(),
        read: false
      };

      this.addNotification(notification);
    });

    // รับ notification เมื่องานถูก update
    this.hubConnection.on('ReceiveJobUpdated', (jobId: string, jobTitle: string, status: string) => {
      const notification: JobNotification = {
        id: this.generateId(),
        jobId,
        jobTitle,
        customer: '',
        message: `งาน "${jobTitle}" ถูกอัพเดทเป็น ${status}`,
        type: 'job_updated',
        timestamp: new Date(),
        read: false
      };

      this.addNotification(notification);
    });

    // รับ notification ทั่วไป
    this.hubConnection.on('ReceiveNotification', (message: string) => {
      const notification: JobNotification = {
        id: this.generateId(),
        jobId: '',
        jobTitle: '',
        customer: '',
        message,
        type: 'job_assigned',
        timestamp: new Date(),
        read: false
      };

      this.addNotification(notification);
    });
  }

  /**
   * เพิ่ม notification ใหม่เข้า list
   */
  private addNotification(notification: JobNotification): void {
    const currentNotifications = this.notificationsSubject.value;
    const updatedNotifications = [notification, ...currentNotifications];
    
    // จำกัดจำนวน notifications ไว้ 50 รายการล่าสุด
    if (updatedNotifications.length > 50) {
      updatedNotifications.splice(50);
    }

    this.notificationsSubject.next(updatedNotifications);
    this.updateUnreadCount();

    // แสดง toast notification แทน browser notification
    this.showToastNotification(notification);
  }

  /**
   * แสดง toast notification
   */
  private showToastNotification(notification: JobNotification): void {
    switch (notification.type) {
      case 'job_assigned':
        this.toastService.jobAssigned(notification.jobTitle, notification.customer);
        break;
      case 'job_updated':
        this.toastService.jobUpdated(notification.jobTitle, notification.message);
        break;
      case 'job_completed':
        this.toastService.success(notification.message, '✅ งานเสร็จสิ้น');
        break;
      default:
        this.toastService.info(notification.message);
        break;
    }
  }

  /**
   * อัพเดท unread count
   */
  private updateUnreadCount(): void {
    const unreadCount = this.notificationsSubject.value.filter(n => !n.read).length;
    this.unreadCount$.next(unreadCount);
  }

  /**
   * ทำเครื่องหมายว่าอ่านแล้ว
   */
  public markAsRead(notificationId: string): void {
    const notifications = this.notificationsSubject.value.map(n =>
      n.id === notificationId ? { ...n, read: true } : n
    );
    this.notificationsSubject.next(notifications);
    this.updateUnreadCount();
  }

  /**
   * ทำเครื่องหมายทั้งหมดว่าอ่านแล้ว
   */
  public markAllAsRead(): void {
    const notifications = this.notificationsSubject.value.map(n => ({ ...n, read: true }));
    this.notificationsSubject.next(notifications);
    this.updateUnreadCount();
  }

  /**
   * ลบ notification
   */
  public deleteNotification(notificationId: string): void {
    const notifications = this.notificationsSubject.value.filter(n => n.id !== notificationId);
    this.notificationsSubject.next(notifications);
    this.updateUnreadCount();
  }

  /**
   * ล้าง notifications ทั้งหมด
   */
  public clearAllNotifications(): void {
    this.notificationsSubject.next([]);
    this.unreadCount$.next(0);
  }


  /**
   * สร้าง unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * ดึง notification ทั้งหมด
   */
  public getNotifications(): JobNotification[] {
    return this.notificationsSubject.value;
  }

  /**
   * ดึง unread notifications
   */
  public getUnreadNotifications(): JobNotification[] {
    return this.notificationsSubject.value.filter(n => !n.read);
  }
}

