import CalendarioAirbnbForm from "@/components/admin/CalendarioAirbnbForm";

import { createSupabaseAdmin } from "@/lib/supabase/admin";

export default async function CalendarioAdminPage() {
  const supabase =
    createSupabaseAdmin();

  // ALOJAMIENTOS

  const {
    data: espacios,
    error: espaciosError,
  } = await supabase
    .from("espacios")
    .select(`
      id,
      nombre,
      tipo
    `)
    .eq("estado", "activo")
    .order("id");

  // CALENDARIOS AIRBNB

  const {
    data: calendarios,
    error: calendariosError,
  } = await supabase
    .from("calendarios_externos")
    .select(`
      id,
      espacio_id,
      url_ical,
      activo,
      ultima_sincronizacion
    `)
    .eq("proveedor", "airbnb");

  const error =
    espaciosError ||
    calendariosError;

  if (error) {
    console.error(
      "Error cargando calendarios:",
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
          Integraciones
        </h1>

        <p className="mt-2 max-w-3xl text-gray-600">
          Configura servicios externos que pueden conectarse con Mowgli&apos;s Platz.
        </p>
      </div>

      {error ? (
        <div className="rounded-2xl bg-red-50 p-5 text-red-700">
          No fue posible cargar los
          calendarios.
        </div>
      ) : (
        <>
        <section className="mb-8">
            <h2 className="text-2xl font-bold text-[#173f32]">
                Airbnb
            </h2>

            <p className="mt-2 max-w-3xl text-gray-600">
                Sincroniza opcionalmente las fechas ocupadas de
                Airbnb mediante calendarios iCal.
            </p>
        </section>

          <div className="grid gap-6 xl:grid-cols-2">
            {espacios?.map(
              (espacio) => {
                const calendario =
                  calendarios?.find(
                    (item) =>
                      item.espacio_id ===
                      espacio.id
                  ) ?? null;

                return (
                  <CalendarioAirbnbForm
                    key={espacio.id}
                    espacio={espacio}
                    calendario={
                      calendario
                    }
                  />
                );
              }
            )}
          </div>
        </>
      )}
    </main>
  );
}