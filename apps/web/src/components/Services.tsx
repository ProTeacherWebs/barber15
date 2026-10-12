import type { Service } from "@/lib/catalog";
import { formatDuration, formatPrice } from "@/lib/format";
import styles from "./Services.module.css";

export function Services({ services }: { services: Service[] | null }) {
  return (
    <section id="services" className="section">
      <div className="wrap">
        <h2>Услуги</h2>
        <p className="lede">
          Цена и длительность фиксируются в момент записи. Следующий гость не начинается, пока
          ваше время не закончилось.
        </p>
        {services === null ? (
          <p className="lede">Не удалось загрузить услуги.</p>
        ) : services.length === 0 ? (
          <p className="lede">Сейчас нет активных услуг.</p>
        ) : (
        <ul className={styles.list}>
          {services.map((service) => (
            <li key={service.id} className={styles.row}>
              <div>
                <h3>{service.name}</h3>
                <p>{service.description}</p>
              </div>
              <p className={styles.meta}>
                <span>{formatDuration(service.durationMin)}</span>
                <span className={styles.price}>{formatPrice(service.price)}</span>
              </p>
            </li>
          ))}
        </ul>
        )}
      </div>
    </section>
  );
}
