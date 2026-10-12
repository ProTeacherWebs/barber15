import { useEffect, useState } from "react";
import { api, ApiRequestError, type DayItem, type ManagedBooking, type SlotItem } from "./api";
import styles from "./App.module.css";
import { dayLabel, formatDuration, formatPrice } from "./format";

const statusLabel: Record<string, string> = {
  confirmed: "Подтверждена",
  cancelled: "Отменена",
  completed: "Завершена",
  no_show: "Не пришёл",
};

export function MyBookings({ signedIn, reloadKey }: { signedIn: boolean; reloadKey: number }) {
  const [bookings, setBookings] = useState<ManagedBooking[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [moving, setMoving] = useState<string | null>(null);
  const [days, setDays] = useState<DayItem[] | null>(null);
  const [slots, setSlots] = useState<SlotItem[] | null>(null);
  const [startsAt, setStartsAt] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!signedIn) {
      setBookings([]);
      return;
    }
    let cancelled = false;
    setBookings(null);
    void api<{ bookings: ManagedBooking[] }>("/api/v1/me/bookings")
      .then((body) => {
        if (!cancelled) {
          setBookings(body.bookings);
        }
      })
      .catch((reason: unknown) => {
        if (!cancelled) {
          setError(reason instanceof ApiRequestError ? reason.message : "Не удалось загрузить записи");
          setBookings([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [signedIn, reloadKey]);

  async function cancel(token: string) {
    setBusy(true);
    setError(null);
    try {
      await api(`/api/v1/bookings/${token}/cancel`, { method: "POST" });
      const body = await api<{ bookings: ManagedBooking[] }>("/api/v1/me/bookings");
      setBookings(body.bookings);
    } catch (reason) {
      setError(reason instanceof ApiRequestError ? reason.message : "Не удалось отменить запись");
    } finally {
      setBusy(false);
    }
  }

  async function openMove(booking: ManagedBooking) {
    setMoving(booking.manageToken);
    setStartsAt(null);
    setSlots(null);
    setError(null);
    try {
      const params = new URLSearchParams({
        serviceIds: booking.services.map((service) => service.id).join(","),
        barberId: booking.barber.id,
      });
      const body = await api<{ days: DayItem[] }>(`/api/v1/availability/days?${params}`);
      setDays(body.days);
    } catch (reason) {
      setError(reason instanceof ApiRequestError ? reason.message : "Не удалось загрузить дни");
    }
  }

  async function loadSlots(booking: ManagedBooking, date: string) {
    setStartsAt(null);
    try {
      const params = new URLSearchParams({
        serviceIds: booking.services.map((service) => service.id).join(","),
        barberId: booking.barber.id,
        date,
      });
      const body = await api<{ slots: SlotItem[] }>(`/api/v1/availability?${params}`);
      setSlots(body.slots.filter((slot) => slot.startsAt !== booking.startsAt));
    } catch (reason) {
      setError(reason instanceof ApiRequestError ? reason.message : "Не удалось загрузить время");
    }
  }

  async function reschedule(token: string) {
    if (!startsAt) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api(`/api/v1/bookings/${token}/reschedule`, {
        method: "POST",
        body: JSON.stringify({ startsAt }),
      });
      const body = await api<{ bookings: ManagedBooking[] }>("/api/v1/me/bookings");
      setBookings(body.bookings);
      setMoving(null);
    } catch (reason) {
      setError(reason instanceof ApiRequestError ? reason.message : "Не удалось перенести запись");
    } finally {
      setBusy(false);
    }
  }

  if (!signedIn) {
    return <p className={styles.muted}>Записи появятся, когда откроете Полосу из Telegram.</p>;
  }
  if (bookings === null) {
    return <p className={styles.muted}>Загружаем записи</p>;
  }

  return (
    <section className={styles.panel}>
      <h2>Мои записи</h2>
      {error ? <p className={styles.error}>{error}</p> : null}
      {bookings.length === 0 ? <p className={styles.muted}>Записей пока нет.</p> : null}
      <div className={styles.list}>
        {bookings.map((booking) => (
          <article key={booking.manageToken} className={styles.card}>
            <h3>{booking.services.map((service) => service.name).join(", ")}</h3>
            <p>
              {dayLabel(booking.date).full}, {booking.time}
            </p>
            <p className={styles.muted}>
              {booking.barber.name} · {statusLabel[booking.status] ?? booking.status} · {formatDuration(booking.totalDurationMin)} ·{" "}
              {formatPrice(booking.totalPrice)}
            </p>
            {booking.canChange ? (
              <div className={styles.actions}>
                <button type="button" className={styles.secondary} disabled={busy} onClick={() => void cancel(booking.manageToken)}>
                  Отменить
                </button>
                <button type="button" className={styles.secondary} onClick={() => void openMove(booking)}>
                  Перенести
                </button>
              </div>
            ) : null}
            {moving === booking.manageToken ? (
              <div>
                <div className={styles.dates}>
                  {(days ?? []).map((item) => {
                    const parts = dayLabel(item.date);
                    return (
                      <button
                        key={item.date}
                        type="button"
                        className={item.open ? styles.date : `${styles.date} ${styles.closed}`}
                        onClick={() => void loadSlots(booking, item.date)}
                      >
                        <span>{parts.weekday}</span>
                        <strong>{parts.date}</strong>
                      </button>
                    );
                  })}
                </div>
                <div className={styles.times}>
                  {(slots ?? []).map((slot) => (
                    <button
                      key={slot.startsAt}
                      type="button"
                      className={styles.time}
                      aria-checked={startsAt === slot.startsAt}
                      onClick={() => setStartsAt(slot.startsAt)}
                    >
                      {slot.label}
                    </button>
                  ))}
                </div>
                <div className={styles.actions}>
                  <button type="button" className={styles.primary} disabled={!startsAt || busy} onClick={() => void reschedule(booking.manageToken)}>
                    Перенести на это время
                  </button>
                </div>
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
