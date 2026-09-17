import { NextResponse } from "next/server";

import { getAdminProfile } from "@/lib/auth/getAdminProfile";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

const TIPOS_PERMITIDOS = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const TAMANO_MAXIMO = 8 * 1024 * 1024;

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
    const espacioId = Number(id);

    if (
      !Number.isInteger(espacioId) ||
      espacioId <= 0
    ) {
      return NextResponse.json(
        { error: "Alojamiento inválido." },
        { status: 400 }
      );
    }

    const formData = await request.formData();

    const archivo = formData.get("archivo");
    const altText = String(
      formData.get("alt_text") ?? ""
    ).trim();

    if (!(archivo instanceof File)) {
      return NextResponse.json(
        { error: "Debe seleccionar una imagen." },
        { status: 400 }
      );
    }

    if (!TIPOS_PERMITIDOS.includes(archivo.type)) {
      return NextResponse.json(
        {
          error:
            "Solo se permiten imágenes JPG, PNG o WEBP.",
        },
        { status: 400 }
      );
    }

    if (archivo.size > TAMANO_MAXIMO) {
      return NextResponse.json(
        {
          error:
            "La imagen no puede superar los 8 MB.",
        },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdmin();

    // Validar alojamiento

    const {
      data: espacio,
      error: espacioError,
    } = await supabase
      .from("espacios")
      .select("id")
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

    // Obtener orden siguiente

    const {
      data: ultimaImagen,
      error: ordenError,
    } = await supabase
      .from("imagenes")
      .select("orden")
      .eq("espacio_id", espacioId)
      .order("orden", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

    if (ordenError) {
      throw ordenError;
    }

    const siguienteOrden =
      Number(ultimaImagen?.orden ?? 0) + 1;

    const {
      count,
      error: countError,
    } = await supabase
      .from("imagenes")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("espacio_id", espacioId);

    if (countError) {
      throw countError;
    }

    const esPrimeraImagen =
      (count ?? 0) === 0;

    // Nombre seguro

    const extension =
      archivo.name
        .split(".")
        .pop()
        ?.toLowerCase() || "webp";

    const storagePath =
      `espacios/${espacioId}/${crypto.randomUUID()}.${extension}`;

    const buffer =
      await archivo.arrayBuffer();

    // Subir a Storage

    const {
      error: uploadError,
    } = await supabase.storage
      .from("alojamientos")
      .upload(
        storagePath,
        buffer,
        {
          contentType: archivo.type,
          upsert: false,
        }
      );

    if (uploadError) {
      throw uploadError;
    }

    // Obtener URL pública

    const {
      data: publicUrlData,
    } = supabase.storage
      .from("alojamientos")
      .getPublicUrl(storagePath);

    const url =
      publicUrlData.publicUrl;

    // Guardar en BD

    const {
      data: imagen,
      error: imagenError,
    } = await supabase
      .from("imagenes")
      .insert({
        espacio_id: espacioId,
        url,
        storage_path: storagePath,
        alt_text:
          altText || null,
        orden: siguienteOrden,
        es_principal:
          esPrimeraImagen,
      })
      .select(`
        id,
        espacio_id,
        url,
        storage_path,
        alt_text,
        orden,
        es_principal
      `)
      .single();

    if (imagenError || !imagen) {
      // Evitar archivo huérfano
      await supabase.storage
        .from("alojamientos")
        .remove([storagePath]);

      throw (
        imagenError ??
        new Error(
          "No fue posible guardar la imagen."
        )
      );
    }

    return NextResponse.json(
      {
        message:
          "Imagen subida correctamente.",
        imagen,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Error subiendo imagen:",
      error
    );

    return NextResponse.json(
      {
        error:
          "No fue posible subir la imagen.",
      },
      { status: 500 }
    );
  }
}