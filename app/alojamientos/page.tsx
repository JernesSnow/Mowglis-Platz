import Header from "@/components/layout/Header";
import AlojamientosSection from "@/components/home/AlojamientosSection";

export default function AlojamientosPage() {
  return (
    <>
      <Header />

      <main>
        <section className="bg-[var(--green-dark)] px-6 pb-16 pt-32 text-center text-white lg:px-10">
          <div className="mx-auto max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-[var(--turquoise)]">
              Mowgli&apos;s Platz
            </p>

            <h1 className="mt-3 text-5xl font-bold sm:text-6xl">
              Alojamientos
            </h1>

            <p className="mx-auto mt-5 max-w-2xl leading-7 text-white/70">
              Conocé nuestras opciones de hospedaje y encontrá la que mejor se
              adapte a tu estadía en Puerto Viejo.
            </p>
          </div>
        </section>

        <AlojamientosSection />
      </main>
    </>
  );
}