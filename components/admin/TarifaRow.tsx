"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface TarifaRowProps {
  tarifa: {
    id: number;
    cantidad_huespedes: number;
    incluye_desayuno: boolean;
    precio_por_noche: number;
    activo: boolean;
  };
}

export default function TarifaRow({
  tarifa,
}: TarifaRowProps) {
  const router = useRouter();

  const [precio, setPrecio] = useState(
    String(tarifa.precio_por_noche)
  );

  const [activo, setActivo] = useState(
    tarifa.activo
  );

  const [guardando, setGuardando] =
    useState(false);

  const [mensaje, setMensaje] =
    useState("");

  async function guardar() {
    setGuardando(true);
    setMensaje("");

    try {
      const response = await fetch(
        `/api/admin/tarifas/${tarifa.id}`,
        {
          method: "PATCH",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            precio_por_noche: Number(precio),
            activo,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMensaje(
          data.error ??
            "No fue posible guardar la tarifa."
        );

        return;
      }

      setMensaje("Guardado");
      router.refresh();
    } catch (error) {
      console.error(error);

      setMensaje("Error al guardar.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <tr className="border-t border-gray-100">
      <td className="px-4 py-4">
        {tarifa.cantidad_huespedes}
      </td>

      <td className="px-4 py-4">
        {tarifa.incluye_desayuno
          ? "Sí"
          : "No"}
      </td>

      <td className="px-4 py-4">
        <div className="flex items-center gap-2">
          <span>₡</span>

          <input
            type="number"
            min="0"
            step="1000"
            value={precio}
            onChange={(event) =>
              setPrecio(event.target.value)
            }
            className="w-32 rounded-lg border border-gray-300 px-3 py-2"
          />
        </div>
      </td>

      <td className="px-4 py-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={activo}
            onChange={(event) =>
              setActivo(event.target.checked)
            }
          />

          {activo ? "Activa" : "Inactiva"}
        </label>
      </td>

      <td className="px-4 py-4">
        <button
          type="button"
          disabled={guardando}
          onClick={guardar}
          className="rounded-lg bg-[#173f32] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {guardando
            ? "Guardando..."
            : "Guardar"}
        </button>

        {mensaje && (
          <p className="mt-1 text-xs text-gray-500">
            {mensaje}
          </p>
        )}
      </td>
    </tr>
  );
}