const TZ = "Asia/Tashkent";

export function todayKey(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function shiftKey(key: string, days: number): string {
  const [year, month, day] = key.split("-").map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day + days));
  const nextYear = utc.getUTCFullYear();
  const nextMonth = String(utc.getUTCMonth() + 1).padStart(2, "0");
  const nextDay = String(utc.getUTCDate()).padStart(2, "0");
  return `${nextYear}-${nextMonth}-${nextDay}`;
}

export function dayParts(key: string): { weekday: string; date: string; month: string; label: string } {
  const [year, month, day] = key.split("-").map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day));
  const weekday = new Intl.DateTimeFormat("ru-RU", { weekday: "short", timeZone: "UTC" })
    .format(utc)
    .replace(".", "");
  const monthName = new Intl.DateTimeFormat("ru-RU", { month: "short", timeZone: "UTC" })
    .format(utc)
    .replace(".", "");

  return {
    weekday,
    date: String(day),
    month: monthName,
    label: `${weekday}, ${day} ${monthName}`,
  };
}
