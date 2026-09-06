import { NextResponse } from "next/server";

import { getAdminProfile } from "@/lib/auth/getAdminProfile";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { calcularNoDisponibles } from "@/lib/reservas/calcularNoDisponibles";

type CrearBloqueoBody = {
  espacio_id?: number;
  fecha_inicio?: string;
  fecha_fin?: string;
  motivo?: string;
};

export async function POST(request: Request) {
  try {
    // VALIDAR ADMIN

    const admin = await getAdminProfile();

    if (!admin) {
      return NextResponse.json(
        { error: "No autorizado." },
        { status: 401 }
      );
    }

    const body: CrearBloqueoBody =
      await request.json();

    const espacioId = Number(body.espacio_id);

    const fechaInicio = String(
      body.fecha_inicio ?? ""
    );

    const fechaFin = String(
      body.fecha_fin ?? ""
    );

    const motivo = String(
      body.motivo ?? ""
    ).trim();

    // VALIDACIONES

    if (
      !Number.isInteger(espacioId) ||
      espacioId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "El alojamiento seleccionado no es válido.",
        },
        { status: 400 }
      );
    }

    if (
      !fechaInicio ||
      !fechaFin ||
      fechaFin <= fechaInicio
    ) {
      return NextResponse.json(
        {
          error:
            "Las fechas seleccionadas no son válidas.",
        },
        { status: 400 }
      );
    }

    if (!motivo) {
      return NextResponse.json(
        {
          error:
            "Debe indicar el motivo del bloqueo.",
        },
        { status: 400 }
      );
    }

    if (motivo.length > 50) {
      return NextResponse.json(
        {
          error:
            "El motivo no puede superar los 50 caracteres.",
        },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdmin();

    // TODOS LOS ESPACIOS ACTIVOS

    const {
      data: espacios,
      error: espaciosError,
    } = await supabase
      .from("espacios")
      .select(`
        id,
        nombre,
        tipo,
        incluido_en_casa_completa,
        seccion
      `)
      .eq("estado", "activo");

    if (espaciosError || !espacios) {
      return NextResponse.json(
        {
          error:
            "No fue posible consultar los alojamientos.",
        },
        { status: 500 }
      );
    }

    const espacioSeleccionado = espacios.find(
      (espacio) => espacio.id === espacioId
    );

    if (!espacioSeleccionado) {
      return NextResponse.json(
        {
          error:
            "El alojamiento seleccionado no existe o está inactivo.",
        },
        { status: 404 }
      );
    }

    // RESERVAS EXISTENTES QUE CHOCAN

    const {
      data: reservas,
      error: reservasError,
    } = await supabase
      .from("reserva")
      .select("espacio_id")
      .neq("estado", "cancelada")
      .lt("fecha_inicio", fechaFin)
      .gt("fecha_fin", fechaInicio);

    if (reservasError) {
      console.error(reservasError);

      return NextResponse.json(
        {
          error:
            "No fue posible validar las reservaciones.",
        },
        { status: 500 }
      );
    }

    // BLOQUEOS EXISTENTES QUE CHOCAN

    const {
      data: bloqueos,
      error: bloqueosError,
    } = await supabase
      .from("bloqueo_espacio")
      .select("espacio_id")
      .lt("fecha_inicio", fechaFin)
      .gt("fecha_fin", fechaInicio);

    if (bloqueosError) {
      console.error(bloqueosError);

      return NextResponse.json(
        {
          error:
            "No fue posible validar los bloqueos existentes.",
        },
        { status: 500 }
      );
    }

    // OCUPACIONES

    const ocupadosDirectamente =
      new Set<number>();

    reservas?.forEach((reserva) => {
      ocupadosDirectamente.add(
        reserva.espacio_id
      );
    });

    bloqueos?.forEach((bloqueo) => {
      ocupadosDirectamente.add(
        bloqueo.espacio_id
      );
    });

    const noDisponibles =
      calcularNoDisponibles(
        espacios,
        ocupadosDirectamente
      );

    if (noDisponibles.has(espacioId)) {
      return NextResponse.json(
        {
          error:
            "Ese alojamiento ya tiene una reservación o bloqueo relacionado para las fechas seleccionadas.",
        },
        { status: 409 }
      );
    }

    // CREAR BLOQUEO

    const {
      data: bloqueo,
      error: crearError,
    } = await supabase
      .from("bloqueo_espacio")
      .insert({
        espacio_id: espacioId,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        motivo,
        origen: "manual",
        uid_externo: null,
      })
      .select(`
        id,
        espacio_id,
        fecha_inicio,
        fecha_fin,
        motivo,
        origen
      `)
      .single();

    if (crearError || !bloqueo) {
      console.error(crearError);

      return NextResponse.json(
        {
          error:
            "No fue posible crear el bloqueo.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message:
          "Bloqueo creado correctamente.",
        bloqueo,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Error creando bloqueo:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Ocurrió un error inesperado.",
      },
      { status: 500 }
    );
  }
}