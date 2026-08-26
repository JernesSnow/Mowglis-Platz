import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

export default async function AlojamientosSection() {
  const supabase = await createClient();

  const { data: espacios, error } = await supabase
    .from("espacios")
    .select(`
      id,
      nombre,
      descripcion,
      capacidad,
      tipo,
      estado,
      incluido_en_casa_completa
    `)
    .eq("estado", "activo")
    .order("id");

  if (error) {
    console.error("Error cargando alojamientos:", error);

    return (
      <section className="px-6 py-24 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <p>No fue posible cargar los alojamientos.</p>
        </div>
      </section>
    );
  }

  return (
    <section
      id="alojamientos"
      className="bg-[var(--turquoise)] px-6 py-24 lg:px-10"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.25em] text-[var(--green-dark)]/70">
            Hospedaje
          </p>

          <h2 className="text-4xl font-bold text-[var(--green-dark)] sm:text-5xl">
            Nuestros alojamientos
          </h2>

          <p className="mt-5 leading-7 text-[var(--green-dark)]/70">
            Elegí el alojamiento que mejor se adapte a tu estadía y consultá
            su disponibilidad.
          </p>
        </div>

        {espacios && espacios.length > 0 ? (
          <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
            {espacios.map((espacio) => (
              <article
                key={espacio.id}
                className="overflow-hidden rounded-[2rem] bg-[var(--cream)] shadow-sm transition-transform duration-300 hover:-translate-y-1"
              >
                {/* Imagen provisional */}
                <div className="aspect-[4/3] bg-[var(--green-dark)]/10">
                  <div className="flex h-full items-center justify-center px-8 text-center text-[var(--green-dark)]/50">
                    Fotografía de {espacio.nombre}
                  </div>
                </div>

                <div className="p-7">
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <h3 className="text-2xl font-bold text-[var(--green-dark)]">
                      {espacio.nombre}
                    </h3>

                    <span className="whitespace-nowrap rounded-full bg-[var(--yellow)] px-3 py-1 text-xs font-bold text-[var(--green-dark)]">
                      Hasta {espacio.capacidad}
                    </span>
                  </div>

                  {espacio.descripcion && (
                    <p className="line-clamp-3 leading-7 text-[var(--green-dark)]/65">
                      {espacio.descripcion}
                    </p>
                  )}

                  <div className="mt-7 flex flex-wrap gap-3">
                    <Link
                      href={`/alojamientos/${espacio.id}`}
                      className="rounded-full bg-[var(--green-dark)] px-5 py-2.5 text-sm font-semibold text-white"
                    >
                      Ver detalles
                    </Link>

                    <Link
                      href={`/reservar?espacio=${espacio.id}`}
                      className="rounded-full border border-[var(--green-dark)] px-5 py-2.5 text-sm font-semibold text-[var(--green-dark)]"
                    >
                      Reservar
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl bg-[var(--cream)] p-10 text-center text-[var(--green-dark)]">
            Todavía no hay alojamientos disponibles.
          </div>
        )}
      </div>
    </section>
  );
}