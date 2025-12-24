# Loading Overlay Component

Component สำหรับแสดงสถานะ Loading แบบ Overlay หรือ Inline

## Usage

### Import Component
```typescript
import { LoadingOverlayComponent } from '../../shared/components/loading-overlay/loading-overlay.component';

@Component({
  imports: [LoadingOverlayComponent]
})
```

### Basic Usage (Inline)
```html
<app-loading-overlay 
  [isLoading]="loading()" 
  message="กำลังโหลดข้อมูล...">
</app-loading-overlay>
```

### Fullscreen Overlay
```html
<app-loading-overlay 
  [isLoading]="loading()" 
  message="กำลังบันทึกข้อมูล..."
  variant="fullscreen">
</app-loading-overlay>
```

## Props

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `isLoading` | `boolean` | `false` | แสดง/ซ่อน loading |
| `message` | `string` | `'กำลังโหลดข้อมูล...'` | ข้อความที่แสดง |
| `variant` | `'fullscreen' \| 'inline'` | `'inline'` | รูปแบบการแสดงผล |

## Variants

### `inline`
แสดง loading เป็น alert box สีฟ้า (เหมาะสำหรับแสดงในหน้า)

### `fullscreen`
แสดง loading เต็มจอพร้อม backdrop blur (เหมาะสำหรับ blocking operations)

