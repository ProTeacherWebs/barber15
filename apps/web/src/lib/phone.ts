export function normalizePhone(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  const national =
    digits.length === 9 ? digits : digits.length === 12 && digits.startsWith("998") ? digits.slice(3) : null;

  if (!national || national.length !== 9) {
    return null;
  }

  return `+998${national}`;
}

export function formatPhone(value: string): string {
  const normalized = normalizePhone(value);
  if (!normalized) {
    return value.trim();
  }

  const digits = normalized.slice(1);
  return `+${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 10)} ${digits.slice(10, 12)}`;
}
