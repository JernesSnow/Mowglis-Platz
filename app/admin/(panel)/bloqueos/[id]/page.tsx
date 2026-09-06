import Link from "next/link";
import { notFound } from "next/navigation";

import { createSupabaseAdmin } from "@/lib/supabase/admin";
import EliminarBloqueoButton from "@/components/admin/EliminarBloqueoButton";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function BloqueoDetallePage({
  params,
}: PageProps) {
  const { id } = await params;

  const bloqueoId = Number(id);

  if (
    !Number.isInteger(bloqueoId) ||
    bloqueoId <= 0
  ) {
    notFound();
  }

  const supabase = createSupabaseAdmin();

  const {
    data: bloqueo,
    error,
  } = await supabase
    .from("bloqueo_espacio")
    .select(`
      id,
      fecha_inicio,
      fecha_fin,
      motivo,
      origen,
      uid_externo,
      created_at,
      espacios (
        id,
        nombre
      )
    `)
    .eq("id", bloqueoId)
    .maybeSingle();

  if (error) {
    console.error(
      "Error cargando bloqueo:",
      error
    );

    return (
      <main className="p-6 md:p-10">
        <div className="rounded-2xl bg-red-50 p-5 text-red-700">
          No fue posible cargar el bloqueo.
        </div>
      </main>
    );
  }

  if (!bloqueo) {
    notFound();
  }

  const alojamiento =
    Array.isArray(bloqueo.espacios)
      ? bloqueo.espacios[0]
      : bloqueo.espacios;

  return (
    <main className="p-6 md:p-10">
      <div className="mb-8">
        <Link
          href="/admin/calendario"
          className="text-sm font-semibold text-[#286453] hover:underline"
        >
          ← Volver al calendario
        </Link>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <h1 className="text-4xl font-bold text-[#173f32]">
            Detalle del bloqueo
          </h1>

          {bloqueo.origen ===
          "airbnb" ? (
            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
              Airbnb
            </span>
          ) : (
            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
              Manual
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* INFORMACIÓN PRINCIPAL */}

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-[#173f32]">
            Información
          </h2>

          <dl className="mt-6 space-y-5">
            <div>
              <dt className="text-sm text-gray-500">
                Alojamiento
              </dt>

              <dd className="mt-1 font-semibold text-[#173f32]">
                {alojamiento?.nombre ??
                  "Sin alojamiento"}
              </dd>
            </div>

            <div>
              <dt className="text-sm text-gray-500">
                Desde
              </dt>

              <dd className="mt-1 font-semibold text-[#173f32]">
                {bloqueo.fecha_inicio}
              </dd>
            </div>

            <div>
              <dt className="text-sm text-gray-500">
                Hasta
              </dt>

              <dd className="mt-1 font-semibold text-[#173f32]">
                {bloqueo.fecha_fin}
              </dd>
            </div>

            <div>
              <dt className="text-sm text-gray-500">
                Motivo
              </dt>

              <dd className="mt-1 font-semibold text-[#173f32]">
                {bloqueo.motivo ??
                  "Sin motivo"}
              </dd>
            </div>
          </dl>
        </section>

        {/* INFORMACIÓN DEL SISTEMA */}

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-[#173f32]">
            Información del sistema
          </h2>

          <dl className="mt-6 space-y-5">
            <div>
              <dt className="text-sm text-gray-500">
                Origen
              </dt>

              <dd className="mt-1 font-semibold text-[#173f32]">
                {bloqueo.origen ===
                "airbnb"
                  ? "Airbnb"
                  : "Bloqueo manual"}
              </dd>
            </div>

            <div>
              <dt className="text-sm text-gray-500">
                ID
              </dt>

              <dd className="mt-1 font-semibold text-[#173f32]">
                #{bloqueo.id}
              </dd>
            </div>

            {bloqueo.origen ===
              "airbnb" &&
              bloqueo.uid_externo && (
                <div>
                  <dt className="text-sm text-gray-500">
                    Identificador externo
                  </dt>

                  <dd className="mt-1 break-all text-sm font-medium text-[#173f32]">
                    {bloqueo.uid_externo}
                  </dd>
                </div>
              )}

            <div>
              <dt className="text-sm text-gray-500">
                Registrado
              </dt>

              <dd className="mt-1 font-semibold text-[#173f32]">
                {new Date(
                  bloqueo.created_at
                ).toLocaleString(
                  "es-CR"
                )}
              </dd>
            </div>
          </dl>
        </section>
      </div>

      {/* ACCIONES */}

      {bloqueo.origen ===
        "manual" && (
        <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-[#173f32]">
            Acciones
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Al eliminar el bloqueo, las
            fechas volverán a estar disponibles
            siempre que no exista otra
            reservación o bloqueo relacionado.
          </p>

          <div className="mt-5">
            <EliminarBloqueoButton
              bloqueoId={bloqueo.id}
            />
          </div>
        </section>
      )}

      {bloqueo.origen ===
        "airbnb" && (
        <section className="mt-8 rounded-2xl bg-red-50 p-6">
          <h2 className="font-bold text-red-800">
            Bloqueo administrado por Airbnb
          </h2>

          <p className="mt-2 text-sm text-red-700">
            Este bloqueo no puede eliminarse
            manualmente. Se actualizará cuando
            se vuelva a sincronizar el
            calendario de Airbnb.
          </p>

          <Link
            href="/admin/integraciones"
            className="mt-4 inline-block font-semibold text-red-800 hover:underline"
          >
            Ir a Integraciones →
          </Link>
        </section>
      )}
    </main>
  );
}