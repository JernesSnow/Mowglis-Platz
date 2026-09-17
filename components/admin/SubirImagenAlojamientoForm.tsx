"use client";

import {
  FormEvent,
  useState,
} from "react";

import { useRouter } from "next/navigation";

interface Props {
  espacioId: number;
}

export default function SubirImagenAlojamientoForm({
  espacioId,
}: Props) {
  const router = useRouter();

  const [archivo, setArchivo] =
    useState<File | null>(null);

  const [altText, setAltText] =
    useState("");

  const [subiendo, setSubiendo] =
    useState(false);

  const [error, setError] =
    useState("");

  async function subir(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!archivo) {
      setError(
        "Selecciona una imagen."
      );
      return;
    }

    setSubiendo(true);
    setError("");

    try {
      const formData =
        new FormData();

      formData.append(
        "archivo",
        archivo
      );

      formData.append(
        "alt_text",
        altText
      );

      const response = await fetch(
        `/api/admin/alojamientos/${espacioId}/imagenes`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        setError(
          data?.error ??
            "No fue posible subir la imagen."
        );

        return;
      }

      setArchivo(null);
      setAltText("");

      const input =
        document.getElementById(
          "imagen-alojamiento"
        ) as HTMLInputElement | null;

      if (input) {
        input.value = "";
      }

      router.refresh();
    } catch (error) {
      console.error(error);

      setError(
        "Ocurrió un error subiendo la imagen."
      );
    } finally {
      setSubiendo(false);
    }
  }

  return (
    <form
      onSubmit={subir}
      className="rounded-2xl bg-white p-6 shadow-sm"
    >
      <h2 className="text-xl font-bold text-[#173f32]">
        Agregar fotografía
      </h2>

      <div className="mt-5 space-y-5">
        <div>
          <label className="mb-2 block text-sm font-semibold text-[#173f32]">
            Imagen
          </label>

          <input
            id="imagen-alojamiento"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            required
            onChange={(event) =>
              setArchivo(
                event.target.files?.[0] ??
                  null
              )
            }
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-[#173f32]">
            Descripción de la imagen
          </label>

          <input
            value={altText}
            onChange={(event) =>
              setAltText(
                event.target.value
              )
            }
            placeholder="Ej. Habitación principal con aire acondicionado"
            className="w-full rounded-xl border border-gray-300 px-4 py-3"
          />
        </div>
      </div>

      {error && (
        <div className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={
          subiendo ||
          !archivo
        }
        className="mt-6 rounded-xl bg-[#173f32] px-6 py-3 font-semibold text-white disabled:opacity-50"
      >
        {subiendo
          ? "Subiendo..."
          : "Subir fotografía"}
      </button>
    </form>
  );
}