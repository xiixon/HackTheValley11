export function isValidBirthDate(value: string, today = new Date()): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  const earliest = new Date(today);
  earliest.setUTCFullYear(earliest.getUTCFullYear() - 120);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value &&
    value <= today.toISOString().slice(0, 10) && value >= earliest.toISOString().slice(0, 10);
}
