import type { Metadata } from "next";
import { Desk } from "@/components/admin/Desk";
import { TimeOffDesk } from "@/components/admin/TimeOffDesk";

export const metadata: Metadata = { title: "Исключения" };

export default function AdminTimeOffPage() {
  return (
    <Desk>
      <TimeOffDesk />
    </Desk>
  );
}
