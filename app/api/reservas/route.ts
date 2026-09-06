import { NextResponse } from "next/server";

import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { enviarConfirmacionReserva } from "@/lib/email/enviarConfirmacionReserva";
import { enviarAvisoAdministrador } from "@/lib/email/enviarAvisoAdministrador";
import { calcularNoDisponibles } from "@/lib/reservas/calcularNoDisponibles";

type ReservaBody = {
  espacio_id?: number;
  fecha_inicio?: string;
  fecha_fin?: string;
  cantidad_huespedes?: number;
  incluye_desayuno?: boolean;
  cantidad_mascotas?: number;

  nombre?: string;
  correo?: string;
  telefono?: string;
};

export async function POST(request: Request) {
  try {
    const body: ReservaBody = await request.json();

    const espacioId = Number(body.espacio_id);
    const cantidadHuespedes = Number(body.cantidad_huespedes);
    const cantidadMascotas = Number(body.cantidad_mascotas ?? 0);

    const fechaInicio = String(body.fecha_inicio ?? "");
    const fechaFin = String(body.fecha_fin ?? "");

    const incluyeDesayuno = Boolean(body.incluye_desayuno);

    const nombre = String(body.nombre ?? "").trim();
    const correo = String(body.correo ?? "")
      .trim()
      .toLowerCase();

    const telefono = String(body.telefono ?? "").trim();

    // VALIDACIONES BÁSICAS

    if (!Number.isInteger(espacioId) || espacioId <= 0) {
      return NextResponse.json(
        { error: "El alojamiento seleccionado no es válido." },
        { status: 400 }
      );
    }

    if (!fechaInicio || !fechaFin || fechaFin <= fechaInicio) {
      return NextResponse.json(
        { error: "Las fechas seleccionadas no son válidas." },
        { status: 400 }
      );
    }

    if (
      !Number.isInteger(cantidadHuespedes) ||
      cantidadHuespedes <= 0
    ) {
      return NextResponse.json(
        { error: "La cantidad de huéspedes no es válida." },
        { status: 400 }
      );
    }

    if (
      !Number.isInteger(cantidadMascotas) ||
      cantidadMascotas < 0
    ) {
      return NextResponse.json(
        { error: "La cantidad de mascotas no es válida." },
        { status: 400 }
      );
    }

    if (!nombre || !correo) {
      return NextResponse.json(
        { error: "Nombre y correo son obligatorios." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdmin();

    // OBTENER ESPACIO

    const { data: espacio, error: espacioError } = await supabase
      .from("espacios")
      .select(`
        id,
        nombre,
        capacidad,
        estado,
        tipo,
        incluido_en_casa_completa,
        precio_mascota,
        max_mascotas
      `)
      .eq("id", espacioId)
      .eq("estado", "activo")
      .single();

    if (espacioError || !espacio) {
      return NextResponse.json(
        { error: "El alojamiento no está disponible." },
        { status: 404 }
      );
    }

    if (cantidadHuespedes > espacio.capacidad) {
      return NextResponse.json(
        {
          error: `Este alojamiento admite un máximo de ${espacio.capacidad} huéspedes.`,
        },
        { status: 400 }
      );
    }

    if (cantidadMascotas > espacio.max_mascotas) {
      return NextResponse.json(
        {
          error: `Este alojamiento admite un máximo de ${espacio.max_mascotas} mascotas.`,
        },
        { status: 400 }
      );
    }

    // BUSCAR TARIFA EXACTA

    const { data: tarifa, error: tarifaError } = await supabase
      .from("tarifas")
      .select("id, precio_por_noche")
      .eq("espacio_id", espacioId)
      .eq("cantidad_huespedes", cantidadHuespedes)
      .eq("incluye_desayuno", incluyeDesayuno)
      .eq("activo", true)
      .maybeSingle();

    if (tarifaError) {
      console.error("Error consultando tarifa:", tarifaError);

      return NextResponse.json(
        { error: "No fue posible calcular la tarifa." },
        { status: 500 }
      );
    }

    if (!tarifa) {
      return NextResponse.json(
        {
          error:
            "Todavía no existe una tarifa definida para esta combinación.",
        },
        { status: 400 }
      );
    }

    // OBTENER TODOS LOS ESPACIOS

    const { data: espacios, error: espaciosError } = await supabase
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
        { error: "No fue posible validar la disponibilidad." },
        { status: 500 }
      );
    }

    // RESERVAS QUE CHOCAN

    const { data: reservas, error: reservasError } = await supabase
      .from("reserva")
      .select("espacio_id")
      .neq("estado", "cancelada")
      .lt("fecha_inicio", fechaFin)
      .gt("fecha_fin", fechaInicio);

    if (reservasError) {
      console.error(
        "Error consultando reservas:",
        reservasError
      );

      return NextResponse.json(
        {
          error:
            "No fue posible validar las reservaciones existentes.",
        },
        { status: 500 }
      );
    }

    // BLOQUEOS QUE CHOCAN

    const { data: bloqueos, error: bloqueosError } = await supabase
      .from("bloqueo_espacio")
      .select("espacio_id")
      .lt("fecha_inicio", fechaFin)
      .gt("fecha_fin", fechaInicio);

    if (bloqueosError) {
      console.error(
        "Error consultando bloqueos:",
        bloqueosError
      );

      return NextResponse.json(
        {
          error:
            "No fue posible validar los bloqueos existentes.",
        },
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

    // CALCULAR BLOQUEOS DERIVADOS

    const noDisponibles = calcularNoDisponibles(
      espacios,
      ocupadosDirectamente
    );

    // VALIDACIÓN FINAL

    if (noDisponibles.has(espacioId)) {
      return NextResponse.json(
        {
          error:
            "El alojamiento seleccionado ya no está disponible para esas fechas.",
        },
        { status: 409 }
      );
    }



    // CALCULAR NOCHES

    const inicio = new Date(`${fechaInicio}T00:00:00Z`);
    const fin = new Date(`${fechaFin}T00:00:00Z`);

    const cantidadNoches =
      (fin.getTime() - inicio.getTime()) /
      (1000 * 60 * 60 * 24);

    if (
      !Number.isInteger(cantidadNoches) ||
      cantidadNoches <= 0
    ) {
      return NextResponse.json(
        { error: "La cantidad de noches no es válida." },
        { status: 400 }
      );
    }

    const precioPorNoche = Number(tarifa.precio_por_noche);

    let total = precioPorNoche * cantidadNoches;

    /* MASCOTAS
    
     Todavía NO sumamos su precio porque nos falta
     confirmar si ₡10.000 es por noche o por estadía.
     Para evitar cobrar incorrectamente, por ahora no
     permitiremos finalizar una reserva con mascotas.*/

    if (cantidadMascotas > 0) {
      return NextResponse.json(
        {
          error:
            "La tarifa de mascotas todavía debe confirmarse antes de realizar esta reserva.",
        },
        { status: 400 }
      );
    }

    // CLIENTE

    const { data: clienteExistente, error: clienteBusquedaError } =
      await supabase
        .from("cliente")
        .select("id")
        .eq("correo", correo)
        .maybeSingle();

    if (clienteBusquedaError) {
      console.error(clienteBusquedaError);

      return NextResponse.json(
        { error: "No fue posible procesar los datos del cliente." },
        { status: 500 }
      );
    }

    let clienteId: number;

    if (clienteExistente) {
      clienteId = clienteExistente.id;

      const { error: actualizarClienteError } = await supabase
        .from("cliente")
        .update({
          nombre,
          telefono: telefono || null,
        })
        .eq("id", clienteId);

      if (actualizarClienteError) {
        console.error(actualizarClienteError);

        return NextResponse.json(
          { error: "No fue posible actualizar los datos del cliente." },
          { status: 500 }
        );
      }
    } else {
      const { data: nuevoCliente, error: clienteError } =
        await supabase
          .from("cliente")
          .insert({
            nombre,
            correo,
            telefono: telefono || null,
          })
          .select("id")
          .single();

      if (clienteError || !nuevoCliente) {
        console.error(clienteError);

        return NextResponse.json(
          { error: "No fue posible registrar los datos del cliente." },
          { status: 500 }
        );
      }

      clienteId = nuevoCliente.id;
    }

    // CREAR RESERVA

    const { data: reserva, error: reservaError } = await supabase
      .from("reserva")
      .insert({
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,

        cantidad_huespedes: cantidadHuespedes,
        cantidad_mascotas: cantidadMascotas,

        incluye_desayuno: incluyeDesayuno,

        estado: "pendiente",
        origen: "web",

        precio_por_noche: precioPorNoche,
        total,

        espacio_id: espacioId,
        cliente_id: clienteId,
      })
      .select(`
        id,
        codigo_reserva,
        fecha_inicio,
        fecha_fin,
        total
      `)
      .single();

    if (reservaError || !reserva) {
      console.error("Error creando reserva:", reservaError);

      return NextResponse.json(
        { error: "No fue posible crear la reservación." },
        { status: 500 }
      );
    }

      // CORREOS

    const resultadosCorreo = await Promise.allSettled([
    enviarConfirmacionReserva({
    correo,
    nombre,
    codigoReserva: reserva.codigo_reserva,
    alojamiento: espacio.nombre,
    fechaInicio: reserva.fecha_inicio,
    fechaFin: reserva.fecha_fin,
    cantidadHuespedes,
    incluyeDesayuno,
    total: Number(reserva.total),
    estado:"pendiente"
  }),

  enviarAvisoAdministrador({
    nombreCliente: nombre,
    correoCliente: correo,
    telefono: telefono || null,
    codigoReserva: reserva.codigo_reserva,
    alojamiento: espacio.nombre,
    fechaInicio: reserva.fecha_inicio,
    fechaFin: reserva.fecha_fin,
    cantidadHuespedes,
    incluyeDesayuno,
    total: Number(reserva.total),
  }),
]);

resultadosCorreo.forEach((resultado, index) => {
  if (resultado.status === "rejected") {
    console.error(
      index === 0
        ? "Error enviando confirmación al cliente:"
        : "Error enviando aviso al administrador:",
      resultado.reason
    );
  }
});

    return NextResponse.json(
      {
        message: "Reservación creada correctamente.",
        reserva: {
          ...reserva,
          alojamiento: espacio.nombre,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Ocurrió un error inesperado." },
      { status: 500 }
    );
  }
}