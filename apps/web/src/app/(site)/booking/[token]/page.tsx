import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ManageBooking, type ManagedBooking } from "@/components/ManageBooking";
import { PageSlide } from "@/components/PageSlide";
import styles from "../../book/page.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ваша запись",
  description: "Отмена и перенос записи в барбершоп Полоса.",
};

export default async function BookingTokenPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[a-f0-9]{32,80}$/.test(token)) {
    notFound();
  }

  const api = process.env.API_URL ?? "http://localhost:3001";
  let booking: ManagedBooking | null = null;
  try {
    const response = await fetch(`${api}/api/v1/bookings/${token}`, { cache: "no-store" });
    if (response.status === 404) {
      notFound();
    }
    if (response.ok) {
      const body = (await response.json()) as { booking: ManagedBooking };
      booking = body.booking;
    }
  } catch {
    booking = null;
  }

  return (
    <main id="content" className={`section ${styles.page}`}>
      <PageSlide>
        {booking ? (
          <ManageBooking initial={booking} />
        ) : (
          <div className="wrap">
            <h1>Ваша запись</h1>
            <p className={styles.note}>Не удалось загрузить запись. Обновите страницу чуть позже.</p>
          </div>
        )}
      </PageSlide>
    </main>
  );
}
