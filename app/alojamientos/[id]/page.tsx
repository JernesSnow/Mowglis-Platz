import Link from "next/link";
import { notFound } from "next/navigation";

import Header from "@/components/layout/Header";
import { createClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AlojamientoPage({ params }: Props) {
  const { id } = await params;

  const espacioId = Number(id);

  if (!Number.isInteger(espacioId)) {
    notFound();
  }

  const supabase = await createClient();

  // Obtener alojamiento
  const { data: espacio, error } = await supabase
    .from("espacios")
    .select("*")
    .eq("id", espacioId)
    .eq("estado", "activo")
    .single();

  if (error || !espacio) {
    notFound();
  }

  // Obtener imágenes
  const { data: imagenes } = await supabase
    .from("imagenes")
    .select("*")
    .eq("espacio_id", espacioId)
    .order("orden", { ascending: true });

  // Obtener tarifas
  const { data: tarifas } = await supabase
    .from("tarifas")
    .select("*")
    .eq("espacio_id", espacioId)
    .eq("activo", true)
    .order("cantidad_huespedes", { ascending: true });

  const imagenPrincipal =
    imagenes?.find((imagen) => imagen.es_principal) ?? imagenes?.[0];

  return (
    <>
      <Header />

      <main>
        {/* Encabezado */}
        <section className="bg-[var(--green-dark)] px-6 pb-16 pt-32 text-white lg:px-10">
          <div className="mx-auto max-w-7xl">
            <Link
              href="/alojamientos"
              className="mb-6 inline-block text-sm font-semibold text-white/70 hover:text-white"
            >
              ← Volver a alojamientos
            </Link>

            <p className="mb-3 text-sm font-bold uppercase tracking-[0.25em] text-[var(--turquoise)]">
              Mowgli&apos;s Platz
            </p>

            <h1 className="text-4xl font-bold sm:text-5xl lg:text-6xl">
              {espacio.nombre}
            </h1>

            <p className="mt-4 text-white/70">
              Hasta {espacio.capacidad} huéspedes
            </p>
          </div>
        </section>

        {/* Información principal */}
        <section className="bg-[var(--cream)] px-6 py-16 lg:px-10">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.3fr_0.7fr]">
            
            {/* Izquierda */}
            <div>
              {/* Imagen principal */}
              <div
                className="aspect-[16/10] overflow-hidden rounded-[2.5rem] bg-[var(--green-dark)]/10 bg-cover bg-center"
                style={
                  imagenPrincipal
                    ? {
                        backgroundImage: `url("${imagenPrincipal.url}")`,
                      }
                    : undefined
                }
              >
                {!imagenPrincipal && (
                  <div className="flex h-full items-center justify-center px-8 text-center text-[var(--green-dark)]/50">
                    Fotografía de {espacio.nombre}
                  </div>
                )}
              </div>

              {/* Descripción */}
              <div className="mt-10">
                <h2 className="text-3xl font-bold text-[var(--green-dark)]">
                  Sobre este alojamiento
                </h2>

                <p className="mt-5 max-w-3xl text-lg leading-8 text-[var(--green-dark)]/70">
                  {espacio.descripcion ||
                    "La descripción de este alojamiento estará disponible próximamente."}
                </p>
              </div>

              {/* Galería */}
              {imagenes && imagenes.length > 1 && (
                <div className="mt-12">
                  <h2 className="mb-6 text-3xl font-bold text-[var(--green-dark)]">
                    Galería
                  </h2>

                  <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                    {imagenes.map((imagen) => (
                      <div
                        key={imagen.id}
                        className="aspect-[4/3] rounded-2xl bg-cover bg-center"
                        style={{
                          backgroundImage: `url("${imagen.url}")`,
                        }}
                        aria-label={imagen.alt_text || espacio.nombre}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Derecha */}
            <aside>
              <div className="sticky top-8 rounded-[2rem] bg-white p-7 shadow-sm">
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-[var(--green)]">
                  Tarifas
                </p>

                <h2 className="mt-2 text-3xl font-bold text-[var(--green-dark)]">
                  Elegí tu estadía
                </h2>

                {/* Tarifas */}
                {tarifas && tarifas.length > 0 ? (
                  <div className="mt-7 space-y-3">
                    {tarifas.map((tarifa) => (
                      <div
                        key={tarifa.id}
                        className="flex items-center justify-between gap-5 rounded-2xl bg-[var(--cream)] p-4"
                      >
                        <div>
                          <p className="font-semibold text-[var(--green-dark)]">
                            {tarifa.cantidad_huespedes}{" "}
                            {tarifa.cantidad_huespedes === 1
                              ? "persona"
                              : "personas"}
                          </p>

                          <p className="text-sm text-[var(--green-dark)]/60">
                            {tarifa.incluye_desayuno
                              ? "Con desayuno"
                              : "Sin desayuno"}
                          </p>
                        </div>

                        <p className="font-bold text-[var(--green-dark)]">
                          ₡
                          {Number(tarifa.precio_por_noche).toLocaleString(
                            "es-CR"
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-7 rounded-2xl bg-[var(--cream)] p-5">
                    <p className="text-sm text-[var(--green-dark)]/70">
                      Tarifa pendiente de confirmar.
                    </p>
                  </div>
                )}

                {/* Extras */}
                <div className="mt-7 border-t border-black/10 pt-6">
                  <h3 className="font-bold text-[var(--green-dark)]">
                    Información adicional
                  </h3>

                  <div className="mt-4 space-y-3 text-sm text-[var(--green-dark)]/70">
                    <p>
                      Capacidad máxima:{" "}
                      <strong>{espacio.capacidad} huéspedes</strong>
                    </p>

                    {espacio.precio_persona_extra !== null && (
                      <p>
                        Persona extra:{" "}
                        <strong>
                          ₡
                          {Number(
                            espacio.precio_persona_extra
                          ).toLocaleString("es-CR")}
                        </strong>
                      </p>
                    )}

                    {espacio.precio_mascota !== null &&
                      espacio.max_mascotas > 0 && (
                        <p>
                          Mascota:{" "}
                          <strong>
                            ₡
                            {Number(espacio.precio_mascota).toLocaleString(
                              "es-CR"
                            )}
                          </strong>
                          {" · "}Máximo {espacio.max_mascotas}
                        </p>
                      )}
                  </div>
                </div>

                {/* CTA */}
                <Link
                  href={`/reservar?espacio=${espacio.id}`}
                  className="mt-8 block rounded-full bg-[var(--green-dark)] px-6 py-3.5 text-center font-bold text-white hover:scale-[1.02]"
                >
                  Consultar disponibilidad
                </Link>

                <p className="mt-4 text-center text-xs leading-5 text-[var(--green-dark)]/50">
                  Seleccioná tus fechas para comprobar disponibilidad y calcular
                  el precio de la estadía.
                </p>
              </div>
            </aside>
          </div>
        </section>
      </main>
    </>
  );
}