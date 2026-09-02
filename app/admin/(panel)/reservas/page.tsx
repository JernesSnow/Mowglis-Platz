import { createSupabaseAdmin } from "@/lib/supabase/admin";
import Link from "next/link";
import ReservaEstadoBadge from "@/components/admin/ReservaEstadoBadge";

export default async function ReservasAdminPage() {
  const supabase = createSupabaseAdmin();

  const { data: reservas, error } = await supabase
    .from("reserva")
    .select(`
      id,
      codigo_reserva,
      fecha_inicio,
      fecha_fin,
      cantidad_huespedes,
      cantidad_mascotas,
      incluye_desayuno,
      estado,
      origen,
      precio_por_noche,
      total,
      created_at,
      espacios (
        nombre
      ),
      cliente (
        nombre,
        correo,
        telefono
      )
    `)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error(
      "Error cargando reservaciones:",
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
          Reservaciones
        </h1>

        <p className="mt-2 text-gray-600">
          Consulta las reservaciones registradas en Mowgli&apos;s Platz.
        </p>
      </div>

      {error ? (
        <div className="rounded-2xl bg-red-50 p-5 text-red-700">
          No fue posible cargar las reservaciones.
        </div>
      ) : !reservas || reservas.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 shadow-sm">
          <p className="text-gray-600">
            Todavía no hay reservaciones.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#173f32] text-sm text-white">
                <tr>
                  <th className="px-5 py-4">
                    Código
                  </th>

                  <th className="px-5 py-4">
                    Cliente
                  </th>

                  <th className="px-5 py-4">
                    Alojamiento
                  </th>

                  <th className="px-5 py-4">
                    Fechas
                  </th>

                  <th className="px-5 py-4">
                    Estado
                  </th>

                  <th className="px-5 py-4">
                    Origen
                  </th>

                  <th className="px-5 py-4 text-right">
                    Total
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {reservas.map((reserva) => {
                  const alojamiento =
                    Array.isArray(reserva.espacios)
                      ? reserva.espacios[0]
                      : reserva.espacios;

                  const cliente =
                    Array.isArray(reserva.cliente)
                      ? reserva.cliente[0]
                      : reserva.cliente;

                  return (
                    <tr
                      key={reserva.id}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-5 py-4">
                        <Link
                            href={`/admin/reservas/${reserva.id}`}
                            className="font-semibold text-[#286453] hover:underline"
                        >
                            {reserva.codigo_reserva}
                        </Link>
                     </td>

                      <td className="px-5 py-4">
                        <p className="font-medium">
                          {cliente?.nombre ??
                            "Sin cliente"}
                        </p>

                        <p className="text-sm text-gray-500">
                          {cliente?.correo}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        {alojamiento?.nombre ??
                          "Sin alojamiento"}
                      </td>

                      <td className="px-5 py-4 text-sm">
                        <p>
                          {reserva.fecha_inicio}
                        </p>

                        <p className="text-gray-500">
                          hasta {reserva.fecha_fin}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <ReservaEstadoBadge estado={reserva.estado} />
                      </td>

                      <td className="px-5 py-4">
                        {reserva.origen}
                      </td>

                      <td className="px-5 py-4 text-right font-semibold">
                        ₡
                        {Number(
                          reserva.total
                        ).toLocaleString(
                          "es-CR"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}