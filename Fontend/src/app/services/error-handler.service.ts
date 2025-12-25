import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastService } from './toast.service';
import { LoggerService } from './logger.service';

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {
  constructor(
    private toastService: ToastService,
    private logger: LoggerService
  ) {}

  handleError(error: HttpErrorResponse | Error, context?: string): void {
    this.logger.error(`Error${context ? ` in ${context}` : ''}:`, error);

    if (error instanceof HttpErrorResponse) {
      this.handleHttpError(error);
    } else {
      this.handleGenericError(error);
    }
  }

  private handleHttpError(error: HttpErrorResponse): void {
    const errorMessage = this.getHttpErrorMessage(error);
    this.toastService.error(errorMessage.title, errorMessage.message);
  }

  private handleGenericError(error: Error): void {
    this.toastService.error('เกิดข้อผิดพลาด', error.message || 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ');
  }

  private getHttpErrorMessage(error: HttpErrorResponse): { title: string; message: string } {
    switch (error.status) {
      case 400:
        return {
          title: 'ข้อมูลไม่ถูกต้อง',
          message: this.extractErrorMessage(error) || 'กรุณาตรวจสอบข้อมูลที่กรอก'
        };
      case 401:
        return {
          title: 'ไม่ได้รับอนุญาต',
          message: 'กรุณาเข้าสู่ระบบอีกครั้ง'
        };
      case 403:
        return {
          title: 'ไม่มีสิทธิ์เข้าถึง',
          message: 'คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้'
        };
      case 404:
        return {
          title: 'ไม่พบข้อมูล',
          message: 'ไม่พบข้อมูลที่ต้องการ'
        };
      case 409:
        return {
          title: 'ข้อมูลซ้ำ',
          message: this.extractErrorMessage(error) || 'ข้อมูลนี้มีอยู่ในระบบแล้ว'
        };
      case 422:
        return {
          title: 'ข้อมูลไม่ถูกต้อง',
          message: this.extractErrorMessage(error) || 'กรุณาตรวจสอบข้อมูลที่กรอก'
        };
      case 500:
        return {
          title: 'ข้อผิดพลาดของเซิร์ฟเวอร์',
          message: 'เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้งภายหลัง'
        };
      case 503:
        return {
          title: 'บริการไม่พร้อมใช้งาน',
          message: 'ระบบกำลังอยู่ในระหว่างการบำรุงรักษา กรุณาลองใหม่อีกครั้งภายหลัง'
        };
      default:
        if (error.status >= 500) {
          return {
            title: 'ข้อผิดพลาดของเซิร์ฟเวอร์',
            message: 'เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้งภายหลัง'
          };
        } else if (error.status >= 400) {
          return {
            title: 'เกิดข้อผิดพลาด',
            message: this.extractErrorMessage(error) || 'กรุณาลองใหม่อีกครั้ง'
          };
        } else {
          return {
            title: 'เกิดข้อผิดพลาด',
            message: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต'
          };
        }
    }
  }

  private extractErrorMessage(error: HttpErrorResponse): string | null {
    if (error.error) {
      if (typeof error.error === 'string') {
        return error.error;
      }
      if (error.error.message) {
        return error.error.message;
      }
      if (error.error.error) {
        return error.error.error;
      }
    }
    return null;
  }

  getErrorMessage(error: HttpErrorResponse | Error): string {
    if (error instanceof HttpErrorResponse) {
      const errorMsg = this.getHttpErrorMessage(error);
      return errorMsg.message;
    }
    return error.message || 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';
  }
}

