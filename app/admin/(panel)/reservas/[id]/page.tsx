import Link from "next/link";
import { notFound } from "next/navigation";

import { createSupabaseAdmin } from "@/lib/supabase/admin";
import ReservaEstadoActions from "@/components/admin/ReservaEstadoActions";


interface ReservaDetallePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ReservaDetallePage({
  params,
}: ReservaDetallePageProps) {
  const { id } = await params;

  const reservaId = Number(id);

  if (!Number.isInteger(reservaId)) {
    notFound();
  }

  const supabase = createSupabaseAdmin();

  const { data: reserva, error } = await supabase
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
      updated_at,
      espacios (
        id,
        nombre,
        tipo
      ),
      cliente (
        id,
        nombre,
        correo,
        telefono
      )
    `)
    .eq("id", reservaId)
    .single();

  if (error || !reserva) {
    notFound();
  }

  const alojamiento = Array.isArray(reserva.espacios)
    ? reserva.espacios[0]
    : reserva.espacios;

  const cliente = Array.isArray(reserva.cliente)
    ? reserva.cliente[0]
    : reserva.cliente;

  return (
    <main className="p-6 md:p-10">
      <Link
        href="/admin/reservas"
        className="text-sm font-semibold text-[#286453] hover:underline"
      >
        ← Volver a reservaciones
      </Link>

      <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-[#286453]">
            Reservación
          </p>

          <h1 className="mt-2 text-4xl font-bold text-[#173f32]">
            {reserva.codigo_reserva}
          </h1>
        </div>

        <span className="w-fit rounded-full bg-yellow-100 px-4 py-2 text-sm font-semibold text-yellow-800">
          {reserva.estado}
        </span>
      </div>

      <ReservaEstadoActions
      reservaId={reserva.id}
        estado={reserva.estado}
    />

      <div className="mt-10 grid gap-6 lg:grid-cols-2">

        {/* CLIENTE */}
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-xl font-bold text-[#173f32]">
            Cliente
          </h2>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">
                Nombre
              </p>

              <p className="font-semibold">
                {cliente?.nombre ?? "Sin nombre"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Correo
              </p>

              <p>
                {cliente?.correo ?? "Sin correo"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Teléfono
              </p>

              <p>
                {cliente?.telefono ?? "No proporcionado"}
              </p>
            </div>
          </div>
        </section>

        {/* ALOJAMIENTO */}
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-xl font-bold text-[#173f32]">
            Alojamiento
          </h2>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">
                Espacio
              </p>

              <p className="font-semibold">
                {alojamiento?.nombre ??
                  "Sin alojamiento"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Check-in
              </p>

              <p>{reserva.fecha_inicio}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Check-out
              </p>

              <p>{reserva.fecha_fin}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Huéspedes
              </p>

              <p>{reserva.cantidad_huespedes}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Mascotas
              </p>

              <p>{reserva.cantidad_mascotas}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Desayuno
              </p>

              <p>
                {reserva.incluye_desayuno
                  ? "Incluido"
                  : "No incluido"}
              </p>
            </div>
          </div>
        </section>

        {/* PAGO */}
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-xl font-bold text-[#173f32]">
            Tarifa
          </h2>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">
                Precio por noche
              </p>

              <p className="font-semibold">
                ₡
                {Number(
                  reserva.precio_por_noche
                ).toLocaleString("es-CR")}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Total
              </p>

              <p className="text-2xl font-bold text-[#173f32]">
                ₡
                {Number(reserva.total).toLocaleString(
                  "es-CR"
                )}
              </p>
            </div>
          </div>
        </section>

        {/* INFORMACIÓN DEL SISTEMA */}
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-xl font-bold text-[#173f32]">
            Información
          </h2>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">
                Estado
              </p>

              <p>{reserva.estado}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Origen
              </p>

              <p>{reserva.origen}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Registrada
              </p>

              <p>
                {new Date(
                  reserva.created_at
                ).toLocaleString("es-CR")}
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}