import Header from "@/components/layout/Header";

import Hero from "@/components/home/Hero";
import AboutSection from "@/components/home/AboutSection";
import AlojamientosSection from "@/components/home/AlojamientosSection";

export default function Home() {
  return (
    <>
      <Header />

      <main>
        <Hero />
        <AboutSection />
        <AlojamientosSection />
      </main>
    </>
  );
}