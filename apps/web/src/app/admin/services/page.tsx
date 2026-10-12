import type { Metadata } from "next";
import { Desk } from "@/components/admin/Desk";
import { ServicesDesk } from "@/components/admin/ServicesDesk";

export const metadata: Metadata = { title: "Услуги" };

export default function AdminServicesPage() {
  return (
    <Desk>
      <ServicesDesk />
    </Desk>
  );
}
