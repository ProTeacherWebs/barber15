"use client";

import { useEffect, useState } from "react";
import { AdminError, adminFetch, weekdays } from "@/lib/adminApi";
import styles from "./Admin.module.css";

type Row = { weekday: number; start: string; end: string; breakStart: string; breakEnd: string; open: boolean };
type Barber = { id: string; name: string; hours: { weekday: number; start: string; end: string }[]; breaks: { weekday: number; start: string; end: string }[] };

function blank(): Row[] {
  return weekdays.map((_, index) => ({
    weekday: index + 1,
    start: "10:00",
    end: "21:00",
    breakStart: "",
    breakEnd: "",
    open: false,
  }));
}

export function ScheduleDesk() {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [barberId, setBarberId] = useState("");
  const [rows, setRows] = useState<Row[]>(blank());
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");

  useEffect(() => {
    adminFetch<{ barbers: Barber[] }>("/api/v1/admin/barbers")
      .then((body) => {
        setBarbers(body.barbers);
        const first = body.barbers[0];
        if (first) {
          setBarberId(first.id);
          setRows(rowsOf(first));
        }
      })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Ошибка"));
  }, []);

  function rowsOf(barber: Barber) {
    return blank().map((row) => {
      const hours = barber.hours.find((item) => item.weekday === row.weekday);
      const lunch = barber.breaks.find((item) => item.weekday === row.weekday);
      return {
        ...row,
        open: Boolean(hours),
        start: hours?.start ?? row.start,
        end: hours?.end ?? row.end,
        breakStart: lunch?.start ?? "",
        breakEnd: lunch?.end ?? "",
      };
    });
  }

  function choose(id: string) {
    setBarberId(id);
    const barber = barbers.find((item) => item.id === id);
    if (barber) setRows(rowsOf(barber));
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSaved("");
    const hours = rows.filter((row) => row.open).map(({ weekday, start, end }) => ({ weekday, start: start.slice(0, 5), end: end.slice(0, 5) }));
    const breaks = rows
      .filter((row) => row.open && row.breakStart && row.breakEnd)
      .map(({ weekday, breakStart, breakEnd }) => ({ weekday, start: breakStart.slice(0, 5), end: breakEnd.slice(0, 5) }));
    try {
      await adminFetch(`/api/v1/admin/barbers/${barberId}/schedule`, {
        method: "PUT",
        body: JSON.stringify({ hours, breaks }),
      });
      setSaved("График сохранён.");
    } catch (reason) {
      setError(reason instanceof AdminError ? reason.message : "Не удалось сохранить график");
    }
  }

  return (
    <>
      <h1>График</h1>
      <p className={styles.note}>Смена и один обед на день. Пустой обед значит, что перерыва нет.</p>
      <form className={styles.form} onSubmit={(event) => void save(event)}>
        <label className={styles.field}>
          Барбер
          <select value={barberId} onChange={(event) => choose(event.target.value)}>
            {barbers.map((barber) => (
              <option key={barber.id} value={barber.id}>
                {barber.name}
              </option>
            ))}
          </select>
        </label>
        {rows.map((row, index) => (
          <div key={row.weekday} className={styles.grid}>
            <label className={styles.checks}>
              <input
                type="checkbox"
                checked={row.open}
                onChange={(event) => setRows(rows.map((item, itemIndex) => (itemIndex === index ? { ...item, open: event.target.checked } : item)))}
              />
              {weekdays[index]}
            </label>
            <label className={styles.field}>
              С
              <input type="time" value={row.start} onChange={(event) => setRows(rows.map((item, itemIndex) => (itemIndex === index ? { ...item, start: event.target.value } : item)))} />
            </label>
            <label className={styles.field}>
              До
              <input type="time" value={row.end} onChange={(event) => setRows(rows.map((item, itemIndex) => (itemIndex === index ? { ...item, end: event.target.value } : item)))} />
            </label>
            <label className={styles.field}>
              Обед с
              <input type="time" value={row.breakStart} onChange={(event) => setRows(rows.map((item, itemIndex) => (itemIndex === index ? { ...item, breakStart: event.target.value } : item)))} />
            </label>
            <label className={styles.field}>
              Обед до
              <input type="time" value={row.breakEnd} onChange={(event) => setRows(rows.map((item, itemIndex) => (itemIndex === index ? { ...item, breakEnd: event.target.value } : item)))} />
            </label>
          </div>
        ))}
        {error ? <p className={styles.error}>{error}</p> : null}
        {saved ? <p className={styles.note}>{saved}</p> : null}
        <button className="cta" type="submit">
          Сохранить график
        </button>
      </form>
    </>
  );
}
