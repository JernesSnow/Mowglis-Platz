import Link from "next/link";
import { notFound } from "next/navigation";

import EditarAlojamientoForm from "@/components/admin/EditarAlojamientoForm";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditarAlojamientoPage({
  params,
}: PageProps) {
  const { id } = await params;

  const espacioId = Number(id);

  if (
    !Number.isInteger(espacioId) ||
    espacioId <= 0
  ) {
    notFound();
  }

  const supabase = createSupabaseAdmin();

  const {
    data: espacio,
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
      seccion,
      incluido_en_casa_completa
    `)
    .eq("id", espacioId)
    .maybeSingle();

  if (error) {
    console.error(
      "Error cargando alojamiento:",
      error
    );
  }

  if (!espacio) {
    notFound();
  }

  return (
    <main className="p-6 md:p-10">
      <Link
        href="/admin/alojamientos"
        className="text-sm font-semibold text-[#286453] hover:underline"
      >
        ← Volver a alojamientos
      </Link>

      <div className="mb-8 mt-4">
        <p className="text-sm font-semibold uppercase tracking-wider text-[#286453]">
          Alojamiento
        </p>

        <h1 className="mt-2 text-4xl font-bold text-[#173f32]">
          {espacio.nombre}
        </h1>
      </div>

      <EditarAlojamientoForm
        espacio={{
          id: espacio.id,
          nombre: espacio.nombre,
          descripcion:
            espacio.descripcion ?? "",
          tipo: espacio.tipo,
          estado: espacio.estado,
          capacidad: Number(
            espacio.capacidad
          ),
          seccion: espacio.seccion,
          incluido_en_casa_completa:
            espacio.incluido_en_casa_completa,
        }}
      />
    </main>
  );
}