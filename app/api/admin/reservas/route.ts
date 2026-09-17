import { NextResponse } from "next/server";

import { getAdminProfile } from "@/lib/auth/getAdminProfile";
import { calcularNoDisponibles } from "@/lib/reservas/calcularNoDisponibles";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export async function POST(
  request: Request
) {
  try {
    const admin =
      await getAdminProfile();

    if (!admin) {
      return NextResponse.json(
        {
          error: "No autorizado.",
        },
        {
          status: 401,
        }
      );
    }

    const body =
      await request.json();

    const espacioId =
      Number(body.espacio_id);

    const fechaInicio =
      String(
        body.fecha_inicio ?? ""
      );

    const fechaFin =
      String(
        body.fecha_fin ?? ""
      );

    const cantidadHuespedes =
      Number(
        body.cantidad_huespedes
      );

    const incluyeDesayuno =
      body.incluye_desayuno === true;

    const estado =
      body.estado === "pendiente"
        ? "pendiente"
        : "confirmada";

    const nombre =
      String(
        body.nombre ?? ""
      ).trim();

    const correo =
      String(
        body.correo ?? ""
      )
        .trim()
        .toLowerCase();

    const telefono =
      String(
        body.telefono ?? ""
      ).trim();

    // VALIDACIÓN BÁSICA

    if (
      !Number.isInteger(espacioId) ||
      espacioId <= 0 ||
      !fechaInicio ||
      !fechaFin ||
      fechaFin <= fechaInicio ||
      !Number.isInteger(
        cantidadHuespedes
      ) ||
      cantidadHuespedes <= 0 ||
      !nombre ||
      !correo
    ) {
      return NextResponse.json(
        {
          error:
            "Los datos de la reservación no son válidos.",
        },
        {
          status: 400,
        }
      );
    }

    const supabase =
      createSupabaseAdmin();

    // ALOJAMIENTO

    const {
      data: espacio,
      error: espacioError,
    } = await supabase
      .from("espacios")
      .select(`
        id,
        capacidad
      `)
      .eq("id", espacioId)
      .eq("estado", "activo")
      .maybeSingle();

    if (
      espacioError ||
      !espacio
    ) {
      return NextResponse.json(
        {
          error:
            "El alojamiento no existe o está inactivo.",
        },
        {
          status: 404,
        }
      );
    }

    if (
      cantidadHuespedes >
      Number(espacio.capacidad)
    ) {
      return NextResponse.json(
        {
          error:
            "La cantidad de huéspedes supera la capacidad del alojamiento.",
        },
        {
          status: 400,
        }
      );
    }

    // TARIFA
    // 

    const {
      data: tarifa,
      error: tarifaError,
    } = await supabase
      .from("tarifas")
      .select("precio_por_noche")
      .eq(
        "espacio_id",
        espacioId
      )
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

    if (
      tarifaError ||
      !tarifa
    ) {
      return NextResponse.json(
        {
          error:
            "No existe una tarifa activa para esta configuración.",
        },
        {
          status: 400,
        }
      );
    }

    // DISPONIBILIDAD

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

    if (
      espaciosError ||
      !espacios
    ) {
      return NextResponse.json(
        {
          error:
            "No fue posible comprobar disponibilidad.",
        },
        {
          status: 500,
        }
      );
    }

    const {
      data: reservas,
      error: reservasError,
    } = await supabase
      .from("reserva")
      .select("espacio_id")
      .neq(
        "estado",
        "cancelada"
      )
      .lt(
        "fecha_inicio",
        fechaFin
      )
      .gt(
        "fecha_fin",
        fechaInicio
      );

    if (reservasError) {
      throw reservasError;
    }

    const {
      data: bloqueos,
      error: bloqueosError,
    } = await supabase
      .from("bloqueo_espacio")
      .select("espacio_id")
      .lt(
        "fecha_inicio",
        fechaFin
      )
      .gt(
        "fecha_fin",
        fechaInicio
      );

    if (bloqueosError) {
      throw bloqueosError;
    }

    const ocupadosDirectamente =
      new Set<number>();

    reservas?.forEach(
      (reserva) => {
        ocupadosDirectamente.add(
          reserva.espacio_id
        );
      }
    );

    bloqueos?.forEach(
      (bloqueo) => {
        ocupadosDirectamente.add(
          bloqueo.espacio_id
        );
      }
    );

    const noDisponibles =
      calcularNoDisponibles(
        espacios,
        ocupadosDirectamente
      );

    if (
      noDisponibles.has(
        espacioId
      )
    ) {
      return NextResponse.json(
        {
          error:
            "El alojamiento no está disponible para las fechas seleccionadas.",
        },
        {
          status: 409,
        }
      );
    }

    // TOTAL

    const [yi, mi, di] =
      fechaInicio
        .split("-")
        .map(Number);

    const [yf, mf, df] =
      fechaFin
        .split("-")
        .map(Number);

    const noches = Math.round(
      (
        Date.UTC(
          yf,
          mf - 1,
          df
        ) -
        Date.UTC(
          yi,
          mi - 1,
          di
        )
      ) /
        86400000
    );

    if (noches <= 0) {
      return NextResponse.json(
        {
          error:
            "La cantidad de noches no es válida.",
        },
        {
          status: 400,
        }
      );
    }

    const precioPorNoche =
      Number(
        tarifa.precio_por_noche
      );

    const total =
      precioPorNoche *
      noches;

    // CLIENTE

    const {
      data: clienteExistente,
      error: clienteBuscarError,
    } = await supabase
      .from("cliente")
      .select("id")
      .eq("correo", correo)
      .maybeSingle();

    if (clienteBuscarError) {
      throw clienteBuscarError;
    }

    let clienteId: number;

    if (clienteExistente) {
      clienteId =
        clienteExistente.id;

      const {
        error: actualizarClienteError,
      } = await supabase
        .from("cliente")
        .update({
          nombre,
          telefono:
            telefono || null,
        })
        .eq(
          "id",
          clienteId
        );

      if (
        actualizarClienteError
      ) {
        throw actualizarClienteError;
      }
    } else {
      const {
        data: nuevoCliente,
        error: crearClienteError,
      } = await supabase
        .from("cliente")
        .insert({
          nombre,
          correo,
          telefono:
            telefono || null,
        })
        .select("id")
        .single();

      if (
        crearClienteError ||
        !nuevoCliente
      ) {
        throw (
          crearClienteError ??
          new Error(
            "No fue posible crear el cliente."
          )
        );
      }

      clienteId =
        nuevoCliente.id;
    }

    // CREAR RESERVACIÓN

    const {
      data: reserva,
      error: reservaError,
    } = await supabase
      .from("reserva")
      .insert({
        espacio_id:
          espacioId,

        cliente_id:
          clienteId,

        fecha_inicio:
          fechaInicio,

        fecha_fin:
          fechaFin,

        cantidad_huespedes:
          cantidadHuespedes,

        cantidad_mascotas: 0,

        incluye_desayuno:
          incluyeDesayuno,

        precio_por_noche:
          precioPorNoche,

        total,

        estado,

        origen: "admin",
      })
      .select(`
        id,
        codigo_reserva
      `)
      .single();

    if (
      reservaError ||
      !reserva
    ) {
      throw (
        reservaError ??
        new Error(
          "No fue posible crear la reservación."
        )
      );
    }

    return NextResponse.json(
      {
        message:
          "Reservación creada correctamente.",

        reserva,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Error creando reservación administrativa:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Ocurrió un error creando la reservación.",
      },
      {
        status: 500,
      }
    );
  }
}