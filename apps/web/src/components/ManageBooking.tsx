"use client";

import Link from "next/link";
import { useState } from "react";
import { formatDuration, formatPrice } from "@/lib/format";
import { dayParts } from "@/lib/slots";
import styles from "./ManageBooking.module.css";

export type ManagedBooking = {
  status: string;
  startsAt: string;
  date: string;
  time: string;
  barber: { id: string; name: string };
  services: { id: string; name: string; durationMin: number; price: number }[];
  totalPrice: number;
  totalDurationMin: number;
  clientName: string;
  manageToken: string;
  telegramUrl: string | null;
  canChange: boolean;
};

type SlotItem = { label: string; startsAt: string };
type DayItem = { date: string; open: boolean };

const statusLabel: Record<string, string> = {
  confirmed: "Подтверждена",
  cancelled: "Отменена",
  completed: "Завершена",
  no_show: "Не пришёл",
};

export function ManageBooking({ initial }: { initial: ManagedBooking }) {
  const [booking, setBooking] = useState(initial);
  const [mode, setMode] = useState<"view" | "move">("view");
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState<DayItem[] | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<SlotItem[] | null>(null);
  const [startsAt, setStartsAt] = useState<string | null>(null);

  const serviceIds = booking.services.map((service) => service.id).join(",");

  async function loadDays() {
    setError(null);
    setMode("move");
    setDays(null);
    setDate(null);
    setSlots(null);
    setStartsAt(null);
    const params = new URLSearchParams({ serviceIds, barberId: booking.barber.id });
    const response = await fetch(`/api/v1/availability/days?${params}`);
    if (!response.ok) {
      setError("Не удалось загрузить дни");
      return;
    }
    const body = (await response.json()) as { days: DayItem[] };
    setDays(body.days);
  }

  async function loadSlots(nextDate: string) {
    setDate(nextDate);
    setStartsAt(null);
    setSlots(null);
    const params = new URLSearchParams({
      serviceIds,
      barberId: booking.barber.id,
      date: nextDate,
    });
    const response = await fetch(`/api/v1/availability?${params}`);
    if (!response.ok) {
      setError("Не удалось загрузить время");
      return;
    }
    const body = (await response.json()) as { slots: SlotItem[] };
    setSlots(body.slots.filter((slot) => slot.startsAt !== booking.startsAt));
  }

  async function cancel() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/v1/bookings/${booking.manageToken}/cancel`, { method: "POST" });
      const body = (await response.json()) as { booking?: ManagedBooking; message?: string };
      if (!response.ok || !body.booking) {
        setError(body.message ?? "Не удалось отменить запись");
        return;
      }
      setBooking(body.booking);
      setConfirmCancel(false);
      setMode("view");
    } catch {
      setError("Не удалось отменить запись");
    } finally {
      setBusy(false);
    }
  }

  async function reschedule() {
    if (!startsAt) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/v1/bookings/${booking.manageToken}/reschedule`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ startsAt }),
      });
      const body = (await response.json()) as { booking?: ManagedBooking; message?: string; code?: string };
      if (!response.ok || !body.booking) {
        setError(body.message ?? "Не удалось перенести запись");
        if (body.code === "SLOT_TAKEN" && date) {
          await loadSlots(date);
        }
        return;
      }
      setBooking(body.booking);
      setMode("view");
    } catch {
      setError("Не удалось перенести запись");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="wrap">
      <h1>Ваша запись</h1>
      <p className={styles.status}>{statusLabel[booking.status] ?? booking.status}</p>
      <dl className={styles.summary}>
        <div>
          <dt>Гость</dt>
          <dd>{booking.clientName}</dd>
        </div>
        <div>
          <dt>Услуги</dt>
          <dd>{booking.services.map((service) => service.name).join(", ")}</dd>
        </div>
        <div>
          <dt>Барбер</dt>
          <dd>{booking.barber.name}</dd>
        </div>
        <div>
          <dt>Когда</dt>
          <dd>
            {dayParts(booking.date).label}, {booking.time}
          </dd>
        </div>
        <div>
          <dt>Длительность</dt>
          <dd>
            {formatDuration(booking.totalDurationMin)} · {formatPrice(booking.totalPrice)}
          </dd>
        </div>
      </dl>
      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
      {booking.telegramUrl ? (
        <p className={styles.telegram}>
          <a href={booking.telegramUrl}>Получать уведомления в Telegram</a>
        </p>
      ) : null}
      {booking.canChange && mode === "view" ? (
        <div className={styles.actions}>
          {confirmCancel ? (
            <button type="button" className="cta" disabled={busy} onClick={() => void cancel()}>
              {busy ? "Отменяем" : "Да, отменить"}
            </button>
          ) : (
            <button type="button" className="cta" onClick={() => setConfirmCancel(true)}>
              Отменить запись
            </button>
          )}
          <button type="button" className="ctaSecondary" onClick={() => void loadDays()}>
            Перенести
          </button>
          <Link className="ctaSecondary" href="/" transitionTypes={["nav-back"]}>
            На главную
          </Link>
        </div>
      ) : null}
      {booking.canChange && mode === "move" ? (
        <div className={styles.move}>
          <h2>Новое время</h2>
          {days === null ? (
            <p className={styles.muted}>Загружаем дни</p>
          ) : (
            <div className={styles.dates} role="radiogroup" aria-label="Дата переноса">
              {days.map((item) => {
                const parts = dayParts(item.date);
                return (
                  <label key={item.date} className={item.open ? styles.date : `${styles.date} ${styles.dateClosed}`}>
                    <input
                      type="radio"
                      name="move-date"
                      value={item.date}
                      checked={date === item.date}
                      onChange={() => void loadSlots(item.date)}
                    />
                    <span>{parts.weekday}</span>
                    <strong>{parts.date}</strong>
                  </label>
                );
              })}
            </div>
          )}
          {slots ? (
            slots.length > 0 ? (
              <div className={styles.times} role="radiogroup" aria-label="Время переноса">
                {slots.map((slot) => (
                  <label key={slot.startsAt} className={styles.time}>
                    <input
                      type="radio"
                      name="move-time"
                      value={slot.startsAt}
                      checked={startsAt === slot.startsAt}
                      onChange={() => setStartsAt(slot.startsAt)}
                    />
                    {slot.label}
                  </label>
                ))}
              </div>
            ) : (
              <p className={styles.muted}>На этот день свободных окон нет.</p>
            )
          ) : null}
          <div className={styles.actions}>
            <button type="button" className="cta" disabled={!startsAt || busy} onClick={() => void reschedule()}>
              {busy ? "Переносим" : "Перенести на это время"}
            </button>
            <button type="button" className="ctaSecondary" onClick={() => setMode("view")}>
              Назад
            </button>
          </div>
        </div>
      ) : null}
      {!booking.canChange ? (
        <div className={styles.actions}>
          <Link className="ctaSecondary" href="/" transitionTypes={["nav-back"]}>
            На главную
          </Link>
        </div>
      ) : null}
    </div>
  );
}
