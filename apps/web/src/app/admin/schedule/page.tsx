import type { Metadata } from "next";
import { Desk } from "@/components/admin/Desk";
import { ScheduleDesk } from "@/components/admin/ScheduleDesk";

export const metadata: Metadata = { title: "График" };

export default function AdminSchedulePage() {
  return (
    <Desk>
      <ScheduleDesk />
    </Desk>
  );
}
