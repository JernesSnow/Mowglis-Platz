import Link from "next/link";

import { createSupabaseAdmin } from "@/lib/supabase/admin";

export default async function AlojamientosAdminPage() {
  const supabase = createSupabaseAdmin();

  const {
    data: espacios,
    error,
  } = await supabase
    .from("espacios")
    .select(`
      id,
      nombre,
      descripcion,
      tipo,
      estado,
      capacidad,
      seccion
    `)
    .order("id");

  if (error) {
    console.error(
      "Error cargando alojamientos:",
      error
    );
  }

  return (
    <main className="p-6 md:p-10">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-[#286453]">
          Administración
        </p>

        <h1 className="mt-2 text-4xl font-bold text-[#173f32]">
          Alojamientos
        </h1>

        <p className="mt-2 max-w-3xl text-gray-600">
          Administra la información básica y disponibilidad
          general de los alojamientos.
        </p>
      </div>

      {error ? (
        <div className="rounded-2xl bg-red-50 p-5 text-red-700">
          No fue posible cargar los alojamientos.
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          {(espacios ?? []).map((espacio) => (
            <section
              key={espacio.id}
              className="rounded-2xl bg-white p-6 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-[#173f32]">
                    {espacio.nombre}
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    {espacio.tipo}
                  </p>
                </div>

                {espacio.estado === "activo" ? (
                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                    Activo
                  </span>
                ) : espacio.estado === "mantenimiento" ? (
                  <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-800">
                    Mantenimiento
                  </span>
                ) : (
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                    Inactivo
                  </span>
                )}
              </div>

              <div className="mt-5 space-y-3 text-sm">
                <div>
                  <span className="text-gray-500">
                    Capacidad:
                  </span>{" "}
                  <strong className="text-[#173f32]">
                    {espacio.capacidad} huéspedes
                  </strong>
                </div>

                {espacio.seccion !== null && (
                  <div>
                    <span className="text-gray-500">
                      Sección:
                    </span>{" "}
                    <strong className="text-[#173f32]">
                      {espacio.seccion}
                    </strong>
                  </div>
                )}

                <p className="text-gray-600">
                  {espacio.descripcion ||
                    "Sin descripción registrada."}
                </p>
              </div>

              <Link
                href={`/admin/alojamientos/${espacio.id}`}
                className="mt-6 inline-block rounded-xl bg-[#173f32] px-5 py-3 font-semibold text-white"
              >
                Administrar
              </Link>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}