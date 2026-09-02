import { NextResponse } from "next/server";

import { getAdminProfile } from "@/lib/auth/getAdminProfile";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function PATCH(
  request: Request,
  { params }: RouteContext
) {
  try {
    // VALIDAR ADMINISTRADOR

    const admin = await getAdminProfile();

    if (!admin) {
      return NextResponse.json(
        { error: "No autorizado." },
        { status: 401 }
      );
    }

    // DATOS

    const { id } = await params;

    const reservaId = Number(id);

    if (!Number.isInteger(reservaId)) {
      return NextResponse.json(
        { error: "Reservación inválida." },
        { status: 400 }
      );
    }

    const body = await request.json();

    const nuevoEstado = String(
      body?.estado ?? ""
    ).trim();

    if (
      nuevoEstado !== "confirmada" &&
      nuevoEstado !== "cancelada"
    ) {
      return NextResponse.json(
        { error: "Estado no permitido." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdmin();

    // BUSCAR RESERVA

    const {
      data: reservaActual,
      error: reservaError,
    } = await supabase
      .from("reserva")
      .select(`
        id,
        estado,
        codigo_reserva
      `)
      .eq("id", reservaId)
      .maybeSingle();

    if (reservaError) {
      console.error(reservaError);

      return NextResponse.json(
        { error: "No fue posible consultar la reservación." },
        { status: 500 }
      );
    }

    if (!reservaActual) {
      return NextResponse.json(
        { error: "La reservación no existe." },
        { status: 404 }
      );
    }

    // VALIDAR TRANSICIÓN

    if (reservaActual.estado === "cancelada") {
      return NextResponse.json(
        {
          error:
            "Una reservación cancelada no puede modificarse.",
        },
        { status: 409 }
      );
    }

    if (reservaActual.estado === "completada") {
      return NextResponse.json(
        {
          error:
            "Una reservación completada no puede modificarse.",
        },
        { status: 409 }
      );
    }

    if (
      nuevoEstado === "confirmada" &&
      reservaActual.estado !== "pendiente"
    ) {
      return NextResponse.json(
        {
          error:
            "Solo una reservación pendiente puede confirmarse.",
        },
        { status: 409 }
      );
    }

    // ACTUALIZAR

    const {
      data: reservaActualizada,
      error: actualizarError,
    } = await supabase
      .from("reserva")
      .update({
        estado: nuevoEstado,
      })
      .eq("id", reservaId)
      .select(`
        id,
        codigo_reserva,
        estado
      `)
      .single();

    if (actualizarError || !reservaActualizada) {
      console.error(actualizarError);

      return NextResponse.json(
        {
          error:
            "No fue posible actualizar la reservación.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Reservación actualizada correctamente.",
      reserva: reservaActualizada,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Ocurrió un error inesperado." },
      { status: 500 }
    );
  }
}