"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

interface NuevaTarifaFormProps {
  espacioId: number;
  capacidad: number;
}

export default function NuevaTarifaForm({
  espacioId,
  capacidad,
}: NuevaTarifaFormProps) {
  const router = useRouter();

  const [huespedes, setHuespedes] =
    useState("1");

  const [desayuno, setDesayuno] =
    useState(false);

  const [precio, setPrecio] =
    useState("");

  const [guardando, setGuardando] =
    useState(false);

  const [error, setError] =
    useState("");

  async function agregar(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setGuardando(true);
    setError("");

    try {
      const response = await fetch(
        "/api/admin/tarifas",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            espacio_id: espacioId,
            cantidad_huespedes:
              Number(huespedes),
            incluye_desayuno: desayuno,
            precio_por_noche:
              Number(precio),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error ??
            "No fue posible crear la tarifa."
        );

        return;
      }

      setPrecio("");
      setDesayuno(false);

      router.refresh();
    } catch (error) {
      console.error(error);

      setError(
        "Ocurrió un error creando la tarifa."
      );
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form
      onSubmit={agregar}
      className="mt-5 grid gap-4 rounded-xl bg-gray-50 p-4 md:grid-cols-4"
    >
      <div>
        <label className="mb-1 block text-sm font-medium">
          Huéspedes
        </label>

        <input
          type="number"
          min="1"
          max={capacidad}
          required
          value={huespedes}
          onChange={(event) =>
            setHuespedes(event.target.value)
          }
          className="w-full rounded-lg border border-gray-300 px-3 py-2"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          Desayuno
        </label>

        <select
          value={desayuno ? "si" : "no"}
          onChange={(event) =>
            setDesayuno(
              event.target.value === "si"
            )
          }
          className="w-full rounded-lg border border-gray-300 px-3 py-2"
        >
          <option value="no">
            Sin desayuno
          </option>

          <option value="si">
            Con desayuno
          </option>
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          Precio por noche
        </label>

        <input
          type="number"
          min="0"
          step="1000"
          required
          value={precio}
          onChange={(event) =>
            setPrecio(event.target.value)
          }
          className="w-full rounded-lg border border-gray-300 px-3 py-2"
        />
      </div>

      <div className="flex items-end">
        <button
          type="submit"
          disabled={guardando}
          className="w-full rounded-lg bg-[#286453] px-4 py-2 font-semibold text-white disabled:opacity-50"
        >
          {guardando
            ? "Agregando..."
            : "Agregar tarifa"}
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-600 md:col-span-4">
          {error}
        </p>
      )}
    </form>
  );
}