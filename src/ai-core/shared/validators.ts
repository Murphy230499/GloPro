export function validatePhone(phone: string): boolean {
  if (!phone) return false;
  return /^(0\d{9})$/.test(phone.trim());
}

export function validateNonEmptyString(str?: string, minLength: number = 1): boolean {
  if (!str) return false;
  return str.trim().length >= minLength;
}

export function validateDate(dateStr?: string): boolean {
  if (!dateStr) return false;
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr.trim());
}

export function validateTime(timeStr?: string): boolean {
  if (!timeStr) return false;
  return /^\d{1,2}:\d{2}$/.test(timeStr.trim());
}
