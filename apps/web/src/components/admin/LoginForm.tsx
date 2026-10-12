"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AdminError, adminFetch } from "@/lib/adminApi";
import styles from "./Admin.module.css";

export function LoginForm() {
  const router = useRouter();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit() {
    setPending(true);
    setError("");
    try {
      await adminFetch("/api/v1/admin/login", {
        method: "POST",
        body: JSON.stringify({ login, password }),
      });
      router.push("/admin");
    } catch (reason) {
      setError(reason instanceof AdminError ? reason.message : "Не удалось войти");
    } finally {
      setPending(false);
    }
  }

  return (
    <main id="content" className={styles.login}>
      <h1>Вход</h1>
      <p className={styles.note}>Админка барбершопа Полоса.</p>
      <form className={styles.form} onSubmit={(event) => event.preventDefault()}>
        <label className={styles.field}>
          Логин
          <input value={login} autoComplete="username" onChange={(event) => setLogin(event.target.value)} />
        </label>
        <label className={styles.field}>
          Пароль
          <input
            type="password"
            value={password}
            autoComplete="current-password"
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        {error ? <p className={styles.error}>{error}</p> : null}
        <button className="cta" type="button" disabled={pending} onClick={() => void submit()}>
          {pending ? "Входим…" : "Войти"}
        </button>
      </form>
    </main>
  );
}
