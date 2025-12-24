// Thai language messages and constants
// This file centralizes all user-facing strings for easier maintenance and future i18n support

export const Messages = {
  // Common actions
  SAVE: 'บันทึก',
  CANCEL: 'ยกเลิก',
  DELETE: 'ลบ',
  EDIT: 'แก้ไข',
  ADD: 'เพิ่ม',
  SEARCH: 'ค้นหา',
  CLEAR: 'ล้าง',
  CLEAR_FILTERS: 'ล้างตัวกรอง',
  CONFIRM: 'ยืนยัน',
  CONFIRM_DELETE: 'ยืนยันลบ',
  
  // Common labels
  NAME: 'ชื่อ',
  STATUS: 'สถานะ',
  ACTIONS: 'จัดการ',
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  ALL: 'ทั้งหมด',
  
  // Error messages
  ERROR_LOAD_DATA: 'ไม่สามารถโหลดข้อมูลได้',
  ERROR_SAVE_DATA: 'ไม่สามารถบันทึกข้อมูลได้',
  ERROR_DELETE_DATA: 'ไม่สามารถลบข้อมูลได้',
  ERROR_UPDATE_DATA: 'ไม่สามารถอัปเดตข้อมูลได้',
  ERROR_CREATE_DATA: 'ไม่สามารถสร้างข้อมูลใหม่ได้',
  
  // Validation messages
  REQUIRED_FIELD: 'เป็นข้อมูลที่จำเป็น',
  MIN_LENGTH: (min: number) => `ต้องมีอย่างน้อย ${min} ตัวอักษร`,
  MAX_LENGTH: (max: number) => `ต้องไม่เกิน ${max} ตัวอักษร`,
  INVALID_FORMAT: 'รูปแบบไม่ถูกต้อง',
  
  // Confirm messages
  CONFIRM_DELETE_CATEGORY: 'คุณแน่ใจหรือไม่ว่าต้องการลบหมวดหมู่นี้?',
  CONFIRM_DELETE_HOLIDAY: 'คุณแน่ใจหรือไม่ว่าต้องการลบวันหยุดนี้?',
  CONFIRM_DELETE_LEAVE: 'คุณแน่ใจหรือไม่ว่าต้องการลบรายการลานี้?',
  CONFIRM_DELETE_EMPLOYEE: 'คุณแน่ใจหรือไม่ว่าต้องการลบพนักงานคนนี้?',
  
  // Employee messages
  EMPLOYEE_NAME_REQUIRED: 'ชื่อ-นามสกุลเป็นข้อมูลที่จำเป็น',
  EMPLOYEE_NAME_MIN: 'ชื่อ-นามสกุลต้องมีอย่างน้อย 2 ตัวอักษร',
  EMPLOYEE_NAME_MAX: 'ชื่อ-นามสกุลต้องไม่เกิน 100 ตัวอักษร',
  EMPLOYEE_PHONE_INVALID: 'เบอร์โทรศัพท์ไม่ถูกต้อง (ต้องเป็นตัวเลข 9-10 หลัก หรือมี +66 นำหน้า)',
  EMPLOYEE_POSITION_REQUIRED: 'ตำแหน่งเป็นข้อมูลที่จำเป็น',
  EMPLOYEE_STATUS_REQUIRED: 'สถานะเป็นข้อมูลที่จำเป็น',
  
  // Category messages
  CATEGORY_NAME_REQUIRED: 'ชื่อหมวดหมู่เป็นข้อมูลที่จำเป็น',
  CATEGORY_NAME_MIN: 'ชื่อหมวดหมู่ต้องมีอย่างน้อย 2 ตัวอักษร',
  CATEGORY_NAME_MAX: 'ชื่อหมวดหมู่ต้องไม่เกิน 100 ตัวอักษร',
  ERROR_LOAD_CATEGORIES: 'ไม่สามารถโหลดข้อมูลหมวดหมู่ได้',
  
  // Holiday messages
  HOLIDAY_DATE_REQUIRED: 'วันที่เป็นข้อมูลที่จำเป็น',
  HOLIDAY_NAME_REQUIRED: 'ชื่อวันหยุดเป็นข้อมูลที่จำเป็น',
  HOLIDAY_NAME_MIN: 'ชื่อวันหยุดต้องมีอย่างน้อย 2 ตัวอักษร',
  HOLIDAY_NAME_MAX: 'ชื่อวันหยุดต้องไม่เกิน 100 ตัวอักษร',
  ERROR_LOAD_HOLIDAYS: 'ไม่สามารถโหลดข้อมูลวันหยุดได้',
  
  // Leave messages
  LEAVE_EMPLOYEE_REQUIRED: 'พนักงานเป็นข้อมูลที่จำเป็น',
  LEAVE_DATE_REQUIRED: 'วันที่ลาเป็นข้อมูลที่จำเป็น',
  LEAVE_REASON_REQUIRED: 'เหตุผลเป็นข้อมูลที่จำเป็น',
  LEAVE_REASON_MIN: 'เหตุผลต้องมีอย่างน้อย 5 ตัวอักษร',
  LEAVE_REASON_MAX: 'เหตุผลต้องไม่เกิน 500 ตัวอักษร',
  ERROR_LOAD_EMPLOYEES: 'ไม่สามารถโหลดข้อมูลพนักงานได้',
  ERROR_LOAD_LEAVES: 'ไม่สามารถโหลดข้อมูลการลาได้',
  
  // Empty states
  NO_DATA: 'ไม่พบข้อมูล',
  NO_CATEGORIES: 'ยังไม่มีข้อมูลหมวดหมู่สินค้า',
  NO_HOLIDAYS: 'ไม่มีข้อมูลวันหยุดในปีนี้',
  NO_EMPLOYEES: 'ไม่พบข้อมูลพนักงาน',
  
  // Status labels
  STATUS_ACTIVE: 'ใช้งานอยู่',
  STATUS_INACTIVE: 'ไม่ได้ใช้งาน',
  
  // Action labels
  EDIT_NAME: 'แก้ไขชื่อ',
  TOGGLE_STATUS: (status: string) => status === 'Active' ? 'ปิดการใช้งาน' : 'เปิดการใช้งาน',
} as const;

