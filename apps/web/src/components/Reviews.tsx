import { reviews } from "@/data/mock";
import styles from "./Reviews.module.css";

export function Reviews() {
  const featured = reviews.find((review) => review.featured) ?? reviews[0];

  if (!featured) {
    return null;
  }

  const rest = reviews.filter((review) => review.id !== featured.id);

  return (
    <section id="reviews" className="section">
      <div className="wrap">
        <h2>Отзывы</h2>
        <p className="lede">Публикуем оценки от 4. Остальные видит только администратор.</p>
        <figure className={styles.featured}>
          <blockquote>
            <p>{featured.text}</p>
          </blockquote>
          <figcaption>
            <span>{featured.author}</span>
            <span>
              {featured.rating} из 5
            </span>
          </figcaption>
        </figure>
        <ul className={styles.rest}>
          {rest.map((review) => (
            <li key={review.id}>
              <p>{review.text}</p>
              <p className={styles.who}>
                <span>{review.author}</span>
                <span>{review.rating} из 5</span>
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
