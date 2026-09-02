import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getAdminProfile } from "@/lib/auth/getAdminProfile";

export default async function AdminPage() {
  const admin = await getAdminProfile();

  const supabase = createSupabaseAdmin();

  const { count: reservasPendientes } = await supabase
    .from("reserva")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq("estado", "pendiente");

  const { count: reservasTotales } = await supabase
    .from("reserva")
    .select("*", {
      count: "exact",
      head: true,
    });

  const { count: espaciosActivos } = await supabase
    .from("espacios")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq("estado", "activo");

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-10">
        <p className="text-sm font-semibold uppercase tracking-wider text-[#286453]">
          Panel administrativo
        </p>

        <h1 className="mt-2 text-4xl font-bold text-[#173f32]">
          Hola, {admin?.profile.nombre ?? "Administrador"}
        </h1>

        <p className="mt-2 text-gray-600">
          Gestión de Mowgli&apos;s Platz
        </p>
      </div>

      <section className="grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Reservas pendientes
          </p>

          <p className="mt-3 text-4xl font-bold text-[#173f32]">
            {reservasPendientes ?? 0}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Reservas totales
          </p>

          <p className="mt-3 text-4xl font-bold text-[#173f32]">
            {reservasTotales ?? 0}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Alojamientos activos
          </p>

          <p className="mt-3 text-4xl font-bold text-[#173f32]">
            {espaciosActivos ?? 0}
          </p>
        </div>
      </section>
    </main>
  );
}