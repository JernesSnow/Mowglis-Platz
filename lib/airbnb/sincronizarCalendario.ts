import * as ical from "node-ical";

import { createSupabaseAdmin } from "@/lib/supabase/admin";

function fechaUTC(fecha: Date) {
  return fecha.toISOString().slice(0, 10);
}

export async function sincronizarCalendarioAirbnb(
  calendarioId: number
) {
  const supabase = createSupabaseAdmin();

  // OBTENER CALENDARIO

  const {
    data: calendario,
    error: calendarioError,
  } = await supabase
    .from("calendarios_externos")
    .select(`
      id,
      espacio_id,
      proveedor,
      url_ical,
      activo
    `)
    .eq("id", calendarioId)
    .maybeSingle();

  if (calendarioError) {
    throw calendarioError;
  }

  if (!calendario) {
    throw new Error(
      "El calendario externo no existe."
    );
  }

  if (!calendario.activo) {
    throw new Error(
      "El calendario externo está desactivado."
    );
  }

  if (calendario.proveedor !== "airbnb") {
    throw new Error(
      "Este calendario no pertenece a Airbnb."
    );
  }

  // DESCARGAR ICS

  const response = await fetch(
    calendario.url_ical,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      `Airbnb respondió con estado ${response.status}.`
    );
  }

  const contenidoICS = await response.text();

  // LEER EVENTOS
  
  const calendarioICS =
    await ical.async.parseICS(
      contenidoICS
    );

  const eventos = Object.values(
  calendarioICS
).filter(
  (evento): evento is ical.VEvent =>
    evento !== undefined &&
    evento.type === "VEVENT"
);

  const eventosValidos: {
    uid: string;
    fechaInicio: string;
    fechaFin: string;
    motivo: string;
  }[] = [];

  for (const evento of eventos) {
    if (
      !evento.uid ||
      !evento.start ||
      !evento.end
    ) {
      continue;
    }

    const fechaInicio = fechaUTC(
      evento.start
    );

    const fechaFin = fechaUTC(
      evento.end
    );

    if (fechaFin <= fechaInicio) {
      continue;
    }

    eventosValidos.push({
      uid: String(evento.uid),
      fechaInicio,
      fechaFin,

      motivo:
        evento.summary
          ? String(evento.summary).slice(
              0,
              50
            )
          : "Reserva Airbnb",
    });
  }

  // INSERTAR / ACTUALIZAR BLOQUEOS

  for (const evento of eventosValidos) {
    const {
      error: upsertError,
    } = await supabase
      .from("bloqueo_espacio")
      .upsert(
        {
          espacio_id:
            calendario.espacio_id,

          fecha_inicio:
            evento.fechaInicio,

          fecha_fin:
            evento.fechaFin,

          motivo:
            evento.motivo,

          origen: "airbnb",

          uid_externo:
            evento.uid,
        },
        {
          onConflict:
            "espacio_id,uid_externo",
        }
      );

    if (upsertError) {
      console.error(
        "Error sincronizando evento:",
        evento.uid,
        upsertError
      );

      throw upsertError;
    }
  }

  // ELIMINAR BLOQUEOS AIRBNB QUE YA NO EXISTEN

  const uidsActuales =
    eventosValidos.map(
      (evento) => evento.uid
    );

  const {
    data: bloqueosExistentes,
    error: bloqueosError,
  } = await supabase
    .from("bloqueo_espacio")
    .select(`
      id,
      uid_externo
    `)
    .eq(
      "espacio_id",
      calendario.espacio_id
    )
    .eq("origen", "airbnb");

  if (bloqueosError) {
    throw bloqueosError;
  }

  const bloqueosAEliminar =
    bloqueosExistentes?.filter(
      (bloqueo) =>
        bloqueo.uid_externo &&
        !uidsActuales.includes(
          bloqueo.uid_externo
        )
    ) ?? [];

  if (bloqueosAEliminar.length > 0) {
    const ids = bloqueosAEliminar.map(
      (bloqueo) => bloqueo.id
    );

    const { error: eliminarError } =
      await supabase
        .from("bloqueo_espacio")
        .delete()
        .in("id", ids);

    if (eliminarError) {
      throw eliminarError;
    }
  }

  // FECHA DE ÚLTIMA SINCRONIZACIÓN

  const {
    error: actualizarCalendarioError,
  } = await supabase
    .from("calendarios_externos")
    .update({
      ultima_sincronizacion:
        new Date().toISOString(),
    })
    .eq("id", calendario.id);

  if (actualizarCalendarioError) {
    throw actualizarCalendarioError;
  }

  return {
    eventosProcesados:
      eventosValidos.length,

    eventosEliminados:
      bloqueosAEliminar.length,
  };
}