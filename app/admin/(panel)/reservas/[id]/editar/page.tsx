import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import EditarReservaForm from "@/components/admin/EditarReservaForm";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

interface EditarReservaPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditarReservaPage({
  params,
}: EditarReservaPageProps) {
  const { id } = await params;

  const reservaId = Number(id);

  if (!Number.isInteger(reservaId)) {
    notFound();
  }

  const supabase = createSupabaseAdmin();

  // RESERVA

  const { data: reserva, error: reservaError } =
    await supabase
      .from("reserva")
      .select(`
        id,
        espacio_id,
        fecha_inicio,
        fecha_fin,
        cantidad_huespedes,
        incluye_desayuno,
        estado,
        cliente (
          nombre,
          correo,
          telefono
        )
      `)
      .eq("id", reservaId)
      .maybeSingle();

  if (reservaError || !reserva) {
    notFound();
  }

  // Una cancelada o completada ya no debe editarse.

  if (
    reserva.estado === "cancelada" ||
    reserva.estado === "completada"
  ) {
    redirect(
      `/admin/reservas/${reserva.id}`
    );
  }

  const cliente = Array.isArray(reserva.cliente)
    ? reserva.cliente[0]
    : reserva.cliente;

  if (!cliente) {
    notFound();
  }

  // ALOJAMIENTOS + TARIFAS

  const { data: espacios, error: espaciosError } =
    await supabase
      .from("espacios")
      .select(`
        id,
        nombre,
        capacidad,
        tarifas (
          id,
          cantidad_huespedes,
          incluye_desayuno,
          precio_por_noche,
          activo
        )
      `)
      .eq("estado", "activo")
      .order("id");

  if (espaciosError || !espacios) {
    throw new Error(
      "No fue posible cargar los alojamientos."
    );
  }

  const espaciosPreparados = espacios.map(
    (espacio) => ({
      ...espacio,

      tarifas: (espacio.tarifas ?? []).map(
        (tarifa) => ({
          ...tarifa,

          precio_por_noche: Number(
            tarifa.precio_por_noche
          ),
        })
      ),
    })
  );

  return (
    <main className="p-6 md:p-10">
      <Link
        href={`/admin/reservas/${reserva.id}`}
        className="text-sm font-semibold text-[#286453] hover:underline"
      >
        ← Volver a la reservación
      </Link>

      <div className="mb-8 mt-6">
        <p className="text-sm font-semibold uppercase tracking-wider text-[#286453]">
          Administración
        </p>

        <h1 className="mt-2 text-4xl font-bold text-[#173f32]">
          Editar reservación
        </h1>
      </div>

      <EditarReservaForm
        reserva={{
          id: reserva.id,
          espacio_id: reserva.espacio_id,
          fecha_inicio: reserva.fecha_inicio,
          fecha_fin: reserva.fecha_fin,
          cantidad_huespedes:
            reserva.cantidad_huespedes,
          incluye_desayuno:
            reserva.incluye_desayuno,

          cliente: {
            nombre: cliente.nombre,
            correo: cliente.correo,
            telefono: cliente.telefono,
          },
        }}
        espacios={espaciosPreparados}
      />
    </main>
  );
}