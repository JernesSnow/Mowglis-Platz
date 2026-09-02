import { NextResponse } from "next/server";

import { getAdminProfile } from "@/lib/auth/getAdminProfile";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { enviarConfirmacionReserva } from "@/lib/email/enviarConfirmacionReserva";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(
  request: Request,
  { params }: RouteContext
) {
  try {
    const admin = await getAdminProfile();

    if (!admin) {
      return NextResponse.json(
        { error: "No autorizado." },
        { status: 401 }
      );
    }

    const { id } = await params;

    const reservaId = Number(id);

    if (!Number.isInteger(reservaId)) {
      return NextResponse.json(
        { error: "Reservación inválida." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdmin();

    const { data: reserva, error } =
      await supabase
        .from("reserva")
        .select(`
          id,
          codigo_reserva,
          fecha_inicio,
          fecha_fin,
          cantidad_huespedes,
          incluye_desayuno,
          total,
          estado,
          espacios (
            nombre
          ),
          cliente (
            nombre,
            correo
          )
        `)
        .eq("id", reservaId)
        .maybeSingle();

    if (error) {
      console.error(error);

      return NextResponse.json(
        {
          error:
            "No fue posible consultar la reservación.",
        },
        { status: 500 }
      );
    }

    if (!reserva) {
      return NextResponse.json(
        { error: "La reservación no existe." },
        { status: 404 }
      );
    }

    const alojamiento = Array.isArray(
      reserva.espacios
    )
      ? reserva.espacios[0]
      : reserva.espacios;

    const cliente = Array.isArray(
      reserva.cliente
    )
      ? reserva.cliente[0]
      : reserva.cliente;

    if (!cliente?.correo) {
      return NextResponse.json(
        {
          error:
            "La reservación no tiene un correo válido.",
        },
        { status: 400 }
      );
    }

    await enviarConfirmacionReserva({
      correo: cliente.correo,
      nombre:
        cliente.nombre ?? "Huésped",
      codigoReserva:
        reserva.codigo_reserva,
      alojamiento:
        alojamiento?.nombre ??
        "Mowgli's Platz",
      fechaInicio:
        reserva.fecha_inicio,
      fechaFin:
        reserva.fecha_fin,
      cantidadHuespedes:
        reserva.cantidad_huespedes,
      incluyeDesayuno:
        reserva.incluye_desayuno,
      total: Number(reserva.total),
      estado: reserva.estado,
    });

    return NextResponse.json({
      message:
        "Correo reenviado correctamente.",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          "No fue posible reenviar el correo.",
      },
      { status: 500 }
    );
  }
}