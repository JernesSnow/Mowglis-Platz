"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface EliminarBloqueoButtonProps {
  bloqueoId: number;
}

export default function EliminarBloqueoButton({
  bloqueoId,
}: EliminarBloqueoButtonProps) {
  const router = useRouter();

  const [eliminando, setEliminando] =
    useState(false);

  async function eliminar() {
    const confirmar = window.confirm(
      "¿Seguro que deseas eliminar este bloqueo?"
    );

    if (!confirmar) {
      return;
    }

    setEliminando(true);

    try {
      const response = await fetch(
        `/api/admin/bloqueos/${bloqueoId}`,
        {
          method: "DELETE",
        }
      );

      const contentType =
        response.headers.get(
          "content-type"
        );

      const data =
        contentType?.includes(
          "application/json"
        )
          ? await response.json()
          : null;

      if (!response.ok) {
        window.alert(
          data?.error ??
            "No fue posible eliminar el bloqueo."
        );

        return;
      }

      router.refresh();
    } catch (error) {
      console.error(error);

      window.alert(
        "Ocurrió un error eliminando el bloqueo."
      );
    } finally {
      setEliminando(false);
    }
  }

  return (
    <button
      type="button"
      onClick={eliminar}
      disabled={eliminando}
      className="text-sm font-semibold text-red-600 hover:underline disabled:opacity-50"
    >
      {eliminando
        ? "Eliminando..."
        : "Eliminar"}
    </button>
  );
}