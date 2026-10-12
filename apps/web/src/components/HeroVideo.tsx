"use client";

import { useEffect, useRef } from "react";
import styles from "./Hero.module.css";

export function HeroVideo() {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) {
      return;
    }

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = true;

    const sync = () => {
      if (motion.matches || !visible) {
        video.pause();
        return;
      }
      void video.play().catch(() => undefined);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        sync();
      },
      { threshold: 0.15 },
    );

    observer.observe(video);
    motion.addEventListener("change", sync);
    sync();

    return () => {
      observer.disconnect();
      motion.removeEventListener("change", sync);
    };
  }, []);

  return (
    <video
      ref={ref}
      className={styles.video}
      src="/barber.mp4"
      muted
      loop
      playsInline
      autoPlay
      preload="auto"
      aria-hidden="true"
      tabIndex={-1}
    />
  );
}
