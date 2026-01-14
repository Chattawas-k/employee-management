export interface AvatarColors {
  backgroundColor: string;
  textColor: string;
}

const COLOR_PALETTE: AvatarColors[] = [
  { backgroundColor: '#EEF2FF', textColor: '#3730A3' }, // indigo
  { backgroundColor: '#ECFDF5', textColor: '#065F46' }, // emerald
  { backgroundColor: '#EFF6FF', textColor: '#1D4ED8' }, // blue
  { backgroundColor: '#FFFBEB', textColor: '#92400E' }, // amber
  { backgroundColor: '#FDF2F8', textColor: '#9D174D' }, // pink
  { backgroundColor: '#F5F3FF', textColor: '#5B21B6' }, // violet
  { backgroundColor: '#F0FDFA', textColor: '#115E59' }, // teal
  { backgroundColor: '#FEF2F2', textColor: '#991B1B' }  // red
];

function isThaiCharacter(char: string): boolean {
  if (!char) return false;
  const code = char.charCodeAt(0);
  return code >= 0x0E00 && code <= 0x0E7F;
}

export function getInitials(fullName: string): string {
  const trimmed = (fullName || '').trim();
  if (!trimmed) return '';

  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';

  // Thai: first character of first name
  const firstWord = parts[0];
  const firstChar = firstWord.charAt(0);
  if (isThaiCharacter(firstChar)) {
    return firstChar;
  }

  // English/others: first letter of first + last
  if (parts.length === 1) {
    return firstChar.toUpperCase();
  }

  const lastWord = parts[parts.length - 1];
  return (firstChar + lastWord.charAt(0)).toUpperCase();
}

export function getDeterministicAvatarColors(seed: string): AvatarColors {
  const s = (seed || '').trim();
  if (!s) return COLOR_PALETTE[0];

  // Simple deterministic hash (djb2)
  let hash = 5381;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) + hash) + s.charCodeAt(i);
    hash = hash | 0; // force 32-bit
  }

  const idx = Math.abs(hash) % COLOR_PALETTE.length;
  return COLOR_PALETTE[idx];
}

