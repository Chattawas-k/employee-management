# Toast Notification Component

Custom Toast notification component แสดงที่มุมขวาบนของหน้าจอ พร้อม animations และ auto-dismiss

## 📦 Components

### 1. `ToastComponent`
Component สำหรับแสดง toast notification แต่ละรายการ

**Props:**
- `toast: Toast` - ข้อมูล toast
- `remove: EventEmitter<string>` - Event เมื่อปิด toast

### 2. `ToastContainerComponent`
Container component สำหรับจัดการและแสดง toasts ทั้งหมด
- ใส่ใน `app.component.html` เพียงครั้งเดียว
- จัดการ positioning และ stacking ของ toasts

## 🎨 Toast Types

| Type | Color | Icon | Use Case |
|------|-------|------|----------|
| `success` | Green | check-circle | การทำงานสำเร็จ |
| `error` | Red | alert-circle | เกิดข้อผิดพลาด |
| `warning` | Amber | alert-triangle | คำเตือน |
| `info` | Blue | info | ข้อมูลทั่วไป |

## 🚀 Usage

### 1. Setup (ทำแล้ว)

Add `ToastContainerComponent` to `app.component.html`:

```html
<app-toast-container></app-toast-container>
```

### 2. Inject `ToastService`

```typescript
import { ToastService } from './services/toast.service';

export class MyComponent {
  constructor(private toastService: ToastService) {}
}
```

### 3. แสดง Toast

#### Success
```typescript
this.toastService.success('บันทึกข้อมูลสำเร็จ');
this.toastService.success('ลบข้อมูลสำเร็จ', 'สำเร็จ!');
```

#### Error
```typescript
this.toastService.error('เกิดข้อผิดพลาด กรุณาลองอีกครั้ง');
this.toastService.error('ไม่สามารถบันทึกข้อมูลได้', 'ผิดพลาด!');
```

#### Warning
```typescript
this.toastService.warning('กรุณาตรวจสอบข้อมูลอีกครั้ง');
this.toastService.warning('ข้อมูลไม่ครบถ้วน', 'คำเตือน');
```

#### Info
```typescript
this.toastService.info('ระบบกำลังประมวลผล...');
this.toastService.info('กรุณารอสักครู่', 'กำลังโหลด');
```

#### Custom Toast
```typescript
this.toastService.show({
  type: 'success',
  title: 'งานสำเร็จ',
  message: 'อัพเดทข้อมูลเรียบร้อยแล้ว',
  duration: 7000, // 7 seconds
  icon: 'check-circle'
});
```

### 4. Job Notifications (สำหรับ SignalR)

```typescript
// แจ้งเตือนงานใหม่
this.toastService.jobAssigned('ติดต่อลูกค้า A', 'บริษัท ABC');
// 📬 งานใหม่! ติดต่อลูกค้า A - ลูกค้า: บริษัท ABC

// แจ้งเตือนอัพเดทงาน
this.toastService.jobUpdated('ติดต่อลูกค้า A', 'In Progress');
// 📝 อัพเดทงาน: ติดต่อลูกค้า A - สถานะ: In Progress
```

### 5. จัดการ Toasts

```typescript
// ลบ toast ตาม id
this.toastService.remove(toastId);

// ลบ toast ทั้งหมด
this.toastService.clear();
```

## ⚙️ Configuration

### Default Duration
- **Success, Warning, Info:** 5,000ms (5 วินาที)
- **Error:** 7,000ms (7 วินาที)

### Custom Duration
```typescript
this.toastService.success('Message', 'Title', 10000); // 10 seconds
```

### Disable Auto-dismiss
```typescript
this.toastService.show({
  type: 'info',
  message: 'This stays forever',
  duration: 0 // Won't auto-dismiss
});
```

## 🎭 Animations

- **Slide in from right:** 300ms ease-in-out
- **Slide out to right:** 300ms ease-in-out
- **Smooth opacity transition**

## 📱 Responsive

- **Desktop:** Fixed position top-right (1.5rem spacing)
- **Mobile:** Full-width with margins (1rem spacing)

## 🎨 Customization

### Colors
Edit `toast.component.ts` → `colorClasses` getter:

```typescript
get colorClasses(): string {
  switch (this.toast.type) {
    case 'success':
      return 'bg-green-50 border-green-500 text-green-800';
    // ...
  }
}
```

### Position
Edit `toast-container.component.ts` → styles:

```css
.toast-container {
  position: fixed;
  top: 1.5rem;      // Change vertical position
  right: 1.5rem;    // Change horizontal position
  // For center: left: 50%; transform: translateX(-50%);
  // For bottom: bottom: 1.5rem; (remove top)
}
```

### Max Width
Edit `toast.component.scss`:

```scss
.toast-item {
  min-width: 320px;
  max-width: 400px; // Change this
}
```

## 🔧 Advanced Usage

### With HTTP Error Interceptor
```typescript
// auth.interceptor.ts
return next.handle(authReq).pipe(
  catchError((error: HttpErrorResponse) => {
    if (error.status === 401) {
      this.toastService.error('กรุณาเข้าสู่ระบบใหม่', 'Session หมดอายุ');
      this.router.navigate(['/login']);
    }
    return throwError(() => error);
  })
);
```

### With Form Validation
```typescript
onSubmit() {
  if (this.form.invalid) {
    this.toastService.warning('กรุณากรอกข้อมูลให้ครบถ้วน', 'ข้อมูลไม่ครบ');
    return;
  }
  
  this.service.save(this.form.value).subscribe({
    next: () => this.toastService.success('บันทึกสำเร็จ'),
    error: () => this.toastService.error('บันทึกไม่สำเร็จ')
  });
}
```

## 📝 Notes

- ✅ Auto-stacking: Toasts stack vertically
- ✅ Auto-dismiss: Configurable per toast
- ✅ Manual close: Click X button
- ✅ Animations: Smooth slide in/out
- ✅ Responsive: Mobile-friendly
- ✅ Accessible: Proper ARIA attributes
- ✅ Type-safe: Full TypeScript support

## 🔗 Related Files

- **Component:** `toast.component.ts`, `toast-container.component.ts`
- **Service:** `toast.service.ts`
- **Styles:** `toast.component.scss`
- **Integration:** `notification.service.ts` (SignalR)
- **App:** `app.component.html`, `app.component.ts`

