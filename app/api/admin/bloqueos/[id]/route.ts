import { NextResponse } from "next/server";

import { getAdminProfile } from "@/lib/auth/getAdminProfile";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function DELETE(
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

    const bloqueoId = Number(id);

    if (!Number.isInteger(bloqueoId)) {
      return NextResponse.json(
        { error: "Bloqueo inválido." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdmin();

    const {
      data: bloqueo,
      error: bloqueoError,
    } = await supabase
      .from("bloqueo_espacio")
      .select(`
        id,
        origen
      `)
      .eq("id", bloqueoId)
      .maybeSingle();

    if (bloqueoError) {
      console.error(bloqueoError);

      return NextResponse.json(
        {
          error:
            "No fue posible consultar el bloqueo.",
        },
        { status: 500 }
      );
    }

    if (!bloqueo) {
      return NextResponse.json(
        {
          error:
            "El bloqueo no existe.",
        },
        { status: 404 }
      );
    }

    // Los bloqueos de Airbnb deberán manejarse
    // mediante la sincronización del calendario.

    if (bloqueo.origen === "airbnb") {
      return NextResponse.json(
        {
          error:
            "Los bloqueos de Airbnb no pueden eliminarse manualmente.",
        },
        { status: 409 }
      );
    }

    const { error: eliminarError } =
      await supabase
        .from("bloqueo_espacio")
        .delete()
        .eq("id", bloqueoId);

    if (eliminarError) {
      console.error(eliminarError);

      return NextResponse.json(
        {
          error:
            "No fue posible eliminar el bloqueo.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message:
        "Bloqueo eliminado correctamente.",
    });
  } catch (error) {
    console.error(
      "Error eliminando bloqueo:",
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