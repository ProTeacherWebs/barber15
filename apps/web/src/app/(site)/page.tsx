import { Barbers } from "@/components/Barbers";
import { Contacts } from "@/components/Contacts";
import { Hero } from "@/components/Hero";
import { PageSlide } from "@/components/PageSlide";
import { Reviews } from "@/components/Reviews";
import { Services } from "@/components/Services";
import { getCatalog } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const catalog = await getCatalog();
  return (
    <main id="content">
      <PageSlide>
        <Hero />
        <Services services={catalog?.services ?? null} />
        <Barbers barbers={catalog?.barbers ?? null} />
        <Reviews />
        <Contacts />
      </PageSlide>
    </main>
  );
}
