import type { Metadata } from "next";
import { Desk } from "@/components/admin/Desk";
import { ReviewsDesk } from "@/components/admin/MoreDesks";

export const metadata: Metadata = { title: "Отзывы" };

export default function AdminReviewsPage() {
  return (
    <Desk>
      <ReviewsDesk />
    </Desk>
  );
}
