"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/adminApi";
import styles from "./Admin.module.css";

const links = [
  ["", "Сегодня"],
  ["bookings", "Записи"],
  ["barbers", "Барберы"],
  ["services", "Услуги"],
  ["schedule", "График"],
  ["time-off", "Исключения"],
  ["reviews", "Отзывы"],
  ["analytics", "Аналитика"],
  ["settings", "Настройки"],
] as const;

export function Desk({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    adminFetch("/api/v1/admin/session")
      .then(() => setReady(true))
      .catch(() => undefined);
  }, []);

  async function logout() {
    await adminFetch("/api/v1/admin/logout", { method: "POST" });
    router.push("/admin/login");
  }

  if (!ready) {
    return (
      <main id="content" className={styles.login}>
        <p className={styles.note}>Открываем админку…</p>
      </main>
    );
  }

  return (
    <div className={styles.shell}>
      <nav className={styles.nav} aria-label="Разделы админки">
        {links.map(([href, label]) => {
          const path = href ? `/admin/${href}` : "/admin";
          return (
            <Link key={path} href={path} aria-current={pathname === path ? "page" : undefined}>
              {label}
            </Link>
          );
        })}
        <button className={styles.logout} type="button" onClick={() => void logout()}>
          Выйти
        </button>
      </nav>
      <main id="content" className={styles.main}>
        {children}
      </main>
    </div>
  );
}
