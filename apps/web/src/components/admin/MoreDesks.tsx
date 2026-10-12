"use client";

import { useEffect, useState } from "react";
import { AdminError, adminFetch } from "@/lib/adminApi";
import styles from "./Admin.module.css";

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  isPublic: boolean;
  createdAt: string;
  clientName: string;
  barberName: string;
};

const settingFields = [
  ["cancel_cutoff_min", "За сколько минут уже нельзя отменить"],
  ["slot_step_min", "Шаг слота, минуты"],
  ["booking_horizon_days", "На сколько дней вперёд открыта запись"],
  ["min_notice_min", "Минимальное время до визита, минуты"],
  ["reminder_day_minutes", "Напоминание за день, минуты"],
  ["reminder_short_minutes", "Короткое напоминание, минуты"],
  ["review_delay_min", "Пауза перед просьбой об отзыве, минуты"],
  ["review_public_min_rating", "Оценка, с которой отзыв можно показать"],
  ["timezone", "Часовой пояс"],
] as const;

export function ReviewsDesk() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [error, setError] = useState("");

  async function load() {
    const body = await adminFetch<{ reviews: Review[] }>("/api/v1/admin/reviews");
    setReviews(body.reviews);
  }

  useEffect(() => {
    void load().catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Ошибка"));
  }, []);

  async function publish(id: string, isPublic: boolean) {
    setError("");
    try {
      const body = await adminFetch<{ reviews: Review[] }>(`/api/v1/admin/reviews/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ isPublic }),
      });
      setReviews(body.reviews);
    } catch (reason) {
      setError(reason instanceof AdminError ? reason.message : "Не удалось обновить отзыв");
    }
  }

  return (
    <>
      <h1>Отзывы</h1>
      {error ? <p className={styles.error}>{error}</p> : null}
      <ul className={styles.list}>
        {reviews.length === 0 ? <li className={styles.note}>Отзывов пока нет.</li> : null}
        {reviews.map((review) => (
          <li key={review.id} className={styles.item}>
            <strong>
              {review.rating} из 5 · {review.clientName}
            </strong>
            <span>
              {review.barberName}
              {review.comment ? ` · ${review.comment}` : ""}
            </span>
            <label className={styles.checks}>
              <input type="checkbox" checked={review.isPublic} onChange={(event) => void publish(review.id, event.target.checked)} />
              Показывать на сайте
            </label>
          </li>
        ))}
      </ul>
    </>
  );
}

export function SettingsDesk() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");

  useEffect(() => {
    adminFetch<{ settings: Record<string, string> }>("/api/v1/admin/settings")
      .then((body) => setValues(body.settings))
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Ошибка"));
  }, []);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSaved("");
    try {
      const body = await adminFetch<{ settings: Record<string, string> }>("/api/v1/admin/settings", {
        method: "PUT",
        body: JSON.stringify(values),
      });
      setValues(body.settings);
      setSaved("Настройки сохранены.");
    } catch (reason) {
      setError(reason instanceof AdminError ? reason.message : "Не удалось сохранить настройки");
    }
  }

  return (
    <>
      <h1>Настройки</h1>
      <form className={styles.form} onSubmit={(event) => void save(event)}>
        {settingFields.map(([key, label]) => (
          <label key={key} className={styles.field}>
            {label}
            <input value={values[key] ?? ""} onChange={(event) => setValues({ ...values, [key]: event.target.value })} />
          </label>
        ))}
        {error ? <p className={styles.error}>{error}</p> : null}
        {saved ? <p className={styles.note}>{saved}</p> : null}
        <button className="cta" type="submit">
          Сохранить
        </button>
      </form>
    </>
  );
}
