export function formatPrice(amount: number): string {
  return `${new Intl.NumberFormat("ru-RU").format(amount)}\u00a0сум`;
}

export function formatDuration(minutes: number): string {
  return `${minutes}\u00a0мин`;
}

export function dayLabel(key: string): { weekday: string; date: string; month: string; full: string } {
  const [year, month, day] = key.split("-").map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day));
  const weekday = new Intl.DateTimeFormat("ru-RU", { weekday: "short", timeZone: "UTC" }).format(utc).replace(".", "");
  const monthName = new Intl.DateTimeFormat("ru-RU", { month: "short", timeZone: "UTC" }).format(utc).replace(".", "");
  return {
    weekday,
    date: String(day),
    month: monthName,
    full: `${weekday}, ${day} ${monthName}`,
  };
}

export function normalizePhone(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  const national = digits.length === 9 ? digits : digits.length === 12 && digits.startsWith("998") ? digits.slice(3) : null;
  if (!national || national.length !== 9) {
    return null;
  }
  return `+998${national}`;
}
