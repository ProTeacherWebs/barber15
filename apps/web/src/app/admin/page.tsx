import type { Metadata } from "next";
import { BookingsDesk } from "@/components/admin/BookingsDesk";
import { Desk } from "@/components/admin/Desk";

export const metadata: Metadata = { title: "Сегодня" };

export default function AdminTodayPage() {
  return (
    <Desk>
      <BookingsDesk today />
    </Desk>
  );
}
