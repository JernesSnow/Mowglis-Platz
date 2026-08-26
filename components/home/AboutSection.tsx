import Link from "next/link";

export default function AboutSection() {
  return (
    <section
      id="nosotros"
      className="bg-[var(--cream)] px-6 py-24 lg:px-10"
    >
      <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-2">
        {/* Imagen provisional */}
        <div className="relative">
          <div className="aspect-[4/3] overflow-hidden rounded-[2.5rem] bg-[var(--turquoise)]/30">
            <div className="flex h-full items-center justify-center px-10 text-center text-[var(--green-dark)]/60">
              Fotografía de Mowgli&apos;s Platz
            </div>
          </div>

          <div className="absolute -bottom-5 -right-5 hidden rounded-3xl bg-[var(--yellow)] px-7 py-5 font-semibold text-[var(--green-dark)] sm:block">
            200 m de Playa Negra
          </div>
        </div>

        {/* Contenido */}
        <div>
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.25em] text-[var(--green)]">
            Conocé nuestro hospedaje
          </p>

          <h2 className="text-4xl font-bold text-[var(--green-dark)] sm:text-5xl">
            ¿Quiénes somos?
          </h2>

          <p className="mt-6 text-lg leading-8 text-[var(--green-dark)]/75">
            En Mowgli&apos;s Platz ofrecemos un lugar tranquilo para relajarse
            y descansar de la ciudad, rodeado de paz y naturaleza.
          </p>

          <p className="mt-4 leading-7 text-[var(--green-dark)]/65">
            Estamos ubicados en Playa Negra, Puerto Viejo, a pocos metros de
            la playa y rodeados del ambiente natural característico del Caribe
            costarricense.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">

            <a
              href="#contacto"
              className="rounded-full border border-[var(--green-dark)] px-7 py-3 font-semibold text-[var(--green-dark)] hover:bg-[var(--green-dark)] hover:text-white"
            >
              Contactarnos
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}