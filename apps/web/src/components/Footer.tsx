import { shop } from "@/data/mock";
import styles from "./Footer.module.css";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`wrap ${styles.row}`}>
        <span>{shop.name}</span>
        <span>{shop.city}</span>
        <span>{shop.hours}</span>
      </div>
    </footer>
  );
}
