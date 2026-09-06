import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { calcularNoDisponibles } from "@/lib/reservas/calcularNoDisponibles";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const fechaInicio = searchParams.get("fecha_inicio");
    const fechaFin = searchParams.get("fecha_fin");
    const huespedes = Number(searchParams.get("huespedes"));

    // VALIDACIONES

    if (!fechaInicio || !fechaFin) {
      return NextResponse.json(
        { error: "Debe indicar las fechas de entrada y salida." },
        { status: 400 }
      );
    }

    if (fechaFin <= fechaInicio) {
      return NextResponse.json(
        { error: "La fecha de salida debe ser posterior a la entrada." },
        { status: 400 }
      );
    }

    if (!Number.isInteger(huespedes) || huespedes <= 0) {
      return NextResponse.json(
        { error: "La cantidad de huéspedes no es válida." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // OBTENER ESPACIOS ACTIVOS

    const { data: espacios, error: espaciosError } = await supabase
      .from("espacios")
      .select(`
        id,
        nombre,
        descripcion,
        capacidad,
        tipo,
        incluido_en_casa_completa,
        seccion,
        precio_persona_extra,
        precio_mascota,
        max_mascotas
      `)
      .eq("estado", "activo")
      .order("id");

    if (espaciosError) {
      console.error("Error cargando espacios:", espaciosError);

      return NextResponse.json(
        { error: "No fue posible consultar los alojamientos." },
        { status: 500 }
      );
    }

    if (!espacios) {
      return NextResponse.json({ espacios: [] });
    }

    // RESERVAS QUE CHOCAN

    const { data: reservas, error: reservasError } = await supabase
      .from("reserva")
      .select("id, espacio_id, fecha_inicio, fecha_fin, estado")
      .neq("estado", "cancelada")
      .lt("fecha_inicio", fechaFin)
      .gt("fecha_fin", fechaInicio);

    if (reservasError) {
      console.error("Error consultando reservas:", reservasError);

      return NextResponse.json(
        { error: "No fue posible consultar las reservaciones." },
        { status: 500 }
      );
    }

    // BLOQUEOS MANUALES / AIRBNB

    const { data: bloqueos, error: bloqueosError } = await supabase
      .from("bloqueo_espacio")
      .select("id, espacio_id, fecha_inicio, fecha_fin, origen")
      .lt("fecha_inicio", fechaFin)
      .gt("fecha_fin", fechaInicio);

    if (bloqueosError) {
      console.error("Error consultando bloqueos:", bloqueosError);

      return NextResponse.json(
        { error: "No fue posible consultar los bloqueos." },
        { status: 500 }
      );
    }

        // OCUPACIONES DIRECTAS

    const ocupadosDirectamente = new Set<number>();

    reservas?.forEach((reserva) => {
      ocupadosDirectamente.add(reserva.espacio_id);
    });

    bloqueos?.forEach((bloqueo) => {
      ocupadosDirectamente.add(bloqueo.espacio_id);
    });

    // ESPACIOS NECESARIOS PARA LOS MENSAJES DEL FRONTEND

    const secciones = espacios.filter(
      (espacio) => espacio.tipo === "seccion"
    );

    const habitacionesIndividuales = espacios.filter(
      (espacio) =>
        espacio.tipo === "habitacion_individual" &&
        espacio.incluido_en_casa_completa === true
    );

    // CALCULAR BLOQUEOS DERIVADOS

    const noDisponibles = calcularNoDisponibles(
      espacios,
      ocupadosDirectamente
    );

   // RESPUESTA PARA EL FRONTEND

  const resultado = espacios.map((espacio) => {
  // Capacidad

  if (huespedes > espacio.capacidad) {
    return {
      ...espacio,
      disponible: false,
      motivo: `Capacidad máxima: ${espacio.capacidad} huéspedes`,
    };
  }

  // Disponible

  if (!noDisponibles.has(espacio.id)) {
    return {
      ...espacio,
      disponible: true,
      motivo: null,
    };
  }

  // Ocupado directamente

  if (ocupadosDirectamente.has(espacio.id)) {
    return {
      ...espacio,
      disponible: false,
      motivo: "No disponible para las fechas seleccionadas",
    };
  }

  // SECCIÓN

  if (espacio.tipo === "seccion") {
    const habitacionIndividualOcupada =
      habitacionesIndividuales.some(
        (habitacion) =>
          habitacion.seccion === espacio.seccion &&
          ocupadosDirectamente.has(habitacion.id)
      );

    return {
      ...espacio,
      disponible: false,
      motivo: habitacionIndividualOcupada
        ? "La habitación individual de esta sección ya está reservada"
        : "La casa está reservada para estas fechas",
    };
  }

  // HABITACIÓN INDIVIDUAL

  if (espacio.tipo === "habitacion_individual") {
    const seccionOcupada = secciones.some(
      (seccion) =>
        seccion.seccion === espacio.seccion &&
        ocupadosDirectamente.has(seccion.id)
    );

    return {
      ...espacio,
      disponible: false,
      motivo: seccionOcupada
        ? "La sección a la que pertenece ya está reservada"
        : "La casa está reservada para estas fechas",
    };
  }

  // CASA

  if (espacio.tipo === "casa_completa") {
    return {
      ...espacio,
      disponible: false,
      motivo:
        "Una sección o habitación de la casa ya está reservada",
    };
  }

  // ESTUDIO

  if (espacio.tipo === "estudio") {
    return {
      ...espacio,
      disponible: false,
      motivo:
        "La propiedad completa con estudio ya está reservada",
    };
  }

  // CASA + ESTUDIO

  if (espacio.tipo === "casa_completa_estudio") {
    return {
      ...espacio,
      disponible: false,
      motivo:
        "Parte de la propiedad ya está reservada para estas fechas",
    };
  }

  return {
    ...espacio,
    disponible: false,
    motivo: "No disponible para las fechas seleccionadas",
  };
});

return NextResponse.json({
  espacios: resultado,
});
  } catch (error) {
    console.error("Error inesperado:", error);

    return NextResponse.json(
      { error: "Ocurrió un error inesperado." },
      { status: 500 }
    );
  }
}