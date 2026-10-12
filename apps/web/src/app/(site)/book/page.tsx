import type { Metadata } from "next";
import { BookingWizard } from "@/components/BookingWizard";
import { PageSlide } from "@/components/PageSlide";
import { getCatalog } from "@/lib/catalog";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Записаться",
  description: "Запись в барбершоп Полоса: услуга, барбер, дата и время.",
};

export default async function BookPage() {
  const catalog = await getCatalog();
  return (
    <main id="content" className={`section ${styles.page}`}>
      <PageSlide>
        {catalog && catalog.services.length > 0 ? (
          <BookingWizard services={catalog.services} barbers={catalog.barbers} />
        ) : (
          <div className="wrap">
            <h1>Записаться</h1>
            <p className={styles.note}>
              {catalog ? "Сейчас нет услуг для записи." : "Не удалось загрузить услуги и барберов."}
            </p>
          </div>
        )}
      </PageSlide>
    </main>
  );
}
