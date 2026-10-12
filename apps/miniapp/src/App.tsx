import WebApp from "@twa-dev/sdk";
import { useEffect, useState } from "react";
import { api, ApiRequestError } from "./api";
import styles from "./App.module.css";
import { BookFlow } from "./BookFlow";
import { MyBookings } from "./MyBookings";
import { applyTheme, watchTheme } from "./theme";

type AuthUser = { id: string; firstName: string; lastName: string };

export function App() {
  const [tab, setTab] = useState<"book" | "mine">("book");
  const [reloadKey, setReloadKey] = useState(0);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [phone, setPhone] = useState("");
  const [problem, setProblem] = useState<string | null>(null);
  const signedIn = Boolean(WebApp.initData && user);

  useEffect(() => {
    applyTheme();
    return watchTheme();
  }, []);

  useEffect(() => {
    const data = WebApp.initData;
    if (!data) {
      setProblem("Откройте Полосу из Telegram, чтобы записаться на своё имя.");
      return;
    }
    let cancelled = false;
    void api<{ user: AuthUser; client: { name: string; phone: string } | null }>("/api/v1/telegram/auth", {
      method: "POST",
      body: JSON.stringify({ initData: data }),
    })
      .then((body) => {
        if (cancelled) {
          return;
        }
        setUser(body.user);
        setPhone(body.client?.phone ?? "");
        setProblem(null);
      })
      .catch((reason: unknown) => {
        if (!cancelled) {
          setProblem(reason instanceof ApiRequestError ? reason.message : "Не удалось подтвердить Telegram");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(" ");

  return (
    <div className={styles.shell}>
      <header>
        <p className={styles.mark}>Полоса</p>
        {displayName ? <p className={styles.who}>{displayName}</p> : null}
      </header>
      {problem ? <p className={styles.problem}>{problem}</p> : null}
      {tab === "book" ? (
        <BookFlow
          firstName={displayName}
          phoneHint={phone}
          signedIn={signedIn}
          onBooked={() => {
            setReloadKey((value) => value + 1);
            setTab("mine");
          }}
        />
      ) : (
        <MyBookings signedIn={signedIn} reloadKey={reloadKey} />
      )}
      <nav className={styles.nav}>
        <button type="button" className={tab === "book" ? styles.navCurrent : undefined} onClick={() => setTab("book")}>
          Запись
        </button>
        <button type="button" className={tab === "mine" ? styles.navCurrent : undefined} onClick={() => setTab("mine")}>
          Мои записи
        </button>
      </nav>
    </div>
  );
}
