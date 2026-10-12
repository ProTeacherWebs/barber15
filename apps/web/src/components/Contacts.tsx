import Link from "next/link";
import { shop } from "@/data/mock";
import { mapEmbedUrl, mapLinkUrl } from "@/lib/format";
import styles from "./Contacts.module.css";

export function Contacts() {
  const mapSrc = mapEmbedUrl(shop.lat, shop.lng);
  const mapHref = mapLinkUrl(shop.lat, shop.lng);

  return (
    <section id="contacts" className="section">
      <div className={`wrap ${styles.grid}`}>
        <div>
          <h2>Контакты</h2>
          <dl className={styles.facts}>
            <div>
              <dt>Адрес</dt>
              <dd>{shop.address}</dd>
            </div>
            <div>
              <dt>Телефон</dt>
              <dd>
                <a href={shop.phoneHref}>{shop.phoneDisplay}</a>
              </dd>
            </div>
            <div>
              <dt>Часы</dt>
              <dd>{shop.hours}</dd>
            </div>
          </dl>
          <Link className="cta" href="/book" transitionTypes={["nav-forward"]}>
            Записаться
          </Link>
        </div>
        <div className={styles.mapWrap}>
          <iframe
            title="Карта: барбершоп Полоса, улица Ахмада Дониша, 2"
            src={mapSrc}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
          <a href={mapHref} target="_blank" rel="noreferrer">
            Открыть карту
          </a>
        </div>
      </div>
    </section>
  );
}
