// Окна и тексты совпадают с apps/api/src/reminders.ts.
// Доступ к базе — service role, он обходит RLS. Анонимный ключ сюда не кладём.
const GRACE_MIN = 20;

type ClientRow = { name: string; telegram_chat_id: string | null };
type BarberRow = { name: string };
type ServiceRow = { name: string };

type BookingRow = {
  id: string;
  starts_at: string;
  clients: ClientRow | ClientRow[] | null;
  barbers: BarberRow | BarberRow[] | null;
  booking_services: ServiceRow[] | null;
};

function sameSecret(given: string, secret: string) {
  if (!secret || given.length !== secret.length) {
    return false;
  }
  let diff = 0;
  for (let index = 0; index < given.length; index += 1) {
    diff |= given.charCodeAt(index) ^ secret.charCodeAt(index);
  }
  return diff === 0;
}

function windowOf(now: Date, leadMin: number) {
  const minute = 60_000;
  const after = new Date(now.getTime() + (leadMin - GRACE_MIN) * minute);
  return {
    after: (after > now ? after : now).toISOString(),
    until: new Date(now.getTime() + leadMin * minute).toISOString(),
  };
}

function one<T>(value: T | T[] | null): T | null {
  if (!value) {
    return null;
  }
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function whenLabel(startsAt: string, timeZone: string) {
  const instant = new Date(startsAt).getTime();
  const key = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(instant));
  const [year, month, day] = key.split("-").map(Number);
  const date = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", timeZone: "UTC" }).format(
    new Date(Date.UTC(year, month - 1, day)),
  );
  const clock = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(instant));
  return `${date}, ${clock}`;
}

function textOf(kind: "day" | "soon" | "review", when: string, services: string, barber: string) {
  const head =
    kind === "day"
      ? "Напоминание: завтра ждём вас."
      : kind === "soon"
        ? "Напоминание: визит через 30 минут."
        : "Как прошёл визит? Напишите оценку от 1 до 5.";
  return `${head}\n${services}\n${barber}\n${when}`;
}

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return Response.json({ code: "VALIDATION", message: "Нужен POST" }, { status: 400 });
  }
  const secret = Deno.env.get("CRON_SECRET") ?? "";
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!secret || !supabaseUrl || !serviceKey) {
    return Response.json({ code: "CRON_NOT_CONFIGURED", message: "Не заданы секреты функции" }, { status: 503 });
  }
  if (!sameSecret(request.headers.get("x-cron-secret") ?? "", secret)) {
    return Response.json({ code: "CRON_AUTH", message: "Неверный секрет cron" }, { status: 401 });
  }

  const headers = {
    apikey: serviceKey,
    authorization: `Bearer ${serviceKey}`,
    "content-type": "application/json",
  };

  async function rest<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
      ...init,
      headers: { ...headers, ...(init?.headers ?? {}) },
    });
    if (!response.ok) {
      throw new Error(`rest ${response.status}`);
    }
    if (response.status === 204) {
      return [] as T;
    }
    return (await response.json()) as T;
  }

  const settings = await rest<{ key: string; value: string }[]>("settings?select=key,value");
  const map = new Map(settings.map((row) => [row.key, row.value]));
  const read = (key: string, fallback: number) => {
    const value = Number(map.get(key));
    return Number.isFinite(value) && value > 0 ? value : fallback;
  };
  const dayMin = read("reminder_day_minutes", 1440);
  const soonMin = read("reminder_short_minutes", 30);
  const reviewDelayMin = read("review_delay_min", 60);
  const timeZone = map.get("timezone") || "Asia/Tashkent";
  const now = new Date();
  const select =
    "select=id,starts_at,clients!bookings_client_id_fkey(name,telegram_chat_id),barbers!bookings_barber_id_fkey(name),booking_services(name)";

  async function claim(id: string, column: string, extra: string) {
    const rows = await rest<BookingRow[]>(`bookings?id=eq.${id}&${column}=is.null&${extra}`, {
      method: "PATCH",
      headers: { prefer: "return=representation" },
      body: JSON.stringify({ [column]: now.toISOString() }),
    });
    return rows.length === 1;
  }

  async function notify(kind: "day" | "soon" | "review", rows: BookingRow[], column: string, extra: string) {
    const token = Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "";
    const tokenSecret = token.split(":")[1] ?? "";
    let sent = 0;
    for (const row of rows) {
      const owned = await claim(row.id, column, extra);
      if (!owned) {
        continue;
      }
      const client = one(row.clients);
      const barber = one(row.barbers);
      const chatId = client?.telegram_chat_id;
      if (!chatId || !barber || tokenSecret.length < 30) {
        continue;
      }
      const services = (row.booking_services ?? []).map((service) => service.name).join(", ");
      const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: textOf(kind, whenLabel(row.starts_at, timeZone), services, barber.name),
        }),
      });
      if (response.ok) {
        sent += 1;
      }
    }
    return sent;
  }

  const day = windowOf(now, dayMin);
  const soon = windowOf(now, soonMin);
  const dayRows = await rest<BookingRow[]>(
    `bookings?${select}&status=eq.confirmed&reminder_day_sent_at=is.null&starts_at=gt.${encodeURIComponent(day.after)}&starts_at=lte.${encodeURIComponent(day.until)}`,
  );
  const soonRows = await rest<BookingRow[]>(
    `bookings?${select}&status=eq.confirmed&reminder_30m_sent_at=is.null&starts_at=gt.${encodeURIComponent(soon.after)}&starts_at=lte.${encodeURIComponent(soon.until)}`,
  );
  const daySent = await notify("day", dayRows, "reminder_day_sent_at", "status=eq.confirmed");
  const soonSent = await notify("soon", soonRows, "reminder_30m_sent_at", "status=eq.confirmed");

  const completed = await rest<BookingRow[]>(
    `bookings?status=eq.confirmed&auto_completed_at=is.null&ends_at=lt.${encodeURIComponent(now.toISOString())}`,
    {
      method: "PATCH",
      headers: { prefer: "return=representation" },
      body: JSON.stringify({ status: "completed", auto_completed_at: now.toISOString() }),
    },
  );

  const reviewBefore = new Date(now.getTime() - reviewDelayMin * 60_000).toISOString();
  const reviewRows = await rest<BookingRow[]>(
    `bookings?${select}&status=eq.completed&review_requested_at=is.null&ends_at=lt.${encodeURIComponent(reviewBefore)}`,
  );
  const reviews = await notify("review", reviewRows, "review_requested_at", "status=eq.completed");

  return Response.json({ day: daySent, soon: soonSent, completed: completed.length, reviews });
});
