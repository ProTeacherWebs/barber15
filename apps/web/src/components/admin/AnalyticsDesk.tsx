"use client";

import { useEffect, useState } from "react";
import { AdminError, adminFetch, todayKey, weekdays } from "@/lib/adminApi";
import { formatPrice } from "@/lib/format";
import styles from "./Admin.module.css";

type Revenue = { revenue: number; completed: number; bookings: number };
type ServiceRow = { id: string; name: string; count: number; revenue: number };
type BarberRow = { id: string; name: string; bookings: number; minutes: number; workMinutes: number; occupancy: number | null; revenue: number };
type Heat = { hours: number[]; cells: { weekday: number; hour: number; count: number }[] };
type Lost = { cancelled: number; noShow: number; cancelShare: number; noShowShare: number; byBarber: { id: string; name: string; cancelled: number; noShow: number }[] };
type Retention = { clients: number; returning: number; share: number };

function shiftKey(key: string, days: number) {
  const [year, month, day] = key.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + days));
  return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}-${String(next.getUTCDate()).padStart(2, "0")}`;
}

export function AnalyticsDesk() {
  const [from, setFrom] = useState(() => shiftKey(todayKey(), -29));
  const [to, setTo] = useState(() => todayKey());
  const [revenue, setRevenue] = useState<Revenue | null>(null);
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [barbers, setBarbers] = useState<BarberRow[]>([]);
  const [heat, setHeat] = useState<Heat | null>(null);
  const [lost, setLost] = useState<Lost | null>(null);
  const [retention, setRetention] = useState<Retention | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (from > to) {
      return;
    }
    const query = `from=${from}&to=${to}`;
    setError("");
    Promise.all([
      adminFetch<Revenue>(`/api/v1/admin/analytics/revenue?${query}`),
      adminFetch<{ services: ServiceRow[] }>(`/api/v1/admin/analytics/services?${query}`),
      adminFetch<{ barbers: BarberRow[] }>(`/api/v1/admin/analytics/load?${query}`),
      adminFetch<Heat>(`/api/v1/admin/analytics/heatmap?${query}`),
      adminFetch<Lost>(`/api/v1/admin/analytics/cancellations?${query}`),
      adminFetch<Retention>(`/api/v1/admin/analytics/retention?${query}`),
    ])
      .then(([money, popular, load, map, cancellations, back]) => {
        setRevenue(money);
        setServices(popular.services);
        setBarbers(load.barbers);
        setHeat(map);
        setLost(cancellations);
        setRetention(back);
      })
      .catch((reason: unknown) => setError(reason instanceof AdminError ? reason.message : "Не удалось посчитать аналитику"));
  }, [from, to]);

  const maxHeat = Math.max(1, ...(heat?.cells.map((cell) => cell.count) ?? [1]));

  return (
    <>
      <h1>Аналитика</h1>
      <p className={styles.note}>Выручка считается только по завершённым визитам. Период — по времени Ташкента.</p>
      <div className={styles.grid}>
        <label className={styles.field}>
          С
          <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
        </label>
        <label className={styles.field}>
          По
          <input type="date" value={to} onChange={(event) => setTo(event.target.value)} />
        </label>
      </div>
      {from > to ? <p className={styles.error}>Начало периода позже конца.</p> : null}
      {error ? <p className={styles.error}>{error}</p> : null}
      <div className={styles.stats}>
        <p className={styles.stat}>
          Выручка
          <strong>{formatPrice(revenue?.revenue ?? 0)}</strong>
        </p>
        <p className={styles.stat}>
          Записи
          <strong>{revenue?.bookings ?? 0}</strong>
        </p>
        <p className={styles.stat}>
          Завершено
          <strong>{revenue?.completed ?? 0}</strong>
        </p>
        <p className={styles.stat}>
          Отмены
          <strong>
            {lost?.cancelled ?? 0} · {lost?.cancelShare ?? 0}%
          </strong>
        </p>
        <p className={styles.stat}>
          Неявки
          <strong>
            {lost?.noShow ?? 0} · {lost?.noShowShare ?? 0}%
          </strong>
        </p>
        <p className={styles.stat}>
          Возвращаемость
          <strong>
            {retention?.returning ?? 0} из {retention?.clients ?? 0} · {retention?.share ?? 0}%
          </strong>
        </p>
      </div>
      <section>
        <h2>Услуги</h2>
        <ul className={styles.list}>
          {services.length === 0 ? <li className={styles.note}>За период услуг не выбирали.</li> : null}
          {services.map((service) => (
            <li key={service.id} className={styles.item}>
              <strong>{service.name}</strong>
              <span>
                {service.count} записей · {formatPrice(service.revenue)}
              </span>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2>Барберы</h2>
        <ul className={styles.list}>
          {barbers.map((barber) => (
            <li key={barber.id} className={styles.item}>
              <strong>{barber.name}</strong>
              <span>
                {barber.bookings} визитов · {barber.minutes} из {barber.workMinutes} мин ·{" "}
                {barber.occupancy === null ? "смены нет" : `${barber.occupancy}%`} · {formatPrice(barber.revenue)}
              </span>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2>День и час</h2>
        <p className={styles.note}>Подтверждённые и завершённые визиты. Чем темнее клетка, тем больше записей.</p>
        <div className={styles.heat}>
          <div className={styles.heatRow} style={{ gridTemplateColumns: `2.5rem repeat(${heat?.hours.length ?? 11}, 2rem)` }}>
            <span />
            {heat?.hours.map((hour) => (
              <span key={hour}>{hour}</span>
            ))}
          </div>
          {weekdays.map((label, index) => (
            <div key={label} className={styles.heatRow} style={{ gridTemplateColumns: `2.5rem repeat(${heat?.hours.length ?? 11}, 2rem)` }}>
              <span>{label}</span>
              {heat?.hours.map((hour) => {
                const count = heat.cells.find((cell) => cell.weekday === index + 1 && cell.hour === hour)?.count ?? 0;
                return (
                  <span
                    key={hour}
                    className={styles.cell}
                    style={{ ["--heat" as string]: count / maxHeat }}
                    title={`${label} ${hour}:00 — ${count}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
