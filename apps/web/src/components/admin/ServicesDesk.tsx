"use client";

import { useEffect, useState } from "react";
import { AdminError, adminFetch } from "@/lib/adminApi";
import { formatDuration, formatPrice } from "@/lib/format";
import styles from "./Admin.module.css";

type Service = {
  id: string;
  name: string;
  description: string;
  durationMin: number;
  price: number;
  isActive: boolean;
  sortOrder: number;
};

const empty = { id: "", name: "", description: "", durationMin: "45", price: "80000", sortOrder: "10" };

export function ServicesDesk() {
  const [services, setServices] = useState<Service[]>([]);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");

  async function load() {
    const body = await adminFetch<{ services: Service[] }>("/api/v1/admin/services");
    setServices(body.services);
  }

  useEffect(() => {
    void load().catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Ошибка"));
  }, []);

  async function create(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await adminFetch("/api/v1/admin/services", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          durationMin: Number(form.durationMin),
          price: Number(form.price),
          sortOrder: Number(form.sortOrder),
        }),
      });
      setForm(empty);
      await load();
    } catch (reason) {
      setError(reason instanceof AdminError ? reason.message : "Не удалось сохранить услугу");
    }
  }

  async function save(service: Service) {
    setError("");
    try {
      await adminFetch(`/api/v1/admin/services/${service.id}`, {
        method: "PATCH",
        body: JSON.stringify(service),
      });
      await load();
    } catch (reason) {
      setError(reason instanceof AdminError ? reason.message : "Не удалось обновить услугу");
    }
  }

  async function remove(id: string) {
    setError("");
    try {
      const body = await adminFetch<{ archived: boolean }>(`/api/v1/admin/services/${id}`, { method: "DELETE" });
      if (body.archived) {
        setError("Услуга уже была в записях, поэтому она скрыта, а не удалена.");
      }
      await load();
    } catch (reason) {
      setError(reason instanceof AdminError ? reason.message : "Не удалось удалить услугу");
    }
  }

  return (
    <>
      <h1>Услуги</h1>
      {error ? <p className={styles.error}>{error}</p> : null}
      <ul className={styles.list}>
        {services.map((service) => (
          <li key={service.id} className={styles.item}>
            <strong>
              {service.name} {service.isActive ? "" : "· скрыта"}
            </strong>
            <span>
              {formatDuration(service.durationMin)} · {formatPrice(service.price)}
            </span>
            <div className={styles.grid}>
              <label className={styles.field}>
                Название
                <input value={service.name} onChange={(event) => setServices(services.map((item) => (item.id === service.id ? { ...item, name: event.target.value } : item)))} />
              </label>
              <label className={styles.field}>
                Цена
                <input
                  inputMode="numeric"
                  value={service.price}
                  onChange={(event) =>
                    setServices(services.map((item) => (item.id === service.id ? { ...item, price: Number(event.target.value) } : item)))
                  }
                />
              </label>
            </div>
            <div className={styles.actions}>
              <button className="cta" type="button" onClick={() => void save(service)}>
                Сохранить
              </button>
              <button className="ctaSecondary" type="button" onClick={() => void remove(service.id)}>
                Удалить
              </button>
            </div>
          </li>
        ))}
      </ul>
      <form className={styles.form} onSubmit={(event) => void create(event)}>
        <h2>Новая услуга</h2>
        <label className={styles.field}>
          Код
          <input value={form.id} placeholder="fade" onChange={(event) => setForm({ ...form, id: event.target.value })} />
        </label>
        <label className={styles.field}>
          Название
          <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        </label>
        <label className={styles.field}>
          Описание
          <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
        </label>
        <label className={styles.field}>
          Минуты
          <input value={form.durationMin} onChange={(event) => setForm({ ...form, durationMin: event.target.value })} />
        </label>
        <label className={styles.field}>
          Цена, сум
          <input value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} />
        </label>
        <button className="cta" type="submit">
          Добавить
        </button>
      </form>
    </>
  );
}
