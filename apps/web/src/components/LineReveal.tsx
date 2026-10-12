import type { CSSProperties } from "react";
import styles from "./LineReveal.module.css";

export function LineReveal({ lines }: { lines: readonly string[] }) {
  return (
    <h1>
      <span className="sr-only">{lines.join(" ")}</span>
      <span aria-hidden="true" className={styles.lines}>
        {lines.map((line, index) => (
          <span key={line} className={styles.line} style={{ "--i": index } as CSSProperties}>
            {line}
          </span>
        ))}
      </span>
    </h1>
  );
}
