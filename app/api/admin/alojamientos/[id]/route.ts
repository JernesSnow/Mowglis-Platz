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

    const { id } = await params;

    const espacioId = Number(id);

    if (
      !Number.isInteger(espacioId) ||
      espacioId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Alojamiento inválido.",
        },
        {
          status: 400,
        }
      );
    }

    const body =
      await request.json();

    const nombre =
      String(
        body.nombre ?? ""
      ).trim();

    const descripcion =
      String(
        body.descripcion ?? ""
      ).trim();

    const estado =
      String(
        body.estado ?? ""
      );

    const capacidad =
      Number(body.capacidad);

    if (!nombre) {
      return NextResponse.json(
        {
          error:
            "El nombre es obligatorio.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isInteger(capacidad) ||
      capacidad <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "La capacidad debe ser mayor que cero.",
        },
        {
          status: 400,
        }
      );
    }

    const estadosPermitidos = [
      "activo",
      "inactivo",
      "mantenimiento",
    ];

    if (
      !estadosPermitidos.includes(
        estado
      )
    ) {
      return NextResponse.json(
        {
          error:
            "El estado seleccionado no es válido.",
        },
        {
          status: 400,
        }
      );
    }

    const supabase =
      createSupabaseAdmin();

    const {
      data: espacio,
      error,
    } = await supabase
      .from("espacios")
      .update({
        nombre,
        descripcion:
          descripcion || null,
        estado,
        capacidad,
      })
      .eq("id", espacioId)
      .select(`
        id,
        nombre,
        descripcion,
        estado,
        capacidad
      `)
      .maybeSingle();

    if (error) {
      console.error(
        "Error actualizando alojamiento:",
        error
      );

      return NextResponse.json(
        {
          error:
            "No fue posible actualizar el alojamiento.",
        },
        {
          status: 500,
        }
      );
    }

    if (!espacio) {
      return NextResponse.json(
        {
          error:
            "El alojamiento no existe.",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      message:
        "Alojamiento actualizado correctamente.",

      espacio,
    });
  } catch (error) {
    console.error(
      "Error actualizando alojamiento:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Ocurrió un error inesperado.",
      },
      {
        status: 500,
      }
    );
  }
}