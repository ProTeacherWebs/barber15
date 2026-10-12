import type { Metadata } from "next";
import { Desk } from "@/components/admin/Desk";
import { SettingsDesk } from "@/components/admin/MoreDesks";

export const metadata: Metadata = { title: "Настройки" };

export default function AdminSettingsPage() {
  return (
    <Desk>
      <SettingsDesk />
    </Desk>
  );
}
