"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  espacioId: number;
  imagenId: number;
  esPrincipal: boolean;
}

export default function ImagenAlojamientoActions({
  espacioId,
  imagenId,
  esPrincipal,
}: Props) {
  const router = useRouter();

  const [procesando, setProcesando] =
    useState(false);

  async function modificar(
    accion:
      | "principal"
      | "arriba"
      | "abajo"
  ) {
    setProcesando(true);

    try {
      const response = await fetch(
        `/api/admin/alojamientos/${espacioId}/imagenes/${imagenId}`,
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            accion,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        window.alert(
          data?.error ??
            "No fue posible modificar la imagen."
        );

        return;
      }

      router.refresh();
    } finally {
      setProcesando(false);
    }
  }

  async function eliminar() {
    const confirmado = window.confirm(
      "¿Seguro que deseas eliminar esta fotografía?"
    );

    if (!confirmado) {
      return;
    }

    setProcesando(true);

    try {
      const response = await fetch(
        `/api/admin/alojamientos/${espacioId}/imagenes/${imagenId}`,
        {
          method: "DELETE",
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        window.alert(
          data?.error ??
            "No fue posible eliminar la imagen."
        );

        return;
      }

      router.refresh();
    } finally {
      setProcesando(false);
    }
  }

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {!esPrincipal && (
        <button
          type="button"
          disabled={procesando}
          onClick={() =>
            modificar("principal")
          }
          className="rounded-lg bg-[#173f32] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
        >
          Hacer principal
        </button>
      )}

      <button
        type="button"
        disabled={procesando}
        onClick={() =>
          modificar("arriba")
        }
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-[#173f32] disabled:opacity-50"
      >
        ↑
      </button>

      <button
        type="button"
        disabled={procesando}
        onClick={() =>
          modificar("abajo")
        }
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-[#173f32] disabled:opacity-50"
      >
        ↓
      </button>

      <button
        type="button"
        disabled={procesando}
        onClick={eliminar}
        className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 disabled:opacity-50"
      >
        Eliminar
      </button>
    </div>
  );
}