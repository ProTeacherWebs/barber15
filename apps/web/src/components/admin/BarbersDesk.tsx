"use client";

import { useEffect, useState } from "react";
import { AdminError, adminFetch, uploadPhoto } from "@/lib/adminApi";
import styles from "./Admin.module.css";

type Service = { id: string; name: string; isActive: boolean };
type Portfolio = { id: string; imageUrl: string };
type Barber = {
  id: string;
  name: string;
  photoUrl: string;
  bio: string;
  experienceYears: number;
  isActive: boolean;
  sortOrder: number;
  serviceIds: string[];
  portfolio: Portfolio[];
};

const empty = { id: "", name: "", photoUrl: "", bio: "", experienceYears: "1", sortOrder: "10", serviceIds: [] as string[] };

export function BarbersDesk() {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");

  async function load() {
    const [barberBody, serviceBody] = await Promise.all([
      adminFetch<{ barbers: Barber[] }>("/api/v1/admin/barbers"),
      adminFetch<{ services: Service[] }>("/api/v1/admin/services"),
    ]);
    setBarbers(barberBody.barbers);
    setServices(serviceBody.services.filter((service) => service.isActive));
  }

  useEffect(() => {
    void load().catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Ошибка"));
  }, []);

  function update(id: string, patch: Partial<Barber>) {
    setBarbers(barbers.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  async function save(barber: Barber) {
    setError("");
    try {
      await adminFetch(`/api/v1/admin/barbers/${barber.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: barber.name,
          photoUrl: barber.photoUrl,
          bio: barber.bio,
          experienceYears: barber.experienceYears,
          sortOrder: barber.sortOrder,
          isActive: barber.isActive,
          serviceIds: barber.serviceIds,
        }),
      });
      await load();
    } catch (reason) {
      setError(reason instanceof AdminError ? reason.message : "Не удалось сохранить барбера");
    }
  }

  async function create(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await adminFetch("/api/v1/admin/barbers", {
        method: "POST",
        body: JSON.stringify({ ...form, experienceYears: Number(form.experienceYears), sortOrder: Number(form.sortOrder) }),
      });
      setForm(empty);
      await load();
    } catch (reason) {
      setError(reason instanceof AdminError ? reason.message : "Не удалось добавить барбера");
    }
  }

  async function onPhoto(id: string, file: File | undefined, fresh = false) {
    if (!file) return;
    setError("");
    try {
      const url = await uploadPhoto(file);
      if (fresh) {
        setForm({ ...form, photoUrl: url });
      } else {
        update(id, { photoUrl: url });
      }
    } catch (reason) {
      setError(reason instanceof AdminError ? reason.message : "Не удалось загрузить фото");
    }
  }

  async function addShot(barberId: string, file: File | undefined) {
    if (!file) return;
    setError("");
    try {
      const imageUrl = await uploadPhoto(file);
      await adminFetch(`/api/v1/admin/barbers/${barberId}/portfolio`, {
        method: "POST",
        body: JSON.stringify({ imageUrl }),
      });
      await load();
    } catch (reason) {
      setError(reason instanceof AdminError ? reason.message : "Не удалось добавить снимок");
    }
  }

  async function remove(id: string) {
    setError("");
    try {
      const body = await adminFetch<{ archived: boolean }>(`/api/v1/admin/barbers/${id}`, { method: "DELETE" });
      if (body.archived) setError("У барбера есть записи, поэтому он скрыт, а не удалён.");
      await load();
    } catch (reason) {
      setError(reason instanceof AdminError ? reason.message : "Не удалось удалить барбера");
    }
  }

  return (
    <>
      <h1>Барберы</h1>
      <p className={styles.note}>Фото и портфолио сохраняются в хранилище Supabase.</p>
      {error ? <p className={styles.error}>{error}</p> : null}
      <ul className={styles.list}>
        {barbers.map((barber) => (
          <li key={barber.id} className={styles.item}>
            <img className={styles.photo} src={barber.photoUrl} alt="" />
            <strong>
              {barber.name} {barber.isActive ? "" : "· скрыт"}
            </strong>
            <label className={styles.field}>
              Имя
              <input value={barber.name} onChange={(event) => update(barber.id, { name: event.target.value })} />
            </label>
            <label className={styles.field}>
              О себе
              <textarea value={barber.bio} onChange={(event) => update(barber.id, { bio: event.target.value })} />
            </label>
            <label className={styles.field}>
              Фото
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void onPhoto(barber.id, event.target.files?.[0])} />
            </label>
            <div className={styles.checks}>
              {services.map((service) => (
                <label key={service.id}>
                  <input
                    type="checkbox"
                    checked={barber.serviceIds.includes(service.id)}
                    onChange={(event) => {
                      const serviceIds = event.target.checked
                        ? [...barber.serviceIds, service.id]
                        : barber.serviceIds.filter((id) => id !== service.id);
                      update(barber.id, { serviceIds });
                    }}
                  />
                  {service.name}
                </label>
              ))}
            </div>
            <div className={styles.portfolio}>
              {barber.portfolio.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => void adminFetch(`/api/v1/admin/barbers/${barber.id}/portfolio/${item.id}`, { method: "DELETE" }).then(load)}
                >
                  <img src={item.imageUrl} alt="Удалить снимок" />
                </button>
              ))}
            </div>
            <label className={styles.field}>
              Снимок в портфолио
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void addShot(barber.id, event.target.files?.[0])} />
            </label>
            <div className={styles.actions}>
              <button className="cta" type="button" onClick={() => void save(barber)}>
                Сохранить
              </button>
              <button className="ctaSecondary" type="button" onClick={() => void remove(barber.id)}>
                Удалить
              </button>
            </div>
          </li>
        ))}
      </ul>
      <form className={styles.form} onSubmit={(event) => void create(event)}>
        <h2>Новый барбер</h2>
        <label className={styles.field}>
          Код
          <input value={form.id} onChange={(event) => setForm({ ...form, id: event.target.value })} />
        </label>
        <label className={styles.field}>
          Имя
          <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        </label>
        <label className={styles.field}>
          Фото
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void onPhoto("", event.target.files?.[0], true)} />
        </label>
        <label className={styles.field}>
          О себе
          <textarea value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} />
        </label>
        <button className="cta" type="submit" disabled={!form.photoUrl}>
          Добавить
        </button>
      </form>
    </>
  );
}
