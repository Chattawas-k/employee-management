# AuthService - User & Role Management Methods

## 📋 Overview
`AuthService` มี methods สำหรับจัดการ authentication และ authorization ที่สามารถใช้ซ้ำได้ในทุก component

## 🔐 Methods สำหรับตรวจสอบ User & Roles

### 1. `getCurrentEmployeeId(): string | null`
ดึง Employee ID จาก JWT token

**Return:**
- `string` - Employee ID ของ user ที่ login อยู่
- `null` - ถ้าไม่พบ token หรือไม่มี EmployeeId

**ตัวอย่างการใช้งาน:**
```typescript
const employeeId = this.authService.getCurrentEmployeeId();
if (!employeeId) {
  this.error.set('กรุณาเข้าสู่ระบบใหม่');
  return;
}
console.log('Current employee:', employeeId);
```

---

### 2. `getCurrentUserRoles(): string[]`
ดึง roles ทั้งหมดของ user จาก JWT token

**รองรับ claim names หลายรูปแบบ:**
- `http://schemas.microsoft.com/ws/2008/06/identity/claims/role` (.NET Identity standard)
- `role`
- `Role`
- `roles`
- `Roles`

**Return:**
- `string[]` - Array of role names
- `[]` - Empty array ถ้าไม่พบ roles

**ตัวอย่างการใช้งาน:**
```typescript
const roles = this.authService.getCurrentUserRoles();
console.log('User roles:', roles); // ['Admin', 'Basic']
```

---

### 3. `hasRole(role: string): boolean`
ตรวจสอบว่า user มี role ที่ระบุหรือไม่ (case-insensitive)

**Parameters:**
- `role: string` - Role name ที่ต้องการตรวจสอบ

**Return:**
- `true` - ถ้ามี role นั้น
- `false` - ถ้าไม่มี

**ตัวอย่างการใช้งาน:**
```typescript
if (this.authService.hasRole('Admin')) {
  console.log('User is Admin');
}

// Case-insensitive
this.authService.hasRole('admin'); // true
this.authService.hasRole('ADMIN'); // true
```

---

### 4. `isAdmin(): boolean`
ตรวจสอบว่า user เป็น Admin หรือ SuperAdmin หรือไม่

**Return:**
- `true` - ถ้าเป็น Admin หรือ SuperAdmin
- `false` - ถ้าไม่ใช่

**ตัวอย่างการใช้งาน:**
```typescript
const isAdmin = this.authService.isAdmin();
if (isAdmin) {
  // แสดง admin features
  this.loadAllEmployees();
}
```

---

### 5. `isSuperAdmin(): boolean`
ตรวจสอบว่า user เป็น SuperAdmin หรือไม่

**Return:**
- `true` - ถ้าเป็น SuperAdmin
- `false` - ถ้าไม่ใช่

**ตัวอย่างการใช้งาน:**
```typescript
if (this.authService.isSuperAdmin()) {
  // แสดง super admin features เท่านั้น
  this.showDeleteAllButton();
}
```

---

### 6. `hasAnyRole(roles: string[]): boolean`
ตรวจสอบว่า user มี role ใดๆ จาก list ที่ระบุหรือไม่

**Parameters:**
- `roles: string[]` - Array of role names

**Return:**
- `true` - ถ้ามีอย่างน้อย 1 role
- `false` - ถ้าไม่มีเลย

**ตัวอย่างการใช้งาน:**
```typescript
// ถ้ามี Admin หรือ Manager ก็ให้ access
if (this.authService.hasAnyRole(['Admin', 'Manager'])) {
  this.canEditEmployee = true;
}
```

---

### 7. `hasAllRoles(roles: string[]): boolean`
ตรวจสอบว่า user มีทุก role ที่ระบุหรือไม่

**Parameters:**
- `roles: string[]` - Array of role names

**Return:**
- `true` - ถ้ามีครบทุก role
- `false` - ถ้าขาดบาง role

**ตัวอย่างการใช้งาน:**
```typescript
// ต้องมีทั้ง Admin และ Auditor ถึงจะ access ได้
if (this.authService.hasAllRoles(['Admin', 'Auditor'])) {
  this.showAuditLogs();
}
```

---

### 8. `getCurrentUserInfo(): { employeeId: string | null; roles: string[]; isAdmin: boolean }`
ดึงข้อมูล user ทั้งหมดในครั้งเดียว

**Return:**
```typescript
{
  employeeId: string | null;  // Employee ID
  roles: string[];            // Array of roles
  isAdmin: boolean;           // true ถ้าเป็น Admin/SuperAdmin
}
```

