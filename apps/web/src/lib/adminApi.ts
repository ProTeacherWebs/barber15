export class AdminError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      ...(init?.body ? { "content-type": "application/json" } : {}),
      ...init?.headers,
    },
  });
  const body = (await response.json().catch(() => ({}))) as { message?: string };
  if (response.status === 401 && !path.endsWith("/login")) {
    window.location.assign("/admin/login");
    throw new AdminError(401, "Войдите в админку");
  }
  if (!response.ok) {
    throw new AdminError(response.status, body.message ?? "Не получилось сохранить");
  }
  return body as T;
}

export function todayKey() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tashkent",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export async function uploadPhoto(file: File) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = "";
  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  }
  const saved = await adminFetch<{ url: string }>("/api/v1/admin/uploads", {
    method: "POST",
    body: JSON.stringify({ dataBase64: btoa(binary) }),
  });
  return saved.url;
}

export const weekdays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

export const statusLabel: Record<string, string> = {
  confirmed: "Подтверждена",
  completed: "Завершена",
  cancelled: "Отменена",
  no_show: "Неявка",
};
