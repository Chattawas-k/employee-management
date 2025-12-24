# Shared Components

โฟลเดอร์นี้เก็บ Reusable Components ที่ใช้ร่วมกันทั่วทั้งโปรเจค

## Components List

### 🔄 State Components
- **LoadingOverlayComponent** - แสดงสถานะ loading (inline หรือ fullscreen)
- **ErrorAlertComponent** - แสดงข้อความ error, warning, info, success

### 🎨 UI Components
- **ModalComponent** - Modal dialog พื้นฐาน
- **ConfirmModalComponent** - Modal สำหรับยืนยันการทำงาน
- **ButtonComponent** - ปุ่มแบบ custom
- **BadgeComponent** - แสดง badge/tag
- **IconComponent** - แสดง icon จาก lucide-angular
- **CardComponent** - Card container

### 📝 Form Components
- **InputComponent** - Input field แบบ custom
- **SearchBarComponent** - Search bar พร้อม icon
- **FilterPanelComponent** - Panel สำหรับ filter

### 📊 Data Display Components  
- **TableComponent** - Table แบบ responsive
- **AvatarComponent** - แสดง avatar รูปภาพ
- **ActionButtonComponent** - ปุ่ม action พร้อม icon

## Quick Import

```typescript
import {
  LoadingOverlayComponent,
  ErrorAlertComponent,
  ModalComponent,
  ButtonComponent
} from '@shared/components';
```

## Usage Examples

### Loading + Error Pattern

```typescript
import { Component, signal } from '@angular/core';
import { LoadingOverlayComponent, ErrorAlertComponent } from '@shared/components';

@Component({
  imports: [LoadingOverlayComponent, ErrorAlertComponent]
})
export class MyComponent {
  loading = signal(false);
  error = signal<string | null>(null);

  async loadData() {
    this.loading.set(true);
    this.error.set(null);
    
    try {
      const data = await fetchData();
    } catch (err) {
      this.error.set('เกิดข้อผิดพลาด');
    } finally {
      this.loading.set(false);
    }
  }
}
```

```html
<app-error-alert 
  [message]="error()" 
  (onDismiss)="error.set(null)">
</app-error-alert>

<app-loading-overlay [isLoading]="loading()"></app-loading-overlay>

<!-- Your content here -->
```

### Fullscreen Loading for Critical Operations

```typescript
saving = signal(false);

async saveData() {
  this.saving.set(true);
  try {
    await apiCall();
  } finally {
    this.saving.set(false);
  }
}
```

```html
<app-loading-overlay 
  [isLoading]="saving()" 
  message="กำลังบันทึกข้อมูล..."
  variant="fullscreen">
</app-loading-overlay>
```

## Best Practices

1. **ใช้ Signals** สำหรับ state management (loading, error)
2. **Error Dismissible** ให้ user สามารถปิด error message ได้
3. **Loading Variants**:
   - `inline` - สำหรับการโหลดข้อมูลในหน้า
   - `fullscreen` - สำหรับ blocking operations (save, delete)
4. **Consistent Messaging** - ใช้ข้อความที่สื่อสารชัดเจนกับ user

## Component Documentation

ดูรายละเอียดเพิ่มเติมของแต่ละ component ได้ที่:
- [Loading Overlay](./loading-overlay/README.md)
- [Error Alert](./error-alert/README.md)

