import type { Metadata } from "next";
import { BookingsDesk } from "@/components/admin/BookingsDesk";
import { Desk } from "@/components/admin/Desk";

export const metadata: Metadata = { title: "Записи" };

export default function AdminBookingsPage() {
  return (
    <Desk>
      <BookingsDesk />
    </Desk>
  );
}
