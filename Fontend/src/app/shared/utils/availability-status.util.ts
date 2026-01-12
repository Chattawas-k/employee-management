export type AvailabilityStatusKey =
  | 'available'          // พร้อมรับงาน
  | 'busy'               // ติดลูกค้า
  | 'lunchBreak'         // พักเที่ยง (เดิม break)
  | 'unavailable'        // ไม่พร้อมรับงาน
  | 'leave'              // ลา (เดิม notworking)
  | 'offsiteCustomer';   // พบลูกค้านอกสถานที่

/**
 * Normalize any backend/legacy availability status string to a canonical key.
 *
 * Backend uses JsonStringEnumConverter(camelCase), e.g. `LunchBreak` -> `lunchBreak`.
 * We also accept legacy values (`break`, `notworking`) and Thai labels.
 */
export function normalizeAvailabilityStatus(value: unknown): AvailabilityStatusKey {
  const raw = String(value ?? '').trim();
  if (!raw) return 'unavailable';

  const normalized = raw
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^a-zก-๙]/g, '');

  switch (normalized) {
    case 'available':
      return 'available';
    case 'busy':
      return 'busy';
    case 'lunchbreak':
    case 'lunch':
    case 'break': // legacy
    case 'พัก':
    case 'พักเที่ยง':
    case 'พักเบรก':
      return 'lunchBreak';
    case 'unavailable':
    case 'ไม่พร้อมรับงาน':
      return 'unavailable';
    case 'leave':
    case 'notworking': // legacy
    case 'ลา':
    case 'ไม่ได้ทำงาน':
      return 'leave';
    case 'offsitecustomer':
    case 'offsite':
    case 'พบลูกค้านอกสถานที่':
      return 'offsiteCustomer';
    default:
      return 'unavailable';
  }
}

export function getAvailabilityStatusLabel(status: AvailabilityStatusKey): string {
  switch (status) {
    case 'available':
      return 'พร้อมรับงาน';
    case 'busy':
      return 'ติดลูกค้า';
    case 'lunchBreak':
      return 'พักเที่ยง';
    case 'unavailable':
      return 'ไม่พร้อมรับงาน';
    case 'leave':
      return 'ลา';
    case 'offsiteCustomer':
      return 'พบลูกค้านอกสถานที่';
  }
}

export function getAvailabilityStatusBadgeClass(status: AvailabilityStatusKey): string {
  switch (status) {
    case 'available':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'busy':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'lunchBreak':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'unavailable':
      return 'bg-gray-100 border-gray-200';
    case 'leave':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'offsiteCustomer':
      return 'bg-blue-100 text-blue-800 border-blue-200';
  }
}

export function getAvailabilityStatusDotClass(status: AvailabilityStatusKey): string {
  switch (status) {
    case 'available':
      return 'bg-green-500';
    case 'busy':
      return 'bg-orange-500';
    case 'lunchBreak':
      return 'bg-yellow-500';
    case 'unavailable':
      return 'bg-gray-400';
    case 'leave':
      return 'bg-red-500';
    case 'offsiteCustomer':
      return 'bg-blue-500';
  }
}

