import NuevaTarifaForm from "@/components/admin/NuevaTarifaForm";
import TarifaRow from "@/components/admin/TarifaRow";

import { createSupabaseAdmin } from "@/lib/supabase/admin";

export default async function TarifasAdminPage() {
  const supabase = createSupabaseAdmin();

  const { data: espacios, error } =
    await supabase
      .from("espacios")
      .select(`
        id,
        nombre,
        tipo,
        capacidad,
        estado,
        tarifas (
          id,
          cantidad_huespedes,
          incluye_desayuno,
          precio_por_noche,
          activo
        )
      `)
      .order("id");

  if (error) {
    console.error(
      "Error cargando tarifas:",
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
          Tarifas
        </h1>

        <p className="mt-2 max-w-2xl text-gray-600">
          Administra los precios por noche de cada
          alojamiento según la cantidad de huéspedes
          y si incluye desayuno.
        </p>
      </div>

      {error ? (
        <div className="rounded-2xl bg-red-50 p-5 text-red-700">
          No fue posible cargar las tarifas.
        </div>
      ) : (
        <div className="space-y-8">
          {espacios?.map((espacio) => {
            const tarifas = [...(espacio.tarifas ?? [])]
              .sort((a, b) => {
                if (
                  a.cantidad_huespedes !==
                  b.cantidad_huespedes
                ) {
                  return (
                    a.cantidad_huespedes -
                    b.cantidad_huespedes
                  );
                }

                return Number(
                  a.incluye_desayuno
                ) -
                  Number(
                    b.incluye_desayuno
                  );
              });

            return (
              <section
                key={espacio.id}
                className="rounded-2xl bg-white p-6 shadow-sm"
              >
                <div>
                  <h2 className="text-2xl font-bold text-[#173f32]">
                    {espacio.nombre}
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Capacidad máxima:{" "}
                    {espacio.capacidad} huéspedes
                  </p>
                </div>

                {tarifas.length > 0 ? (
                  <div className="mt-5 overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-sm text-gray-500">
                          <th className="px-4 py-3">
                            Huéspedes
                          </th>

                          <th className="px-4 py-3">
                            Desayuno
                          </th>

                          <th className="px-4 py-3">
                            Precio/noche
                          </th>

                          <th className="px-4 py-3">
                            Estado
                          </th>

                          <th className="px-4 py-3">
                            Acción
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {tarifas.map((tarifa) => (
                          <TarifaRow
                            key={tarifa.id}
                            tarifa={{
                              ...tarifa,
                              precio_por_noche:
                                Number(
                                  tarifa.precio_por_noche
                                ),
                            }}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="mt-5 text-sm text-gray-500">
                    Este alojamiento todavía no tiene
                    tarifas configuradas.
                  </p>
                )}

                <NuevaTarifaForm
                  espacioId={espacio.id}
                  capacidad={espacio.capacidad}
                />
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}