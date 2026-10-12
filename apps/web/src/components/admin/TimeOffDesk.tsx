"use client";

import { useEffect, useState } from "react";
import { AdminError, adminFetch } from "@/lib/adminApi";
import styles from "./Admin.module.css";

type Item = {
  id: string;
  barberId: string | null;
  barberName: string;
  startsAt: string;
  endsAt: string;
  type: string;
  note: string | null;
};

const types = [
  ["day_off", "Выходной"],
  ["vacation", "Отпуск"],
  ["sick", "Больничный"],
  ["closure", "Салон закрыт"],
] as const;

function localValue(iso: string) {
  const date = new Date(iso);
  const pad = (value: number) => value.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function TimeOffDesk() {
  const [items, setItems] = useState<Item[]>([]);
  const [barbers, setBarbers] = useState<{ id: string; name: string }[]>([]);
  const [form, setForm] = useState({ barberId: "", startsAt: "", endsAt: "", type: "day_off", note: "" });
  const [error, setError] = useState("");

  async function load() {
    const [off, people] = await Promise.all([
      adminFetch<{ items: Item[] }>("/api/v1/admin/time-off"),
      adminFetch<{ barbers: { id: string; name: string }[] }>("/api/v1/admin/barbers"),
    ]);
    setItems(off.items);
    setBarbers(people.barbers);
  }

  useEffect(() => {
    void load().catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Ошибка"));
  }, []);

  async function create(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await adminFetch("/api/v1/admin/time-off", {
        method: "POST",
        body: JSON.stringify({
          barberId: form.barberId || null,
          startsAt: new Date(form.startsAt).toISOString(),
          endsAt: new Date(form.endsAt).toISOString(),
          type: form.type,
          note: form.note || null,
        }),
      });
      setForm({ barberId: "", startsAt: "", endsAt: "", type: "day_off", note: "" });
      await load();
    } catch (reason) {
      setError(reason instanceof AdminError ? reason.message : "Не удалось добавить исключение");
    }
  }

  async function remove(id: string) {
    await adminFetch(`/api/v1/admin/time-off/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <>
      <h1>Исключения</h1>
      <p className={styles.note}>Выходной, отпуск, больничный или закрытие всего салона.</p>
      {error ? <p className={styles.error}>{error}</p> : null}
      <ul className={styles.list}>
        {items.length === 0 ? <li className={styles.note}>Исключений нет.</li> : null}
        {items.map((item) => (
          <li key={item.id} className={styles.item}>
            <strong>{item.barberName}</strong>
            <span>
              {types.find((entry) => entry[0] === item.type)?.[1] ?? item.type}
              {item.note ? ` · ${item.note}` : ""}
            </span>
            <span>
              {localValue(item.startsAt).replace("T", " ")} — {localValue(item.endsAt).replace("T", " ")}
            </span>
            <button className="ctaSecondary" type="button" onClick={() => void remove(item.id)}>
              Удалить
            </button>
          </li>
        ))}
      </ul>
      <form className={styles.form} onSubmit={(event) => void create(event)}>
        <h2>Новое исключение</h2>
        <label className={styles.field}>
          Кого касается
          <select value={form.barberId} onChange={(event) => setForm({ ...form, barberId: event.target.value })}>
            <option value="">Весь салон</option>
            {barbers.map((barber) => (
              <option key={barber.id} value={barber.id}>
                {barber.name}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          Тип
          <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>
            {types.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          Начало
          <input type="datetime-local" value={form.startsAt} onChange={(event) => setForm({ ...form, startsAt: event.target.value })} />
        </label>
        <label className={styles.field}>
          Конец
          <input type="datetime-local" value={form.endsAt} onChange={(event) => setForm({ ...form, endsAt: event.target.value })} />
        </label>
        <label className={styles.field}>
          Заметка
          <input value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} />
        </label>
        <button className="cta" type="submit">
          Добавить
        </button>
      </form>
    </>
  );
}
