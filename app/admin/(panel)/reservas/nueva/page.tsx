import NuevaReservaAdminForm from "@/components/admin/NuevaReservaAdminForm";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

interface PageProps {
  searchParams: Promise<{
    fecha_inicio?: string;
    espacio_id?: string;
  }>;
}

export default async function NuevaReservaAdminPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;

  const fechaInicioInicial = String(
    params.fecha_inicio ?? ""
  );

  const espacioIdInicial = params.espacio_id
    ? Number(params.espacio_id)
    : null;

  const supabase = createSupabaseAdmin();

  const {
    data: espacios,
    error: espaciosError,
  } = await supabase
    .from("espacios")
    .select(`
      id,
      nombre,
      capacidad
    `)
    .eq("estado", "activo")
    .order("id");

  const {
    data: tarifas,
    error: tarifasError,
  } = await supabase
    .from("tarifas")
    .select(`
      espacio_id,
      cantidad_huespedes,
      incluye_desayuno,
      precio_por_noche
    `)
    .eq("activo", true);

  if (espaciosError || tarifasError) {
    console.error(
      "Error cargando nueva reservación:",
      espaciosError || tarifasError
    );

    return (
      <main className="p-6 md:p-10">
        <div className="rounded-2xl bg-red-50 p-5 text-red-700">
          No fue posible cargar el formulario.
        </div>
      </main>
    );
  }

  return (
    <main className="p-6 md:p-10">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-[#286453]">
          Administración
        </p>

        <h1 className="mt-2 text-4xl font-bold text-[#173f32]">
          Nueva reservación
        </h1>

        <p className="mt-2 max-w-3xl text-gray-600">
          Registra una reservación recibida directamente por
          teléfono, WhatsApp, presencialmente u otro medio.
        </p>
      </div>

      <NuevaReservaAdminForm
        espacios={(espacios ?? []).map((espacio) => ({
          ...espacio,
          capacidad: Number(espacio.capacidad),
        }))}
        tarifas={(tarifas ?? []).map((tarifa) => ({
          ...tarifa,
          precio_por_noche: Number(
            tarifa.precio_por_noche
          ),
        }))}
        fechaInicioInicial={fechaInicioInicial}
        espacioIdInicial={espacioIdInicial}
      />
    </main>
  );
}