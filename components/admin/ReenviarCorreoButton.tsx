"use client";

import { useState } from "react";

interface ReenviarCorreoButtonProps {
  reservaId: number;
}

export default function ReenviarCorreoButton({
  reservaId,
}: ReenviarCorreoButtonProps) {
  const [enviando, setEnviando] =
    useState(false);

  const [mensaje, setMensaje] =
    useState("");

  async function reenviar() {
    setEnviando(true);
    setMensaje("");

    try {
      const response = await fetch(
        `/api/admin/reservas/${reservaId}/reenviar-correo`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMensaje(
          data.error ??
            "No fue posible reenviar el correo."
        );

        return;
      }

      setMensaje(
        "Correo enviado correctamente."
      );
    } catch (error) {
      console.error(error);

      setMensaje(
        "Ocurrió un error enviando el correo."
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        disabled={enviando}
        onClick={reenviar}
        className="rounded-xl border border-[#286453] bg-white px-5 py-3 font-semibold text-[#286453] hover:bg-[#286453]/5 disabled:opacity-50"
      >
        {enviando
          ? "Enviando..."
          : "Reenviar correo"}
      </button>

      {mensaje && (
        <p className="mt-2 text-sm text-gray-600">
          {mensaje}
        </p>
      )}
    </div>
  );
}