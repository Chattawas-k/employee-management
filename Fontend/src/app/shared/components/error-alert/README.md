# Error Alert Component

Component สำหรับแสดงข้อความ Error, Warning, Info, หรือ Success

## Usage

### Import Component
```typescript
import { ErrorAlertComponent } from '../../shared/components/error-alert/error-alert.component';

@Component({
  imports: [ErrorAlertComponent]
})
```

### Error Message
```html
<app-error-alert 
  [message]="error()" 
  variant="error"
  [dismissible]="true"
  (onDismiss)="error.set(null)">
</app-error-alert>
```

### Warning Message
```html
<app-error-alert 
  [message]="warningMessage" 
  variant="warning">
</app-error-alert>
```

### Success Message
```html
<app-error-alert 
  message="บันทึกข้อมูลสำเร็จ" 
  variant="success"
  [dismissible]="false">
</app-error-alert>
```

### Info Message
```html
<app-error-alert 
  message="ข้อมูลของคุณจะถูกบันทึกอัตโนมัติ" 
  variant="info">
</app-error-alert>
```

## Props

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `message` | `string \| null` | `null` | ข้อความที่จะแสดง (ถ้าเป็น null จะไม่แสดง) |
| `variant` | `'error' \| 'warning' \| 'info' \| 'success'` | `'error'` | ประเภทของ alert |
| `dismissible` | `boolean` | `true` | แสดงปุ่มปิด (X) หรือไม่ |

## Events

| Event | Type | Description |
|-------|------|-------------|
| `onDismiss` | `EventEmitter<void>` | Emit เมื่อกดปุ่มปิด |

## Variants

### `error` (สีแดง)
- ใช้สำหรับแสดง error messages
- Icon: `alert-circle`

### `warning` (สีเหลือง/เทา)
- ใช้สำหรับแสดงคำเตือน
- Icon: `alert-triangle`

### `info` (สีฟ้า)
- ใช้สำหรับแสดงข้อมูล/ข่าวสาร
- Icon: `info`

### `success` (สีเขียว)
- ใช้สำหรับแสดงความสำเร็จ
- Icon: `check-circle`

## Auto-hide Behavior

Component จะแสดงเฉพาะเมื่อ `message` ไม่เป็น `null` หรือ empty string เท่านั้น ทำให้สามารถควบคุมการแสดง/ซ่อนได้ง่าย:

```typescript
// In component
error = signal<string | null>(null);

// แสดง error
error.set('เกิดข้อผิดพลาด');

// ซ่อน error
error.set(null);
```

