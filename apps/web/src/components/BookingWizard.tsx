"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { bookingSteps } from "@/data/mock";
import type { Barber, Service } from "@/lib/catalog";
import { formatDuration, formatPrice } from "@/lib/format";
import { formatPhone, normalizePhone } from "@/lib/phone";
import { dayParts } from "@/lib/slots";
import styles from "./BookingWizard.module.css";

const ANY_BARBER = "any";

type SlotItem = { label: string; startsAt: string };

type SlotState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; list: SlotItem[] }
  | { status: "empty" }
  | { status: "error" };

type DayItem = { date: string; open: boolean };

type DaysState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; list: DayItem[] };

export function BookingWizard({
  services,
  barbers,
}: {
  services: Service[];
  barbers: Barber[];
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [barberId, setBarberId] = useState<string | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [nameTouched, setNameTouched] = useState(false);
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [slots, setSlots] = useState<SlotState>({ status: "idle" });
  const [days, setDays] = useState<DaysState>({ status: "idle" });
  const [daysAttempt, setDaysAttempt] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const requestId = useRef(0);
  const daysRequest = useRef(0);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const service = services.find((item) => item.id === serviceId) ?? null;
  const barber = barbers.find((item) => item.id === barberId) ?? null;
  const availableBarbers = service
    ? barbers.filter((item) => item.services.includes(service.name))
    : barbers;
  const phoneValue = normalizePhone(phone);
  const nameOk = name.trim().length >= 2;
  const nameError = nameTouched && !nameOk ? "Укажите имя" : null;
  const phoneError = phoneTouched && !phoneValue ? "Введите номер: +998 90 123 45 67" : null;
  const selectedSlot = slots.status === "ready" ? slots.list.find((item) => item.startsAt === time) : undefined;

  function focusHeading() {
    queueMicrotask(() => headingRef.current?.focus());
  }

  function goTo(next: number) {
    setStep(next);
    focusHeading();
  }

  useEffect(() => {
    if (!serviceId || !barberId) {
      setDays({ status: "idle" });
      return;
    }
    const token = daysRequest.current + 1;
    daysRequest.current = token;
    const params = new URLSearchParams({ serviceIds: serviceId, barberId });
    setDays({ status: "loading" });
    void fetch(`/api/v1/availability/days?${params}`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("days");
        }
        return (await response.json()) as { days: DayItem[] };
      })
      .then((body) => {
        if (daysRequest.current !== token) {
          return;
        }
        setDays({ status: "ready", list: body.days });
      })
      .catch(() => {
        if (daysRequest.current !== token) {
          return;
        }
        setDays({ status: "error" });
      });
  }, [serviceId, barberId, daysAttempt]);

  function chooseService(id: string) {
    const next = services.find((item) => item.id === id);
    setServiceId(id);
    if (barberId && barberId !== ANY_BARBER && next) {
      const current = barbers.find((item) => item.id === barberId);
      if (!current || !current.services.includes(next.name)) {
        setBarberId(null);
        setDate(null);
        setTime(null);
        setSlots({ status: "idle" });
        if (step > 1) {
          goTo(1);
        }
      }
    }
  }

  function chooseBarber(id: string) {
    setBarberId(id);
    setTime(null);
    if (date && serviceId) {
      void requestSlots(date, serviceId, id);
    }
  }

  async function requestSlots(nextDate: string, nextService = serviceId, nextBarber = barberId) {
    if (!nextService || !nextBarber) {
      return;
    }
    const token = requestId.current + 1;
    requestId.current = token;
    setSlots({ status: "loading" });
    try {
      const params = new URLSearchParams({
        serviceIds: nextService,
        barberId: nextBarber,
        date: nextDate,
      });
      const response = await fetch(`/api/v1/availability?${params}`);
      if (!response.ok) {
        throw new Error("slots");
      }
      const body = (await response.json()) as { slots: SlotItem[] };
      if (requestId.current !== token) {
        return;
      }
      setTime((current) => (body.slots.some((item) => item.startsAt === current) ? current : null));
      setSlots(body.slots.length > 0 ? { status: "ready", list: body.slots } : { status: "empty" });
    } catch {
      if (requestId.current !== token) {
        return;
      }
      setSlots({ status: "error" });
    }
  }

  function chooseDate(next: string) {
    setDate(next);
    setTime(null);
    void requestSlots(next);
  }

  function canLeave(index: number): boolean {
    if (index === 0) {
      return serviceId !== null;
    }
    if (index === 1) {
      return barberId !== null;
    }
    if (index === 2) {
      return date !== null;
    }
    if (index === 3) {
      return selectedSlot !== undefined;
    }
    if (index === 4) {
      return nameOk && phoneValue !== null;
    }
    return false;
  }

  function furthest(): number {
    if (step === 5) {
      return 5;
    }
    if (!serviceId) {
      return 0;
    }
    if (!barberId) {
      return 1;
    }
    if (!date) {
      return 2;
    }
    if (!selectedSlot) {
      return 3;
    }
    return 4;
  }

  function openStep(index: number) {
    if (index > furthest()) {
      return;
    }
    goTo(index);
  }

  function nextStep() {
    if (step === 4) {
      setNameTouched(true);
      setPhoneTouched(true);
      if (!nameOk || !phoneValue) {
        return;
      }
      goTo(5);
      return;
    }
    if (!canLeave(step)) {
      return;
    }
    goTo(step + 1);
  }

  async function confirmBooking() {
    if (!serviceId || !barberId || !time || !phoneValue || !nameOk || submitting) {
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const response = await fetch("/api/v1/bookings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          serviceIds: [serviceId],
          barberId,
          startsAt: time,
          client: { name: name.trim(), phone: phoneValue },
        }),
      });
      const body = (await response.json().catch(() => null)) as {
        code?: string;
        message?: string;
        booking?: { manageToken?: string };
      } | null;
      if (response.status === 201 && body?.booking?.manageToken) {
        router.push(`/booking/${body.booking.manageToken}`);
        return;
      }
      if (body?.code === "SLOT_TAKEN") {
        setSubmitError(body.message ?? "Это время уже заняли. Выберите другое.");
        setTime(null);
        if (date) {
          void requestSlots(date);
        }
        goTo(3);
        return;
      }
      setSubmitError(body?.message ?? "Не удалось сохранить запись");
    } catch {
      setSubmitError("Не удалось сохранить запись");
    } finally {
      setSubmitting(false);
    }
  }

  const limit = furthest();

  return (
    <div className="wrap">
      <h1>Записаться</h1>
      <p className={styles.lead}>Услуга, мастер и свободное время. Запись сразу попадает в расписание.</p>
      <ol className={styles.progress}>
        {bookingSteps.map((label, index) => (
          <li key={label}>
            <button
              type="button"
              className={index === step ? styles.progressCurrent : styles.progressButton}
              aria-current={index === step ? "step" : undefined}
              disabled={index > limit}
              onClick={() => openStep(index)}
            >
              <span>{index + 1}</span>
              {label}
            </button>
          </li>
        ))}
      </ol>
      <div className={styles.layout}>
        <div className={styles.panel}>
          <h2 id="book-step" ref={headingRef} tabIndex={-1}>
            {step === 5 ? "Проверьте запись" : bookingSteps[step]}
          </h2>
          {step === 0 ? (
            <div className={styles.options} role="radiogroup" aria-labelledby="book-step">
              {services.map((item) => (
                <ServiceOption
                  key={item.id}
                  service={item}
                  checked={serviceId === item.id}
                  onChange={() => chooseService(item.id)}
                />
              ))}
            </div>
          ) : null}
          {step === 1 ? (
            <div className={styles.options} role="radiogroup" aria-labelledby="book-step">
              <label className={styles.choice}>
                <input
                  type="radio"
                  name="barber"
                  value={ANY_BARBER}
                  checked={barberId === ANY_BARBER}
                  onChange={() => chooseBarber(ANY_BARBER)}
                />
                <span className={styles.choiceMain}>
                  <span className={styles.choiceTitle}>Любой свободный</span>
                  <span className={styles.choiceNote}>Поставим мастера, который делает эту услугу</span>
                </span>
              </label>
              {availableBarbers.map((item) => (
                <BarberOption
                  key={item.id}
                  barber={item}
                  checked={barberId === item.id}
                  onChange={() => chooseBarber(item.id)}
                />
              ))}
            </div>
          ) : null}
          {step === 2 ? (
            <DateStep
              days={days}
              date={date}
              onSelect={chooseDate}
              onRetry={() => setDaysAttempt((value) => value + 1)}
            />
          ) : null}
          {step === 3 ? (
            <>
              {submitError ? (
                <p className={styles.fieldError} role="alert">
                  {submitError}
                </p>
              ) : null}
              <SlotStep
                slots={slots}
                time={time}
                onSelect={(value) => {
                  setSubmitError(null);
                  setTime(value);
                }}
                onRetry={() => date && void requestSlots(date)}
              />
            </>
          ) : null}
          {step === 4 ? (
            <div className={styles.fields}>
              <label className={styles.field}>
                <span>Имя</span>
                <input
                  name="name"
                  autoComplete="name"
                  value={name}
                  aria-invalid={nameError ? true : undefined}
                  aria-describedby={nameError ? "name-error" : undefined}
                  onBlur={() => setNameTouched(true)}
                  onChange={(event) => setName(event.target.value)}
                />
                {nameError ? (
                  <span id="name-error" className={styles.fieldError}>
                    {nameError}
                  </span>
                ) : null}
              </label>
              <label className={styles.field}>
                <span>Телефон</span>
                <input
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="+998 90 123 45 67"
                  value={phone}
                  aria-invalid={phoneError ? true : undefined}
                  aria-describedby={phoneError ? "phone-error" : undefined}
                  onBlur={() => setPhoneTouched(true)}
                  onChange={(event) => setPhone(event.target.value)}
                />
                {phoneError ? (
                  <span id="phone-error" className={styles.fieldError}>
                    {phoneError}
                  </span>
                ) : null}
              </label>
            </div>
          ) : null}
          {step === 5 ? (
            <div className={styles.done}>
              <p>Проверьте время и подтвердите. После этого запись появится в расписании.</p>
              {submitError ? (
                <p className={styles.fieldError} role="alert">
                  {submitError}
                </p>
              ) : null}
              <div className={styles.actions}>
                <button type="button" className="cta" disabled={submitting} onClick={() => void confirmBooking()}>
                  {submitting ? "Записываем" : "Записать"}
                </button>
                <button type="button" className="ctaSecondary" onClick={() => goTo(4)} disabled={submitting}>
                  Изменить
                </button>
              </div>
            </div>
          ) : null}
          {step < 5 ? (
            <div className={styles.nav}>
              {step > 0 ? (
                <button type="button" className="ctaSecondary" onClick={() => goTo(step - 1)}>
                  Назад
                </button>
              ) : null}
              <button
                type="button"
                className={`cta ${styles.next}`}
                disabled={step < 4 && !canLeave(step)}
                onClick={nextStep}
              >
                {step === 4 ? "Подтвердить" : "Дальше"}
              </button>
            </div>
          ) : null}
        </div>
        <aside className={styles.summary} aria-label="Выбранная запись">
          <p className={styles.summaryTitle}>Ваша запись</p>
          <dl>
            <div>
              <dt>Услуга</dt>
              <dd>{service ? service.name : "—"}</dd>
            </div>
            <div>
              <dt>Время визита</dt>
              <dd>{service ? `${formatDuration(service.durationMin)} · ${formatPrice(service.price)}` : "—"}</dd>
            </div>
            <div>
              <dt>Барбер</dt>
              <dd>{barberId === ANY_BARBER ? "Любой свободный" : barber ? barber.name : "—"}</dd>
            </div>
            <div>
              <dt>Дата</dt>
              <dd>{date ? dayParts(date).label : "—"}</dd>
            </div>
            <div>
              <dt>Начало</dt>
              <dd>{selectedSlot ? selectedSlot.label : "—"}</dd>
            </div>
            <div>
              <dt>Гость</dt>
              <dd>{name.trim() && phoneValue ? `${name.trim()}, ${formatPhone(phone)}` : "—"}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </div>
  );
}

