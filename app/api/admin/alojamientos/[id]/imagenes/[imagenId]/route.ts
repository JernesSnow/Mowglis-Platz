import { NextResponse } from "next/server";

import { getAdminProfile } from "@/lib/auth/getAdminProfile";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

interface RouteContext {
  params: Promise<{
    id: string;
    imagenId: string;
  }>;
}

export async function PATCH(
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

    const { id, imagenId } = await params;

    const espacioId = Number(id);
    const idImagen = Number(imagenId);

    if (
      !Number.isInteger(espacioId) ||
      !Number.isInteger(idImagen)
    ) {
      return NextResponse.json(
        { error: "Datos inválidos." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const accion = String(body.accion ?? "");

    const supabase = createSupabaseAdmin();

    const {
      data: imagen,
      error: imagenError,
    } = await supabase
      .from("imagenes")
      .select(`
        id,
        espacio_id,
        orden,
        es_principal
      `)
      .eq("id", idImagen)
      .eq("espacio_id", espacioId)
      .maybeSingle();

    if (imagenError || !imagen) {
      return NextResponse.json(
        { error: "La imagen no existe." },
        { status: 404 }
      );
    }

    // HACER PRINCIPAL
    

    if (accion === "principal") {
      const { error: limpiarError } =
        await supabase
          .from("imagenes")
          .update({
            es_principal: false,
          })
          .eq("espacio_id", espacioId);

      if (limpiarError) {
        throw limpiarError;
      }

      const { error: principalError } =
        await supabase
          .from("imagenes")
          .update({
            es_principal: true,
          })
          .eq("id", idImagen);

      if (principalError) {
        throw principalError;
      }

      return NextResponse.json({
        message:
          "Imagen principal actualizada.",
      });
    }

    // MOVER IMAGEN

    if (
      accion === "arriba" ||
      accion === "abajo"
    ) {
      let consulta = supabase
        .from("imagenes")
        .select(`
          id,
          orden
        `)
        .eq("espacio_id", espacioId)
        .neq("id", idImagen);

      if (accion === "arriba") {
        consulta = consulta
          .lt(
            "orden",
            Number(imagen.orden)
          )
          .order("orden", {
            ascending: false,
          });
      } else {
        consulta = consulta
          .gt(
            "orden",
            Number(imagen.orden)
          )
          .order("orden", {
            ascending: true,
          });
      }

      const {
        data: vecina,
        error: vecinaError,
      } = await consulta
        .limit(1)
        .maybeSingle();

      if (vecinaError) {
        throw vecinaError;
      }

      // Ya está de primera o última.
      if (!vecina) {
        return NextResponse.json({
          message:
            "La imagen ya está en el límite.",
        });
      }

      const ordenActual =
        Number(imagen.orden);

      const ordenVecina =
        Number(vecina.orden);

      const {
        error: actualizarActualError,
      } = await supabase
        .from("imagenes")
        .update({
          orden: ordenVecina,
        })
        .eq("id", imagen.id);

      if (actualizarActualError) {
        throw actualizarActualError;
      }

      const {
        error: actualizarVecinaError,
      } = await supabase
        .from("imagenes")
        .update({
          orden: ordenActual,
        })
        .eq("id", vecina.id);

      if (actualizarVecinaError) {
        throw actualizarVecinaError;
      }

      return NextResponse.json({
        message:
          "Orden actualizado.",
      });
    }

    return NextResponse.json(
      {
        error:
          "La acción solicitada no es válida.",
      },
      { status: 400 }
    );
  } catch (error) {
    console.error(
      "Error modificando imagen:",
      error
    );

    return NextResponse.json(
      {
        error:
          "No fue posible modificar la imagen.",
      },
      { status: 500 }
    );
  }
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

    const { id, imagenId } = await params;

    const espacioId = Number(id);
    const idImagen = Number(imagenId);

    if (
      !Number.isInteger(espacioId) ||
      !Number.isInteger(idImagen)
    ) {
      return NextResponse.json(
        { error: "Datos inválidos." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdmin();

    const {
      data: imagen,
      error: imagenError,
    } = await supabase
      .from("imagenes")
      .select(`
        id,
        storage_path,
        es_principal
      `)
      .eq("id", idImagen)
      .eq("espacio_id", espacioId)
      .maybeSingle();

    if (imagenError || !imagen) {
      return NextResponse.json(
        { error: "La imagen no existe." },
        { status: 404 }
      );
    }

    // Eliminar archivo de Storage.

    if (imagen.storage_path) {
      const { error: storageError } =
        await supabase.storage
          .from("alojamientos")
          .remove([
            imagen.storage_path,
          ]);

      if (storageError) {
        throw storageError;
      }
    }

    // Eliminar registro.

    const { error: eliminarError } =
      await supabase
        .from("imagenes")
        .delete()
        .eq("id", idImagen);

    if (eliminarError) {
      throw eliminarError;
    }

    // Si era principal, elegir otra.

    if (imagen.es_principal) {
      const {
        data: siguiente,
        error: siguienteError,
      } = await supabase
        .from("imagenes")
        .select("id")
        .eq("espacio_id", espacioId)
        .order("orden", {
          ascending: true,
        })
        .limit(1)
        .maybeSingle();

      if (siguienteError) {
        throw siguienteError;
      }

      if (siguiente) {
        const {
          error: principalError,
        } = await supabase
          .from("imagenes")
          .update({
            es_principal: true,
          })
          .eq("id", siguiente.id);

        if (principalError) {
          throw principalError;
        }
      }
    }

    return NextResponse.json({
      message:
        "Imagen eliminada correctamente.",
    });
  } catch (error) {
    console.error(
      "Error eliminando imagen:",
      error
    );

    return NextResponse.json(
      {
        error:
          "No fue posible eliminar la imagen.",
      },
      { status: 500 }
    );
  }
}