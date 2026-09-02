"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ReservaEstadoActionsProps {
  reservaId: number;
  estado: string;
}

export default function ReservaEstadoActions({
  reservaId,
  estado,
}: ReservaEstadoActionsProps) {
  const router = useRouter();

  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState("");

  async function cambiarEstado(
    nuevoEstado:
      | "confirmada"
      | "cancelada"
      | "completada"
  ) {
    if (
      nuevoEstado === "cancelada" &&
      !window.confirm(
        "¿Seguro que deseas cancelar esta reservación?"
      )
    ) {
      return;
    }

    setProcesando(true);
    setError("");

    try {
      const response = await fetch(
        `/api/admin/reservas/${reservaId}/estado`,
        {
          method: "PATCH",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            estado: nuevoEstado,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error ??
            "No fue posible actualizar la reservación."
        );

        return;
      }

      router.refresh();
    } catch (error) {
      console.error(error);

      setError(
        "Ocurrió un error actualizando la reservación."
      );
    } finally {
      setProcesando(false);
    }
  }

  if (
    estado === "cancelada" ||
    estado === "completada"
  ) {
    return null;
  }

  return (
    <>
      <div className="flex flex-wrap gap-3">
        {estado === "pendiente" && (
          <button
            type="button"
            disabled={procesando}
            onClick={() =>
              cambiarEstado("confirmada")
            }
            className="rounded-xl bg-[#173f32] px-5 py-3 font-semibold text-white disabled:opacity-50"
          >
            {procesando
              ? "Procesando..."
              : "Confirmar reserva"}
          </button>
        )}

        {estado === "confirmada" && (
          <button
            type="button"
            disabled={procesando}
            onClick={() =>
              cambiarEstado("completada")
            }
            className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white disabled:opacity-50"
          >
            {procesando
              ? "Procesando..."
              : "Marcar como completada"}
          </button>
        )}

        <button
          type="button"
          disabled={procesando}
          onClick={() =>
            cambiarEstado("cancelada")
          }
          className="rounded-xl border border-red-300 bg-white px-5 py-3 font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          Cancelar reserva
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
    </>
  );
}