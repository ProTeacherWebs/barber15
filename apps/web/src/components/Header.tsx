"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { shop } from "@/data/mock";
import styles from "./Header.module.css";

const links = [
  { href: "/#services", label: "Услуги" },
  { href: "/#barbers", label: "Барберы" },
  { href: "/#reviews", label: "Отзывы" },
  { href: "/#contacts", label: "Контакты" },
];

export function Header() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function toggleTheme() {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    localStorage.setItem("polosa-theme", next);
  }

  return (
    <header className={styles.header}>
      <div className={`wrap ${styles.bar}`}>
        <Link href="/" className={styles.logo} transitionTypes={["nav-back"]}>
          {shop.name}
        </Link>
        <div className={styles.tools}>
          <button
            type="button"
            className={styles.menu}
            aria-expanded={open}
            aria-controls="site-nav"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? "Закрыть" : "Меню"}
          </button>
          <button
            type="button"
            className={styles.theme}
            onClick={toggleTheme}
            aria-label="Переключить тему"
          >
            Тема
          </button>
        </div>
        <nav id="site-nav" className={open ? `${styles.nav} ${styles.open}` : styles.nav}>
          {links.map((link) => (
            <Link key={link.href} href={link.href} className={styles.link} onClick={() => setOpen(false)}>
              {link.label}
            </Link>
          ))}
          <Link
            href="/book"
            className={`cta ${styles.book}`}
            transitionTypes={["nav-forward"]}
            onClick={() => setOpen(false)}
          >
            Записаться
          </Link>
        </nav>
      </div>
    </header>
  );
}
