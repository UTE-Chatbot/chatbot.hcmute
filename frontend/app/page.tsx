import CtaSection from "@/components/pages/root/cta";
import DockDemo from "@/components/pages/root/explore";
import { Footer } from "@/components/pages/root/footer";
import Header from "@/components/pages/root/header";
import Hero2 from "@/components/pages/root/hero";
import Stats from "@/components/pages/root/stats";
import ContactMap from "@/components/pages/root/contact-map";

export default function Home() {
  return (
    <main>
      <Header />
      <Hero2 />
      <Stats />
      <DockDemo />
      <ContactMap />
      <CtaSection />
      <Footer />
    </main>
  );
}
