import Link from "next/link";
import { dayExample, shop } from "@/data/mock";
import { HeroVideo } from "./HeroVideo";
import { LineReveal } from "./LineReveal";
import styles from "./Hero.module.css";

export function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.media}>
        <HeroVideo />
        <div className={styles.scrim} />
      </div>
      <div className={`wrap ${styles.grid}`}>
        <div>
          <p className={styles.place}>
            {shop.city}, {shop.district}
          </p>
          <LineReveal lines={["Кресло", "по записи"]} />
          <p className={styles.lead}>
            «{shop.name}» стрижёт, бреет и приводит бороду в порядок. Один визит занимает своё
            время, {shop.hours.toLowerCase()}.
          </p>
          <div className={styles.actions}>
            <Link className="cta" href="/book" transitionTypes={["nav-forward"]}>
              Записаться
            </Link>
            <Link className="ctaSecondary" href="/#services">
              Смотреть услуги
            </Link>
          </div>
        </div>
        <aside className={styles.day} aria-label="Пример загрузки кресла в пятницу">
          <p className={styles.dayTitle}>Пример пятницы</p>
          <ol>
            {dayExample.map((slot) => (
              <li
                key={slot.time}
                className={slot.state === "free" ? styles.free : styles.busy}
              >
                <span>{slot.time}</span>
                <span>{slot.state === "free" ? "свободно" : "занято"}</span>
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </section>
  );
}
