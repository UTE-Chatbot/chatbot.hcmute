// import Blog from "@/components/sections/blog";
// import CTA from "@/components/sections/cta";
// import FAQ from "@/components/sections/faq";
// import Features from "@/components/sections/features";
// import Footer from "@/components/sections/footer";
// import Header from "@/components/sections/header";
// import Hero from "@/components/sections/hero";
// import HowItWorks from "@/components/sections/how-it-works";
// import Logos from "@/components/sections/logos";
// import Pricing from "@/components/sections/pricing";
// import Problem from "@/components/sections/problem";
// import Solution from "@/components/sections/solution";
// import Testimonials from "@/components/sections/testimonials";
// import TestimonialsCarousel from "@/components/sections/testimonials-carousel";

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
