import type { Metadata } from "next";
import { AnalyticsDesk } from "@/components/admin/AnalyticsDesk";
import { Desk } from "@/components/admin/Desk";

export const metadata: Metadata = { title: "Аналитика" };

export default function AdminAnalyticsPage() {
  return (
    <Desk>
      <AnalyticsDesk />
    </Desk>
  );
}
