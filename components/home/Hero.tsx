import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden bg-[var(--green-dark)]">
      {/* Decoración de fondo */}
      <div className="absolute -right-32 top-20 h-96 w-96 rounded-full bg-[var(--turquoise)] opacity-20" />

      <div className="absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-[var(--yellow)] opacity-20" />

      <div className="relative mx-auto grid w-full max-w-7xl items-center gap-12 px-6 pb-16 pt-32 lg:grid-cols-2 lg:px-10">
        {/* Texto */}
        <div className="max-w-2xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-[var(--turquoise)]">
            Playa Negra · Puerto Viejo
          </p>

          <h1 className="text-5xl font-bold leading-tight text-white sm:text-6xl lg:text-7xl">
            Bienvenido a
            <span className="block text-[var(--yellow)]">
              Mowgli&apos;s Platz
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-8 text-white/80">
            Un lugar tranquilo para relajarse y descansar de la ciudad,
            rodeado de paz y naturaleza.
          </p>

          <p className="mt-3 text-sm font-medium text-white/70">
            A solo 200 metros de Playa Negra.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/alojamientos"
              className="rounded-full bg-[var(--yellow)] px-7 py-3 font-semibold text-[var(--green-dark)] hover:scale-105"
            >
              Ver alojamientos
            </Link>

            <Link
              href="/reservar"
              className="rounded-full bg-white px-7 py-3 font-semibold text-[var(--green-dark)] shadow-sm transition-transform hover:scale-105"
            >
              Reservar
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap gap-8 text-sm text-white/75">
            <div>
              <span className="block font-semibold text-white">
                Check-in
              </span>
              Después de las 2:00 p.m.
            </div>

            <div>
              <span className="block font-semibold text-white">
                Check-out
              </span>
              Antes de las 11:00 a.m.
            </div>
          </div>
        </div>

        {/* Imagen provisional */}
        <div className="relative hidden lg:block">
          <div className="aspect-[4/5] overflow-hidden rounded-[3rem] border border-white/10 bg-white/10">
            <div className="flex h-full items-center justify-center px-10 text-center text-white/60">
              Aquí colocaremos una fotografía principal de Mowgli&apos;s Platz
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}