import CalendarioReservas from "@/components/admin/CalendarioReservas";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export default async function CalendarioAdminPage() {
  const supabase = createSupabaseAdmin();

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

  const {
    data: reservas,
    error: reservasError,
  } = await supabase
    .from("reserva")
    .select(`
      id,
      codigo_reserva,
      fecha_inicio,
      fecha_fin,
      estado,
      espacio_id,
      espacios (
        nombre
      ),
      cliente (
        nombre
      )
    `)
    .neq("estado", "cancelada")
    .order("fecha_inicio");

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
      espacio_id,
      espacios (
        nombre
      )
    `)
    .order("fecha_inicio");

  const error =
    espaciosError ||
    reservasError ||
    bloqueosError;

  if (error) {
    console.error(
      "Error cargando calendario:",
      error
    );

    return (
      <main className="p-6 md:p-10">
        <h1 className="text-4xl font-bold text-[#173f32]">
          Calendario
        </h1>

        <div className="mt-8 rounded-2xl bg-red-50 p-5 text-red-700">
          No fue posible cargar el calendario.
        </div>
      </main>
    );
  }

  const reservasFormateadas =
    (reservas ?? []).map((reserva) => {
      const alojamiento =
        Array.isArray(reserva.espacios)
          ? reserva.espacios[0]
          : reserva.espacios;

      const cliente =
        Array.isArray(reserva.cliente)
          ? reserva.cliente[0]
          : reserva.cliente;

      return {
        id: reserva.id,
        codigo_reserva:
          reserva.codigo_reserva,
        fecha_inicio:
          reserva.fecha_inicio,
        fecha_fin:
          reserva.fecha_fin,
        estado:
          reserva.estado,
        espacio_id:
          reserva.espacio_id,

        alojamiento:
          alojamiento?.nombre ??
          "Sin alojamiento",

        cliente:
          cliente?.nombre ??
          "Sin cliente",
      };
    });

  const bloqueosFormateados =
    (bloqueos ?? []).map((bloqueo) => {
      const alojamiento =
        Array.isArray(bloqueo.espacios)
          ? bloqueo.espacios[0]
          : bloqueo.espacios;

      return {
        id: bloqueo.id,
        fecha_inicio:
          bloqueo.fecha_inicio,
        fecha_fin:
          bloqueo.fecha_fin,
        motivo:
          bloqueo.motivo,
        origen:
          bloqueo.origen,
        espacio_id:
          bloqueo.espacio_id,

        alojamiento:
          alojamiento?.nombre ??
          "Sin alojamiento",
      };
    });

  return (
    <main className="p-6 md:p-10">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-[#286453]">
          Administración
        </p>

        <h1 className="mt-2 text-4xl font-bold text-[#173f32]">
          Calendario
        </h1>

        <p className="mt-2 max-w-3xl text-gray-600">
          Consulta visualmente la ocupación,
          reservaciones y bloqueos de
          Mowgli&apos;s Platz.
        </p>
      </div>

      <CalendarioReservas
        espacios={espacios ?? []}
        reservas={reservasFormateadas}
        bloqueos={bloqueosFormateados}
      />
    </main>
  );
}