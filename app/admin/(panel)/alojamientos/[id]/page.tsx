import Link from "next/link";
import { notFound } from "next/navigation";

import EditarAlojamientoForm from "@/components/admin/EditarAlojamientoForm";
import SubirImagenAlojamientoForm from "@/components/admin/SubirImagenAlojamientoForm";
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

  const {
    data: imagenes,
    error: imagenesError,
  } = await supabase
    .from("imagenes")
    .select(`
      id,
      url,
      alt_text,
      orden,
      es_principal
    `)
  .eq("espacio_id", espacioId)
  .order("orden");

  if (imagenesError) {
  console.error(
    "Error cargando imágenes:",
    imagenesError
  );
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

      <section className="mt-8">
        <div className="mb-5">
          <h2 className="text-2xl font-bold text-[#173f32]">
            Fotografías
          </h2>

          <p className="mt-1 text-gray-600">
            Gestiona las imágenes que se mostrarán
            públicamente para este alojamiento.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
          <div>
            {!imagenes ||
            imagenes.length === 0 ? (
              <div className="rounded-2xl bg-white p-8 text-gray-500 shadow-sm">
                Todavía no hay fotografías.
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2">
                {imagenes.map((imagen) => (
                  <article
                    key={imagen.id}
                    className="overflow-hidden rounded-2xl bg-white shadow-sm"
                  >
                    <div className="relative aspect-[4/3]">
                      <img
                        src={imagen.url}
                        alt={
                          imagen.alt_text ??
                          espacio.nombre
                        }
                        className="h-full w-full object-cover"
                      />

                      {imagen.es_principal && (
                        <span className="absolute left-3 top-3 rounded-full bg-[#173f32] px-3 py-1 text-xs font-semibold text-white">
                          Principal
                        </span>
                      )}
                    </div>

                    <div className="p-4">
                      <p className="text-sm text-gray-600">
                        {imagen.alt_text ||
                          "Sin descripción"}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          <SubirImagenAlojamientoForm
            espacioId={espacio.id}
          />
        </div>
      </section>
    </main>
  );
}