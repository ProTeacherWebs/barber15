"use client";

import { useEffect, useState } from "react";
import { AdminError, adminFetch, statusLabel, todayKey } from "@/lib/adminApi";
import { formatPrice } from "@/lib/format";
import styles from "./Admin.module.css";

type Booking = {
  id: string;
  status: string;
  source: string;
  date: string;
  time: string;
  barber: { id: string; name: string };
  services: string[];
  serviceIds: string[];
  totalPrice: number;
  clientName: string;
  clientPhone: string;
};

type Slot = { label: string; startsAt: string };
type Barber = { id: string; name: string; isActive: boolean };
type Service = { id: string; name: string; isActive: boolean };

export function BookingsDesk({ today = false }: { today?: boolean }) {
  const [date, setDate] = useState(todayKey());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [error, setError] = useState("");
  const [moveId, setMoveId] = useState("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [form, setForm] = useState({
    serviceId: "",
    barberId: "",
    startsAt: "",
    name: "",
    phone: "",
  });

  async function load(nextDate = date) {
    const body = await adminFetch<{ bookings: Booking[] }>(`/api/v1/admin/bookings?date=${nextDate}`);
    setBookings(body.bookings);
  }

  useEffect(() => {
    void load().catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Ошибка"));
    adminFetch<{ barbers: Barber[] }>("/api/v1/admin/barbers")
      .then((body) => setBarbers(body.barbers))
      .catch(() => undefined);
    adminFetch<{ services: Service[] }>("/api/v1/admin/services")
      .then((body) => {
        setServices(body.services);
        setForm((current) => ({ ...current, serviceId: current.serviceId || body.services[0]?.id || "" }));
      })
      .catch(() => undefined);
  }, []);

  async function refreshSlots(serviceId: string, barberId: string, day: string) {
    if (!serviceId || !barberId) {
      setSlots([]);
      return;
    }
    const body = await adminFetch<{ slots: Slot[] }>(
      `/api/v1/admin/availability?serviceIds=${serviceId}&barberId=${barberId}&date=${day}`,
    );
    setSlots(body.slots);
  }

  async function createBooking(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await adminFetch("/api/v1/admin/bookings", {
        method: "POST",
        body: JSON.stringify({
          serviceIds: [form.serviceId],
          barberId: form.barberId,
          startsAt: form.startsAt,
          client: { name: form.name, phone: form.phone },
        }),
      });
      setForm((current) => ({ ...current, startsAt: "", name: "", phone: "" }));
      await load();
    } catch (reason) {
      setError(reason instanceof AdminError ? reason.message : "Не удалось записать");
    }
  }

  async function patch(id: string, payload: { status?: string; startsAt?: string }) {
    setError("");
    try {
      await adminFetch(`/api/v1/admin/bookings/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
      setMoveId("");
      await load();
    } catch (reason) {
      setError(reason instanceof AdminError ? reason.message : "Не удалось изменить запись");
    }
  }

  return (
    <>
      <h1>{today ? "Сегодня" : "Записи"}</h1>
      <p className={styles.note}>Время Ташкента. Ручная запись не требует паузы в 30 минут.</p>
      {today ? null : (
        <label className={styles.field}>
          Дата
          <input
            type="date"
            value={date}
            onChange={(event) => {
              setDate(event.target.value);
              void load(event.target.value);
            }}
          />
        </label>
      )}
      {error ? <p className={styles.error}>{error}</p> : null}
      <ul className={styles.list}>
        {bookings.length === 0 ? <li className={styles.note}>На эту дату записей нет.</li> : null}
        {bookings.map((booking) => (
          <li key={booking.id} className={styles.item}>
            <strong>
              {booking.time} · {booking.clientName}
            </strong>
            <span>
              {booking.services.join(", ")} · {booking.barber.name} · {formatPrice(booking.totalPrice)}
            </span>
            <span>
              {booking.clientPhone} · {statusLabel[booking.status] ?? booking.status}
            </span>
            <div className={styles.actions}>
              <label className={styles.field}>
                Статус
                <select value={booking.status} onChange={(event) => void patch(booking.id, { status: event.target.value })}>
                  {Object.entries(statusLabel).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <button className="ctaSecondary" type="button" onClick={() => void patch(booking.id, { status: "cancelled" })}>
                Отменить
              </button>
              <button
                className="ctaSecondary"
                type="button"
                onClick={() => {
                  setMoveId(booking.id);
                  void refreshSlots(booking.serviceIds[0] ?? "", booking.barber.id, date);
                }}
              >
                Перенести
              </button>
            </div>
            {moveId === booking.id ? (
              <div className={styles.slots}>
                {slots.map((slot) => (
                  <button key={slot.startsAt} className="ctaSecondary" type="button" onClick={() => void patch(booking.id, { startsAt: slot.startsAt })}>
                    {slot.label}
                  </button>
                ))}
              </div>
            ) : null}
          </li>
        ))}
      </ul>
      <form
        className={styles.form}
        onSubmit={(event) => void createBooking(event)}
      >
        <h2>Новая запись</h2>
        <div className={`${styles.grid} ${styles.two ?? ""}`}>
          <label className={styles.field}>
            Услуга
            <select
              value={form.serviceId}
              onChange={(event) => {
                const serviceId = event.target.value;
                setForm({ ...form, serviceId, startsAt: "" });
                void refreshSlots(serviceId, form.barberId, date);
              }}
            >
              {services.filter((service) => service.isActive).map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            Барбер
            <select
              value={form.barberId}
              onChange={(event) => {
                const barberId = event.target.value;
                setForm({ ...form, barberId, startsAt: "" });
                void refreshSlots(form.serviceId, barberId, date);
              }}
            >
              <option value="">Выберите</option>
              {barbers.filter((barber) => barber.isActive).map((barber) => (
                <option key={barber.id} value={barber.id}>
                  {barber.name}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            Имя
            <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </label>
          <label className={styles.field}>
            Телефон
            <input value={form.phone} placeholder="+998" onChange={(event) => setForm({ ...form, phone: event.target.value })} />
          </label>
        </div>
        <div className={styles.slots}>
          {slots.map((slot) => (
            <button
              key={slot.startsAt}
              type="button"
              className="ctaSecondary"
              aria-pressed={form.startsAt === slot.startsAt}
              onClick={() => setForm({ ...form, startsAt: slot.startsAt })}
            >
              {slot.label}
            </button>
          ))}
        </div>
        <button className="cta" type="submit" disabled={!form.startsAt}>
          Записать
        </button>
      </form>
    </>
  );
}
