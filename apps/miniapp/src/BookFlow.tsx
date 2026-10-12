import { useEffect, useState } from "react";
import { api, ApiRequestError, type Barber, type DayItem, type Service, type SlotItem } from "./api";
import styles from "./App.module.css";
import { dayLabel, formatDuration, formatPrice, normalizePhone } from "./format";

const steps = ["Услуга", "Барбер", "Дата", "Время", "Подтверждение"];

export function BookFlow({
  firstName,
  phoneHint,
  signedIn,
  onBooked,
}: {
  firstName: string;
  phoneHint: string;
  signedIn: boolean;
  onBooked: () => void;
}) {
  const [step, setStep] = useState(0);
  const [services, setServices] = useState<Service[] | null>(null);
  const [barbers, setBarbers] = useState<Barber[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [barberId, setBarberId] = useState<string | null>(null);
  const [days, setDays] = useState<DayItem[] | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<SlotItem[] | null>(null);
  const [startsAt, setStartsAt] = useState<string | null>(null);
  const [name, setName] = useState(firstName);
  const [phone, setPhone] = useState(phoneHint);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const service = services?.find((item) => item.id === serviceId) ?? null;
  const barber = barbers?.find((item) => item.id === barberId) ?? null;
  const eligible = service ? (barbers ?? []).filter((item) => item.services.includes(service.name)) : [];
  const selected = slots?.find((item) => item.startsAt === startsAt) ?? null;

  useEffect(() => {
    setName((current) => current || firstName);
  }, [firstName]);

  useEffect(() => {
    setPhone((current) => current || phoneHint);
  }, [phoneHint]);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      api<{ services: Service[] }>("/api/v1/services"),
      api<{ barbers: Barber[] }>("/api/v1/barbers"),
    ])
      .then(([serviceBody, barberBody]) => {
        if (cancelled) {
          return;
        }
        setServices(serviceBody.services);
        setBarbers(barberBody.barbers);
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError("Не удалось загрузить услуги. Проверьте, что API запущен.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!serviceId || !barberId) {
      return;
    }
    let cancelled = false;
    setDays(null);
    const params = new URLSearchParams({ serviceIds: serviceId, barberId });
    void api<{ days: DayItem[] }>(`/api/v1/availability/days?${params}`)
      .then((body) => {
        if (!cancelled) {
          setDays(body.days);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Не удалось загрузить дни");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [serviceId, barberId]);

  async function loadSlots(nextDate: string, nextService = serviceId, nextBarber = barberId) {
    if (!nextService || !nextBarber) {
      return;
    }
    setDate(nextDate);
    setStartsAt(null);
    setSlots(null);
    setError(null);
    const params = new URLSearchParams({ serviceIds: nextService, barberId: nextBarber, date: nextDate });
    try {
      const body = await api<{ slots: SlotItem[] }>(`/api/v1/availability?${params}`);
      setSlots(body.slots);
    } catch {
      setError("Не удалось загрузить свободное время");
    }
  }

  async function submit() {
    if (!signedIn) {
      setError("Откройте Полосу из Telegram, чтобы сохранить запись.");
      return;
    }
    const phoneValue = normalizePhone(phone);
    if (!serviceId || !barberId || !startsAt || name.trim().length < 2 || !phoneValue) {
      setError("Укажите имя и телефон");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api("/api/v1/bookings", {
        method: "POST",
        body: JSON.stringify({
          serviceIds: [serviceId],
          barberId,
          startsAt,
          client: { name: name.trim(), phone: phoneValue },
        }),
      });
      onBooked();
    } catch (reason) {
      if (reason instanceof ApiRequestError && reason.code === "SLOT_TAKEN") {
        setStartsAt(null);
        if (date) {
          await loadSlots(date);
        }
        setError(reason.message);
        setStep(3);
        return;
      }
      setError(reason instanceof ApiRequestError ? reason.message : "Не удалось сохранить запись");
    } finally {
      setBusy(false);
    }
  }

  if (loadError) {
    return <p className={styles.error}>{loadError}</p>;
  }
  if (!services || !barbers) {
    return <p className={styles.muted}>Загружаем услуги</p>;
  }

  return (
    <section className={styles.panel}>
      <ol className={styles.steps}>
        {steps.map((label, index) => (
          <li key={label}>
            <button
              type="button"
              className={index === step ? styles.stepCurrent : undefined}
              disabled={index > step}
              onClick={() => setStep(index)}
            >
              {label}
            </button>
          </li>
        ))}
      </ol>
      <h2>{steps[step]}</h2>
      {error ? <p className={styles.error}>{error}</p> : null}
      {step === 0 ? (
        <div className={styles.options} role="radiogroup" aria-label="Услуга">
          {services.map((item) => (
            <button
              key={item.id}
              type="button"
              role="radio"
              aria-checked={serviceId === item.id}
              className={styles.choice}
              onClick={() => {
                setServiceId(item.id);
                if (barberId && barberId !== "any" && !barbers.find((barberItem) => barberItem.id === barberId)?.services.includes(item.name)) {
                  setBarberId(null);
                }
                setStep(1);
              }}
            >
              <strong>{item.name}</strong>
              <span>{item.description}</span>
              <span className={styles.price}>
                {formatDuration(item.durationMin)} · {formatPrice(item.price)}
              </span>
            </button>
          ))}
        </div>
      ) : null}
      {step === 1 ? (
        <div className={styles.options} role="radiogroup" aria-label="Барбер">
          <button
            type="button"
            role="radio"
            aria-checked={barberId === "any"}
            className={styles.choice}
            onClick={() => {
              setBarberId("any");
              setStep(2);
            }}
          >
            <strong>Любой свободный</strong>
            <span>Поставим мастера, который делает эту услугу</span>
          </button>
          {eligible.map((item) => (
            <button
              key={item.id}
              type="button"
              role="radio"
              aria-checked={barberId === item.id}
              className={styles.choice}
              onClick={() => {
                setBarberId(item.id);
                setStep(2);
              }}
            >
              <strong>{item.name}</strong>
              <span>
                {item.experienceYears} лет · {item.bio}
              </span>
            </button>
          ))}
        </div>
      ) : null}
      {step === 2 ? (
        days === null ? (
          <p className={styles.muted}>Загружаем дни</p>
        ) : (
          <div className={styles.dates} role="radiogroup" aria-label="Дата">
            {days.map((item) => {
              const parts = dayLabel(item.date);
              return (
                <button
                  key={item.date}
                  type="button"
                  role="radio"
                  aria-checked={date === item.date}
                  className={item.open ? styles.date : `${styles.date} ${styles.closed}`}
                  onClick={() => {
                    void loadSlots(item.date);
                    setStep(3);
                  }}
                >
                  <span>{parts.weekday}</span>
                  <strong>{parts.date}</strong>
                  <span>{parts.month}</span>
                </button>
              );
            })}
          </div>
        )
      ) : null}
      {step === 3 ? (
        slots === null ? (
          <p className={styles.muted}>Загружаем свободное время</p>
        ) : slots.length === 0 ? (
          <p className={styles.muted}>На этот день свободных окон нет. Выберите другую дату.</p>
        ) : (
          <div className={styles.times} role="radiogroup" aria-label="Время">
            {slots.map((slot) => (
              <button
                key={slot.startsAt}
                type="button"
                role="radio"
                aria-checked={startsAt === slot.startsAt}
                className={styles.time}
                onClick={() => {
                  setStartsAt(slot.startsAt);
                  setError(null);
                  setStep(4);
                }}
              >
                {slot.label}
              </button>
            ))}
          </div>
        )
      ) : null}
      {step === 4 && service ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <dl className={styles.summary}>
            <div>
              <dt>Услуга</dt>
              <dd>{service.name}</dd>
            </div>
            <div>
              <dt>Барбер</dt>
              <dd>{barberId === "any" ? "Любой свободный" : barber?.name}</dd>
            </div>
            <div>
              <dt>Когда</dt>
              <dd>
                {date ? dayLabel(date).full : "—"}, {selected?.label ?? "—"}
              </dd>
            </div>
          </dl>
          <div className={styles.options}>
            <label className={styles.field}>
              Имя
              <input value={name} autoComplete="name" onChange={(event) => setName(event.target.value)} />
            </label>
            <label className={styles.field}>
              Телефон
              <input
                value={phone}
                inputMode="tel"
                autoComplete="tel"
                placeholder="+998 90 123 45 67"
                onChange={(event) => setPhone(event.target.value)}
              />
            </label>
          </div>
          <div className={styles.actions}>
            <button type="submit" className={styles.primary} disabled={busy}>
              {busy ? "Записываем" : "Записать"}
            </button>
            <button type="button" className={styles.secondary} onClick={() => setStep(3)}>
              Другое время
            </button>
          </div>
        </form>
      ) : null}
    </section>
  );
}