function ServiceOption({
  service,
  checked,
  onChange,
}: {
  service: Service;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className={`${styles.choice} ${styles.serviceChoice}`}>
      <input type="radio" name="service" value={service.id} checked={checked} onChange={onChange} />
      <span className={styles.choiceMain}>
        <span className={styles.choiceTitle}>{service.name}</span>
        <span className={styles.choiceNote}>{service.description}</span>
      </span>
      <span className={styles.choiceMeta}>
        <span>{formatDuration(service.durationMin)}</span>
        <span>{formatPrice(service.price)}</span>
      </span>
    </label>
  );
}

function BarberOption({
  barber,
  checked,
  onChange,
}: {
  barber: Barber;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className={`${styles.choice} ${styles.barberChoice}`}>
      <input type="radio" name="barber" value={barber.id} checked={checked} onChange={onChange} />
      <span className={styles.mark}>
        <Image className={styles.portrait} src={barber.photo} alt="" fill sizes="52px" />
      </span>
      <span className={styles.choiceMain}>
        <span className={styles.choiceTitle}>{barber.name}</span>
        <span className={styles.choiceNote}>
          {barber.experienceYears} лет · {barber.bio}
        </span>
      </span>
    </label>
  );
}

function DateStep({
  days,
  date,
  onSelect,
  onRetry,
}: {
  days: DaysState;
  date: string | null;
  onSelect: (value: string) => void;
  onRetry: () => void;
}) {
  if (days.status === "idle" || days.status === "loading") {
    return (
      <div className={styles.skeleton} role="status" aria-label="Загружаем дни">
        <span />
        <span />
        <span />
      </div>
    );
  }

  if (days.status === "error") {
    return (
      <div className={styles.status} role="alert">
        <p>Не удалось загрузить календарь.</p>
        <button type="button" className="ctaSecondary" onClick={onRetry}>
          Повторить
        </button>
      </div>
    );
  }

  return (
    <div className={styles.dates} role="radiogroup" aria-labelledby="book-step">
      {days.list.map((item) => {
        const parts = dayParts(item.date);
        return (
          <label key={item.date} className={item.open ? styles.date : `${styles.date} ${styles.dateClosed}`}>
            <input
              type="radio"
              name="date"
              value={item.date}
              checked={date === item.date}
              onChange={() => onSelect(item.date)}
            />
            <span>{parts.weekday}</span>
            <strong>{parts.date}</strong>
            <span>{parts.month}</span>
          </label>
        );
      })}
    </div>
  );
}

function SlotStep({
  slots,
  time,
  onSelect,
  onRetry,
}: {
  slots: SlotState;
  time: string | null;
  onSelect: (value: string) => void;
  onRetry: () => void;
}) {
  if (slots.status === "idle" || slots.status === "loading") {
    return (
      <div className={styles.skeleton} role="status" aria-label="Загружаем свободное время">
        <span />
        <span />
        <span />
      </div>
    );
  }

  if (slots.status === "empty") {
    return (
      <p className={styles.status} role="status">
        На этот день свободных окон нет. Выберите другую дату.
      </p>
    );
  }

  if (slots.status === "error") {
    return (
      <div className={styles.status} role="alert">
        <p>Не удалось загрузить свободное время.</p>
        <button type="button" className="ctaSecondary" onClick={onRetry}>
          Повторить
        </button>
      </div>
    );
  }

  return (
    <div className={styles.times} role="radiogroup" aria-labelledby="book-step">
      {slots.list.map((slot) => (
        <label key={slot.startsAt} className={styles.time}>
          <input
            type="radio"
            name="time"
            value={slot.startsAt}
            checked={time === slot.startsAt}
            onChange={() => onSelect(slot.startsAt)}
          />
          {slot.label}
        </label>
      ))}
    </div>
  );
}
