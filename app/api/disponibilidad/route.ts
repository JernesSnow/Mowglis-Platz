import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const fechaInicio = searchParams.get("fecha_inicio");
    const fechaFin = searchParams.get("fecha_fin");
    const huespedes = Number(searchParams.get("huespedes"));

    if (!fechaInicio || !fechaFin) {
      return NextResponse.json(
        { error: "Debe indicar las fechas de entrada y salida." },
        { status: 400 }
      );
    }

    if (!Number.isInteger(huespedes) || huespedes <= 0) {
      return NextResponse.json(
        { error: "La cantidad de huéspedes no es válida." },
        { status: 400 }
      );
    }

    if (fechaFin <= fechaInicio) {
      return NextResponse.json(
        { error: "La fecha de salida debe ser posterior a la entrada." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Obtener espacios activos

    const { data: espacios, error: espaciosError } = await supabase
      .from("espacios")
      .select(`
        id,
        nombre,
        descripcion,
        capacidad,
        tipo,
        incluido_en_casa_completa,
        precio_persona_extra,
        precio_mascota,
        max_mascotas
      `)
      .eq("estado", "activo")
      .order("id");

    if (espaciosError) {
      console.error(espaciosError);

      return NextResponse.json(
        { error: "No fue posible consultar los alojamientos." },
        { status: 500 }
      );
    }

    if (!espacios) {
      return NextResponse.json({ espacios: [] });
    }

    /*Obtener reservas que chocan con las fechas
    Choque:
    existente.inicio < nueva.fecha_fin
    existente.fin > nueva.fecha_inicio
    Esto permite:
    check-out 10 → nuevo check-in 10
    */
    const { data: reservas, error: reservasError } = await supabase
      .from("reserva")
      .select("id, espacio_id, fecha_inicio, fecha_fin, estado")
      .neq("estado", "cancelada")
      .lt("fecha_inicio", fechaFin)
      .gt("fecha_fin", fechaInicio);

    if (reservasError) {
      console.error(reservasError);

      return NextResponse.json(
        { error: "No fue posible consultar las reservaciones." },
        { status: 500 }
      );
    }

    // Obtener bloqueos que chocan con las fechas
    // Airbnb + manuales

    const { data: bloqueos, error: bloqueosError } = await supabase
      .from("bloqueo_espacio")
      .select("id, espacio_id, fecha_inicio, fecha_fin, origen")
      .lt("fecha_inicio", fechaFin)
      .gt("fecha_fin", fechaInicio);

    if (bloqueosError) {
      console.error(bloqueosError);

      return NextResponse.json(
        { error: "No fue posible consultar los bloqueos." },
        { status: 500 }
      );
    }

    const espaciosOcupadosDirectamente = new Set<number>();

    reservas?.forEach((reserva) => {
      espaciosOcupadosDirectamente.add(reserva.espacio_id);
    });

    bloqueos?.forEach((bloqueo) => {
      espaciosOcupadosDirectamente.add(bloqueo.espacio_id);
    });

    // Identificar Casa completa

    const casaCompleta = espacios.find(
      (espacio) => espacio.tipo === "casa_completa"
    );

    const habitacionesInternas = espacios.filter(
      (espacio) => espacio.incluido_en_casa_completa === true
    );

    const algunaHabitacionInternaOcupada =
      habitacionesInternas.some((habitacion) =>
        espaciosOcupadosDirectamente.has(habitacion.id)
      );

    const casaCompletaOcupada =
      casaCompleta !== undefined &&
      espaciosOcupadosDirectamente.has(casaCompleta.id);

    // Calcular disponibilidad

    const resultado = espacios.map((espacio) => {
      let disponible = true;
      let motivo: string | null = null;

      // Capacidad insuficiente
      if (huespedes > espacio.capacidad) {
        disponible = false;
        motivo = `Capacidad máxima: ${espacio.capacidad} huéspedes`;
      }

      // Ocupación directa
      else if (espaciosOcupadosDirectamente.has(espacio.id)) {
        disponible = false;
        motivo = "No disponible para las fechas seleccionadas";
      }

      // Si buscamos Casa completa y alguna habitación interna está ocupada
      else if (
        espacio.tipo === "casa_completa" &&
        algunaHabitacionInternaOcupada
      ) {
        disponible = false;
        motivo =
          "Una habitación de la casa ya está reservada para estas fechas";
      }

      // Si buscamos habitación interna y Casa completa está ocupada
      else if (
        espacio.incluido_en_casa_completa === true &&
        casaCompletaOcupada
      ) {
        disponible = false;
        motivo =
          "La casa completa está reservada para estas fechas";
      }

      return {
        ...espacio,
        disponible,
        motivo,
      };
    });

    return NextResponse.json({
      espacios: resultado,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Ocurrió un error inesperado." },
      { status: 500 }
    );
  }
}