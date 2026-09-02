import { NextResponse } from "next/server";

import { getAdminProfile } from "@/lib/auth/getAdminProfile";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const admin = await getAdminProfile();

    if (!admin) {
      return NextResponse.json(
        { error: "No autorizado." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const espacioId = Number(body?.espacio_id);
    const cantidadHuespedes = Number(
      body?.cantidad_huespedes
    );
    const incluyeDesayuno =
      body?.incluye_desayuno === true;
    const precioPorNoche = Number(
      body?.precio_por_noche
    );

    if (
      !Number.isInteger(espacioId) ||
      !Number.isInteger(cantidadHuespedes) ||
      cantidadHuespedes <= 0 ||
      !Number.isFinite(precioPorNoche) ||
      precioPorNoche < 0
    ) {
      return NextResponse.json(
        { error: "Los datos de la tarifa no son válidos." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdmin();

    // Revisar capacidad del alojamiento
    const { data: espacio, error: espacioError } =
      await supabase
        .from("espacios")
        .select(`
          id,
          nombre,
          capacidad
        `)
        .eq("id", espacioId)
        .maybeSingle();

    if (espacioError || !espacio) {
      return NextResponse.json(
        { error: "El alojamiento no existe." },
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

    // Evitar duplicados
    const { data: tarifaExistente } = await supabase
      .from("tarifas")
      .select("id")
      .eq("espacio_id", espacioId)
      .eq("cantidad_huespedes", cantidadHuespedes)
      .eq("incluye_desayuno", incluyeDesayuno)
      .maybeSingle();

    if (tarifaExistente) {
      return NextResponse.json(
        {
          error:
            "Ya existe una tarifa para esa cantidad de huéspedes y opción de desayuno.",
        },
        { status: 409 }
      );
    }

    const { data: tarifa, error } = await supabase
      .from("tarifas")
      .insert({
        espacio_id: espacioId,
        cantidad_huespedes: cantidadHuespedes,
        incluye_desayuno: incluyeDesayuno,
        precio_por_noche: precioPorNoche,
        activo: true,
      })
      .select()
      .single();

    if (error || !tarifa) {
      console.error(error);

      return NextResponse.json(
        { error: "No fue posible crear la tarifa." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: "Tarifa creada correctamente.",
        tarifa,
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