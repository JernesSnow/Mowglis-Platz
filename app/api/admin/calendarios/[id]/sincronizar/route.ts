import { NextResponse } from "next/server";

import { getAdminProfile } from "@/lib/auth/getAdminProfile";
import { sincronizarCalendarioAirbnb } from "@/lib/airbnb/sincronizarCalendario";

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
    const admin =
      await getAdminProfile();

    if (!admin) {
      return NextResponse.json(
        { error: "No autorizado." },
        { status: 401 }
      );
    }

    const { id } = await params;

    const calendarioId =
      Number(id);

    if (
      !Number.isInteger(
        calendarioId
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Calendario inválido.",
        },
        { status: 400 }
      );
    }

    const resultado =
      await sincronizarCalendarioAirbnb(
        calendarioId
      );

    return NextResponse.json({
      message:
        "Calendario sincronizado correctamente.",

      ...resultado,
    });
  } catch (error) {
    console.error(
      "Error sincronizando calendario:",
      error
    );

    return NextResponse.json(
      {
        error:
          "No fue posible sincronizar el calendario.",
      },
      { status: 500 }
    );
  }
}