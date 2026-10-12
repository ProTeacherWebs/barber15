export type Range = { start: number; end: number };

export type Slot = { label: string; startsAt: string };

export type SlotQuery = {
  now: number;
  date: string;
  timeZone: string;
  durationMin: number;
  slotStepMin: number;
  minNoticeMin: number;
  horizonDays: number;
  work: { start: string; end: string } | null;
  breaks: { start: string; end: string }[];
  blocked: Range[];
};

const MINUTE = 60_000;
const DAY = 86_400_000;

export function dateKeyInZone(instant: number, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(instant));
  return parts;
}

export function dayOffset(fromKey: string, toKey: string): number {
  const [fromYear, fromMonth, fromDay] = fromKey.split("-").map(Number);
  const [toYear, toMonth, toDay] = toKey.split("-").map(Number);
  return Math.round((Date.UTC(toYear, toMonth - 1, toDay) - Date.UTC(fromYear, fromMonth - 1, fromDay)) / DAY);
}

export function isoWeekday(dateKey: string): number {
  const [year, month, day] = dateKey.split("-").map(Number);
  const utcDay = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return utcDay === 0 ? 7 : utcDay;
}

export function canChangeAt(startsAt: number, now: number, cutoffMin: number): boolean {
  return startsAt - now >= cutoffMin * MINUTE;
}

function zoneOffsetMs(instant: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(instant));
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const zonedAsUtc = Date.UTC(
    Number(value.year),
    Number(value.month) - 1,
    Number(value.day),
    Number(value.hour),
    Number(value.minute),
    Number(value.second),
  );
  return zonedAsUtc - instant;
}

export function zonedTimeToUtc(dateKey: string, clock: string, timeZone: string): number {
  const [year, month, day] = dateKey.split("-").map(Number);
  const [hour, minute] = clock.split(":").map(Number);
  const guess = Date.UTC(year, month - 1, day, hour, minute, 0);
  return guess - zoneOffsetMs(guess, timeZone);
}

export function clockLabel(instant: number, timeZone: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(instant));
}

function subtract(free: Range[], block: Range): Range[] {
  const next: Range[] = [];
  for (const item of free) {
    if (block.end <= item.start || block.start >= item.end) {
      next.push(item);
      continue;
    }
    if (block.start > item.start) {
      next.push({ start: item.start, end: Math.min(block.start, item.end) });
    }
    if (block.end < item.end) {
      next.push({ start: Math.max(block.end, item.start), end: item.end });
    }
  }
  return next.filter((item) => item.end > item.start);
}

export function computeSlots(query: SlotQuery): Slot[] {
  if (!query.work || query.durationMin <= 0 || query.slotStepMin <= 0) {
    return [];
  }
  const today = dateKeyInZone(query.now, query.timeZone);
  const offset = dayOffset(today, query.date);
  if (offset < 0 || offset > query.horizonDays) {
    return [];
  }

  const workStart = zonedTimeToUtc(query.date, query.work.start, query.timeZone);
  const workEnd = zonedTimeToUtc(query.date, query.work.end, query.timeZone);
  if (workEnd <= workStart) {
    return [];
  }

  let free: Range[] = [{ start: workStart, end: workEnd }];
  for (const item of query.breaks) {
    free = subtract(free, {
      start: zonedTimeToUtc(query.date, item.start, query.timeZone),
      end: zonedTimeToUtc(query.date, item.end, query.timeZone),
    });
  }
  for (const block of query.blocked) {
    free = subtract(free, block);
  }

  const earliest = query.now + query.minNoticeMin * MINUTE;
  const step = query.slotStepMin * MINUTE;
  const duration = query.durationMin * MINUTE;
  const slots: Slot[] = [];
  let cursor = workStart;
  if (earliest > workStart) {
    cursor = workStart + Math.ceil((earliest - workStart) / step) * step;
  }

  for (; cursor + duration <= workEnd; cursor += step) {
    const end = cursor + duration;
    if (free.some((item) => cursor >= item.start && end <= item.end)) {
      slots.push({
        label: clockLabel(cursor, query.timeZone),
        startsAt: new Date(cursor).toISOString(),
      });
    }
  }
  return slots;
}
