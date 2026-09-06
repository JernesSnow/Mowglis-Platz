import { NextResponse } from "next/server";

import { getAdminProfile } from "@/lib/auth/getAdminProfile";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { calcularNoDisponibles } from "@/lib/reservas/calcularNoDisponibles";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

type EditarReservaBody = {
  espacio_id?: number;
  fecha_inicio?: string;
  fecha_fin?: string;
  cantidad_huespedes?: number;
  incluye_desayuno?: boolean;

  nombre?: string;
  correo?: string;
  telefono?: string;
};

export async function PATCH(
  request: Request,
  { params }: RouteContext
) {
  try {
    // VALIDAR ADMIN

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

    const body: EditarReservaBody =
      await request.json();

    const espacioId = Number(body.espacio_id);

    const cantidadHuespedes = Number(
      body.cantidad_huespedes
    );

    const fechaInicio = String(
      body.fecha_inicio ?? ""
    );

    const fechaFin = String(
      body.fecha_fin ?? ""
    );

    const incluyeDesayuno =
      body.incluye_desayuno === true;

    const nombre = String(
      body.nombre ?? ""
    ).trim();

    const correo = String(
      body.correo ?? ""
    )
      .trim()
      .toLowerCase();

    const telefono = String(
      body.telefono ?? ""
    ).trim();

    // VALIDACIONES

    if (
      !Number.isInteger(espacioId) ||
      espacioId <= 0
    ) {
      return NextResponse.json(
        { error: "El alojamiento no es válido." },
        { status: 400 }
      );
    }

    if (
      !fechaInicio ||
      !fechaFin ||
      fechaFin <= fechaInicio
    ) {
      return NextResponse.json(
        { error: "Las fechas no son válidas." },
        { status: 400 }
      );
    }

    if (
      !Number.isInteger(cantidadHuespedes) ||
      cantidadHuespedes <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "La cantidad de huéspedes no es válida.",
        },
        { status: 400 }
      );
    }

    if (!nombre || !correo) {
      return NextResponse.json(
        {
          error:
            "Nombre y correo son obligatorios.",
        },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdmin();

    // OBTENER RESERVA ACTUAL

    const {
      data: reservaActual,
      error: reservaActualError,
    } = await supabase
      .from("reserva")
      .select(`
        id,
        estado,
        cliente_id
      `)
      .eq("id", reservaId)
      .maybeSingle();

    if (reservaActualError) {
      console.error(reservaActualError);

      return NextResponse.json(
        {
          error:
            "No fue posible consultar la reservación.",
        },
        { status: 500 }
      );
    }

    if (!reservaActual) {
      return NextResponse.json(
        { error: "La reservación no existe." },
        { status: 404 }
      );
    }

    if (
      reservaActual.estado === "cancelada" ||
      reservaActual.estado === "completada"
    ) {
      return NextResponse.json(
        {
          error:
            "Esta reservación ya no puede editarse.",
        },
        { status: 409 }
      );
    }

    // ESPACIO SELECCIONADO

    const { data: espacio, error: espacioError } =
      await supabase
        .from("espacios")
        .select(`
          id,
          nombre,
          capacidad,
          max_mascotas
        `)
        .eq("id", espacioId)
        .eq("estado", "activo")
        .maybeSingle();

    if (espacioError || !espacio) {
      return NextResponse.json(
        {
          error:
            "El alojamiento seleccionado no está disponible.",
        },
        { status: 404 }
      );
    }

    if (
      cantidadHuespedes > espacio.capacidad
    ) {
      return NextResponse.json(
        {
          error: `Este alojamiento admite un máximo de ${espacio.capacidad} huéspedes.`,
        },
        { status: 400 }
      );
    }

    // TARIFA

    const { data: tarifa, error: tarifaError } =
      await supabase
        .from("tarifas")
        .select(`
          id,
          precio_por_noche
        `)
        .eq("espacio_id", espacioId)
        .eq(
          "cantidad_huespedes",
          cantidadHuespedes
        )
        .eq(
          "incluye_desayuno",
          incluyeDesayuno
        )
        .eq("activo", true)
        .maybeSingle();

    if (tarifaError) {
      console.error(tarifaError);

      return NextResponse.json(
        {
          error:
            "No fue posible consultar la tarifa.",
        },
        { status: 500 }
      );
    }

    if (!tarifa) {
      return NextResponse.json(
        {
          error:
            "No existe una tarifa activa para esta combinación.",
        },
        { status: 400 }
      );
    }

    // TODOS LOS ESPACIOS

    const {
      data: espacios,
      error: espaciosError,
    } = await supabase
      .from("espacios")
      .select(`
        id,
        tipo,
        incluido_en_casa_completa,
        seccion
      `)
      .eq("estado", "activo");

    if (espaciosError || !espacios) {
      return NextResponse.json(
        {
          error:
            "No fue posible validar la disponibilidad.",
        },
        { status: 500 }
      );
    }

    // OTRAS RESERVAS QUE CHOCAN
    // ignoramos la reserva que estamos editando.

    const {
      data: reservas,
      error: reservasError,
    } = await supabase
      .from("reserva")
      .select("id, espacio_id")
      .neq("id", reservaId)
      .neq("estado", "cancelada")
      .lt("fecha_inicio", fechaFin)
      .gt("fecha_fin", fechaInicio);

    if (reservasError) {
      console.error(reservasError);

      return NextResponse.json(
        {
          error:
            "No fue posible validar las reservaciones existentes.",
        },
        { status: 500 }
      );
    }

    // BLOQUEOS

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
            "No fue posible validar los bloqueos.",
        },
        { status: 500 }
      );
    }

    // DISPONIBILIDAD

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
            "El alojamiento seleccionado no está disponible para las nuevas fechas.",
        },
        { status: 409 }
      );
    }

    // CALCULAR TOTAL

    const inicio = new Date(
      `${fechaInicio}T00:00:00Z`
    );

    const fin = new Date(
      `${fechaFin}T00:00:00Z`
    );

    const cantidadNoches =
      (fin.getTime() - inicio.getTime()) /
      (1000 * 60 * 60 * 24);

    if (
      !Number.isInteger(cantidadNoches) ||
      cantidadNoches <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "La cantidad de noches no es válida.",
        },
        { status: 400 }
      );
    }

    const precioPorNoche = Number(
      tarifa.precio_por_noche
    );

    const total =
      precioPorNoche * cantidadNoches;

    // ACTUALIZAR CLIENTE

    const { error: clienteError } =
      await supabase
        .from("cliente")
        .update({
          nombre,
          correo,
          telefono: telefono || null,
        })
        .eq(
          "id",
          reservaActual.cliente_id
        );

    if (clienteError) {
      console.error(clienteError);

      return NextResponse.json(
        {
          error:
            "No fue posible actualizar los datos del cliente.",
        },
        { status: 500 }
      );
    }

    // ACTUALIZAR RESERVA

    const {
      data: reservaActualizada,
      error: actualizarError,
    } = await supabase
      .from("reserva")
      .update({
        espacio_id: espacioId,

        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,

        cantidad_huespedes:
          cantidadHuespedes,

        incluye_desayuno:
          incluyeDesayuno,

        precio_por_noche:
          precioPorNoche,

        total,
      })
      .eq("id", reservaId)
      .select(`
        id,
        codigo_reserva,
        estado,
        fecha_inicio,
        fecha_fin,
        precio_por_noche,
        total
      `)
      .single();

    if (
      actualizarError ||
      !reservaActualizada
    ) {
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
      message:
        "Reservación actualizada correctamente.",
      reserva: reservaActualizada,
    });
  } catch (error) {
    console.error(
      "Error editando reservación:",
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