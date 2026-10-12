import type { Metadata } from "next";
import { BarbersDesk } from "@/components/admin/BarbersDesk";
import { Desk } from "@/components/admin/Desk";

export const metadata: Metadata = { title: "Барберы" };

export default function AdminBarbersPage() {
  return (
    <Desk>
      <BarbersDesk />
    </Desk>
  );
}