**ตัวอย่างการใช้งาน:**
```typescript
const userInfo = this.authService.getCurrentUserInfo();
console.log('User Info:', userInfo);
// {
//   employeeId: '8262c21a-2cf0-440b-9472-f207106632f4',
//   roles: ['Admin', 'Basic'],
//   isAdmin: true
// }

if (userInfo.isAdmin) {
  this.loadAllEmployees();
} else {
  this.loadMyTasks(userInfo.employeeId!);
}
```

---

## 🎯 Use Cases

### Case 1: Load Tasks ตาม Role
```typescript
ngOnInit(): void {
  const employeeId = this.authService.getCurrentEmployeeId();
  if (!employeeId) {
    this.router.navigate(['/login']);
    return;
  }

  if (this.authService.isAdmin()) {
    // Admin: โหลดงานของทุกคน
    this.loadAllTasks();
  } else {
    // User: โหลดเฉพาะงานของตัวเอง
    this.loadMyTasks(employeeId);
  }
}
```

### Case 2: แสดง UI Elements ตาม Role
```typescript
// Component
canEditEmployee = computed(() => this.authService.hasAnyRole(['Admin', 'Manager']));
canDeleteEmployee = computed(() => this.authService.isSuperAdmin());

// Template
@if (canEditEmployee()) {
  <button (click)="editEmployee()">Edit</button>
}

@if (canDeleteEmployee()) {
  <button (click)="deleteEmployee()">Delete</button>
}
```

### Case 3: Route Guard
```typescript
export class AdminGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    if (this.authService.isAdmin()) {
      return true;
    }
    
    this.router.navigate(['/unauthorized']);
    return false;
  }
}
```

---

## ⚠️ Important Notes

1. **Case-Insensitive:** ทุก method จะตรวจสอบ role แบบ case-insensitive (`'Admin'` === `'admin'`)

2. **JWT Token:** Methods เหล่านี้อ่านข้อมูลจาก JWT token ใน localStorage
   - ถ้า token หมดอายุ หรือถูกลบ → จะ return `null` หรือ `false`
   - ควรตรวจสอบ `isAuthenticated()` ก่อนเรียกใช้

3. **.NET Identity Claim Names:** รองรับ full claim name ที่ .NET Identity ใช้:
   - `http://schemas.microsoft.com/ws/2008/06/identity/claims/role`
   - แต่ก็รองรับ short names เช่น `role`, `Role`, `roles`, `Roles`

4. **Performance:** Methods เหล่านี้ decode token ทุกครั้งที่เรียก ถ้าต้องใช้บ่อยมาก ควร cache ผลลัพธ์:
```typescript
// ✅ Good - Cache in signal
employeeId = signal<string | null>(null);

ngOnInit() {
  this.employeeId.set(this.authService.getCurrentEmployeeId());
}

// ❌ Bad - Decode ทุกครั้ง
get employeeId() {
  return this.authService.getCurrentEmployeeId(); // Decode token every time!
}
```

---

## 🚀 Migration Guide

### Before (Old Code):
```typescript
loadCurrentUserTasks(): void {
  const token = this.authService.getToken();
  if (!token) {
    this.error.set('ไม่พบข้อมูลการเข้าสู่ระบบ');
    return;
  }

  const payload = this.authService.decodeToken(token);
  if (!payload || !payload.EmployeeId) {
    this.error.set('ไม่พบข้อมูล Employee ID');
    return;
  }

  const employeeId = payload.EmployeeId;
  const roleClaimName = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';
  const roles = payload[roleClaimName] || payload.role || [];
  const userRoles = Array.isArray(roles) ? roles : [roles];
  const isAdminUser = userRoles.some((role: string) => 
    role && (role.toLowerCase() === 'admin' || role.toLowerCase() === 'superadmin')
  );

  this.isAdmin.set(isAdminUser);
  this.loadMyTasks(employeeId);
}
```

### After (New Code):
```typescript
loadCurrentUserTasks(): void {
  const employeeId = this.authService.getCurrentEmployeeId();
  if (!employeeId) {
    this.error.set('ไม่พบข้อมูล Employee ID กรุณาเข้าสู่ระบบใหม่');
    return;
  }

  const isAdminUser = this.authService.isAdmin();
  this.isAdmin.set(isAdminUser);
  this.loadMyTasks(employeeId);
}
```

**ผลลัพธ์:**
- ✅ โค้ดสั้นลง กระชับขึ้น
- ✅ ง่ายต่อการอ่านและเข้าใจ
- ✅ นำกลับมาใช้ซ้ำได้ในหน้าอื่นๆ
- ✅ Logic อยู่รวมกันใน Service เดียว

---

## 📚 Related Files

- **Service:** `Fontend/src/app/services/auth.service.ts`
- **Usage Example:** `Fontend/src/app/features/my-tasks/my-tasks.component.ts`
- **Models:** `Fontend/src/app/models/auth.model.ts`

