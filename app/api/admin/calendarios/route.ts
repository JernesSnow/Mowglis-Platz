import { NextResponse } from "next/server";

import { getAdminProfile } from "@/lib/auth/getAdminProfile";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

type CalendarioBody = {
  espacio_id?: number;
  url_ical?: string;
  activo?: boolean;
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

    const body: CalendarioBody =
      await request.json();

    const espacioId = Number(
      body.espacio_id
    );

    const urlIcal = String(
      body.url_ical ?? ""
    ).trim();

    const activo =
      body.activo === true;

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

    if (!urlIcal) {
      return NextResponse.json(
        {
          error:
            "Debe indicar la URL del calendario iCal.",
        },
        { status: 400 }
      );
    }

    try {
      const url = new URL(urlIcal);

      if (
        url.protocol !== "https:" &&
        url.protocol !== "http:"
      ) {
        throw new Error();
      }
    } catch {
      return NextResponse.json(
        {
          error:
            "La URL del calendario no es válida.",
        },
        { status: 400 }
      );
    }

    const supabase =
      createSupabaseAdmin();

    // VALIDAR QUE EL ESPACIO EXISTA

    const {
      data: espacio,
      error: espacioError,
    } = await supabase
      .from("espacios")
      .select(`
        id,
        nombre
      `)
      .eq("id", espacioId)
      .maybeSingle();

    if (espacioError || !espacio) {
      return NextResponse.json(
        {
          error:
            "El alojamiento no existe.",
        },
        { status: 404 }
      );
    }

    // CREAR O ACTUALIZAR
    //
    // La BD tiene UNIQUE:
    // espacio_id + proveedor

    const {
      data: calendario,
      error: calendarioError,
    } = await supabase
      .from("calendarios_externos")
      .upsert(
        {
          espacio_id: espacioId,
          proveedor: "airbnb",
          url_ical: urlIcal,
          activo,
          updated_at:
            new Date().toISOString(),
        },
        {
          onConflict:
            "espacio_id,proveedor",
        }
      )
      .select(`
        id,
        espacio_id,
        proveedor,
        url_ical,
        activo,
        ultima_sincronizacion
      `)
      .single();

    if (
      calendarioError ||
      !calendario
    ) {
      console.error(
        "Error guardando calendario:",
        calendarioError
      );

      return NextResponse.json(
        {
          error:
            "No fue posible guardar el calendario.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message:
        "Calendario guardado correctamente.",
      calendario,
    });
  } catch (error) {
    console.error(
      "Error guardando calendario:",
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