import { createSupabaseAdmin } from "@/lib/supabase/admin";

import NuevoBloqueoForm from "@/components/admin/NuevoBloqueoForm";
import EliminarBloqueoButton from "@/components/admin/EliminarBloqueoButton";

export default async function BloqueosAdminPage() {
  const supabase = createSupabaseAdmin();

  // ESPACIOS

  const {
    data: espacios,
    error: espaciosError,
  } = await supabase
    .from("espacios")
    .select(`
      id,
      nombre
    `)
    .eq("estado", "activo")
    .order("id");

  // BLOQUEOS

  const {
    data: bloqueos,
    error: bloqueosError,
  } = await supabase
    .from("bloqueo_espacio")
    .select(`
      id,
      fecha_inicio,
      fecha_fin,
      motivo,
      origen,
      uid_externo,
      created_at,
      espacios (
        nombre
      )
    `)
    .order("fecha_inicio", {
      ascending: true,
    });

  const error =
    espaciosError || bloqueosError;

  if (error) {
    console.error(
      "Error cargando bloqueos:",
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
          Bloqueos
        </h1>

        <p className="mt-2 max-w-2xl text-gray-600">
          Administra fechas en las que un
          alojamiento no debe estar disponible
          para nuevas reservaciones.
        </p>
      </div>

      {error ? (
        <div className="rounded-2xl bg-red-50 p-5 text-red-700">
          No fue posible cargar los bloqueos.
        </div>
      ) : (
        <div className="space-y-8">
          <NuevoBloqueoForm
            espacios={espacios ?? []}
          />

          <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className="border-b border-gray-100 p-6">
              <h2 className="text-xl font-bold text-[#173f32]">
                Bloqueos registrados
              </h2>
            </div>

            {!bloqueos ||
            bloqueos.length === 0 ? (
              <div className="p-6 text-gray-500">
                No hay bloqueos registrados.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-[#173f32] text-sm text-white">
                    <tr>
                      <th className="px-5 py-4">
                        Alojamiento
                      </th>

                      <th className="px-5 py-4">
                        Desde
                      </th>

                      <th className="px-5 py-4">
                        Hasta
                      </th>

                      <th className="px-5 py-4">
                        Motivo
                      </th>

                      <th className="px-5 py-4">
                        Origen
                      </th>

                      <th className="px-5 py-4">
                        Acción
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {bloqueos.map(
                      (bloqueo) => {
                        const alojamiento =
                          Array.isArray(
                            bloqueo.espacios
                          )
                            ? bloqueo.espacios[0]
                            : bloqueo.espacios;

                        return (
                          <tr
                            key={bloqueo.id}
                            className="hover:bg-gray-50"
                          >
                            <td className="px-5 py-4 font-medium">
                              {alojamiento?.nombre ??
                                "Sin alojamiento"}
                            </td>

                            <td className="px-5 py-4">
                              {bloqueo.fecha_inicio}
                            </td>

                            <td className="px-5 py-4">
                              {bloqueo.fecha_fin}
                            </td>

                            <td className="px-5 py-4">
                              {bloqueo.motivo ??
                                "Sin motivo"}
                            </td>

                            <td className="px-5 py-4">
                              {bloqueo.origen ===
                              "airbnb" ? (
                                <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                                  Airbnb
                                </span>
                              ) : (
                                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                                  Manual
                                </span>
                              )}
                            </td>

                            <td className="px-5 py-4">
                              {bloqueo.origen ===
                              "manual" ? (
                                <EliminarBloqueoButton
                                  bloqueoId={
                                    bloqueo.id
                                  }
                                />
                              ) : (
                                <span className="text-sm text-gray-400">
                                  Sin acción
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}