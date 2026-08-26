import Link from "next/link";

export default function Header() {
  return (
    <header className="absolute left-0 top-0 z-50 w-full">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
        
        {/* Logo / Nombre */}
        <Link
          href="/"
          className="!text-xl !font-bold !tracking-wide !text-white"
        >
          MOWGLI&apos;S PLATZ
        </Link>

        {/* Navegación */}
        <nav className="hidden items-center gap-8 text-sm font-medium text-white md:flex">
          <Link href="/" className="hover:opacity-70">
            Inicio
          </Link>

          <Link href="#nosotros" className="hover:opacity-70">
            Nosotros
          </Link>

          <Link href="/alojamientos" className="hover:opacity-70">
            Alojamientos
          </Link>

          <Link href="#galeria" className="hover:opacity-70">
            Galería
          </Link>

          <Link href="#contacto" className="hover:opacity-70">
            Contacto
          </Link>
        </nav>

        {/* Idiomas + CTA */}
        <div className="flex items-center gap-4">
          <div className="hidden gap-2 text-sm text-white sm:flex">
            <button type="button" className="font-bold">
              ES
            </button>

            <span>/</span>

            <button type="button" className="hover:opacity-70">
              EN
            </button>

            <span>/</span>

            <button type="button" className="hover:opacity-70">
              DE
            </button>
          </div>

          <Link
            href="/reservar"
            className="rounded-full bg-white px-6 py-2.5 text-sm font-bold text-[var(--green-dark)] shadow-sm transition-transform hover:scale-105"
          >
            Reservar
          </Link>
        </div>
      </div>
    </header>
  );
}