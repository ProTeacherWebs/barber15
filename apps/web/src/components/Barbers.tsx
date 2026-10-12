import type { CSSProperties } from "react";
import Image from "next/image";
import type { Barber } from "@/lib/catalog";
import styles from "./Barbers.module.css";

export function Barbers({ barbers }: { barbers: Barber[] | null }) {
  return (
    <section id="barbers" className={`section ${styles.band}`}>
      <div className="wrap">
        <h2>Барберы</h2>
        <p className="lede">Карточка остаётся на месте, пока следующая её не накроет.</p>
        {barbers === null ? (
          <p className="lede">Не удалось загрузить барберов.</p>
        ) : barbers.length === 0 ? (
          <p className="lede">Сейчас нет барберов в зале.</p>
        ) : (
        <ul className={styles.stack} style={{ "--cards": barbers.length } as CSSProperties}>
          {barbers.map((barber, index) => (
            <li
              key={barber.id}
              className={styles.card}
              style={{ "--i": index + 1 } as CSSProperties}
            >
              <article className={styles.content}>
                <div className={styles.photo}>
                  <Image
                    className={styles.portrait}
                    src={barber.photo}
                    alt=""
                    fill
                    sizes="(min-width: 720px) 380px, 100vw"
                  />
                </div>
                <div className={styles.copy}>
                  <h3>{barber.name}</h3>
                  <p className={styles.years}>{barber.experienceYears} лет в кресле</p>
                  <p className={styles.bio}>{barber.bio}</p>
                  <p className={styles.services}>{barber.services.join(", ")}</p>
                </div>
              </article>
            </li>
          ))}
        </ul>
        )}
      </div>
    </section>
  );
}
