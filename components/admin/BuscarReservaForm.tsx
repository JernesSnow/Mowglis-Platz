"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

interface BuscarReservaFormProps {
  valorInicial?: string;
}

export default function BuscarReservaForm({
  valorInicial = "",
}: BuscarReservaFormProps) {
  const router = useRouter();

  const [busqueda, setBusqueda] =
    useState(valorInicial);

  function buscar(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const valor = busqueda.trim();

    if (!valor) {
      router.push("/admin/reservas");
      return;
    }

    router.push(
      `/admin/reservas?buscar=${encodeURIComponent(
        valor
      )}`
    );
  }

  function limpiar() {
    setBusqueda("");
    router.push("/admin/reservas");
  }

  return (
    <form
      onSubmit={buscar}
      className="flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-sm sm:flex-row"
    >
      <div className="flex-1">
        <label
          htmlFor="buscar-reserva"
          className="mb-2 block text-sm font-semibold text-[#173f32]"
        >
          Buscar reservación
        </label>

        <input
          id="buscar-reserva"
          type="text"
          value={busqueda}
          onChange={(event) =>
            setBusqueda(event.target.value)
          }
          placeholder="Ej. MP-AB123456"
          className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-[#286453]"
        />
      </div>

      <div className="flex items-end gap-2">
        <button
          type="submit"
          className="rounded-xl bg-[#173f32] px-5 py-3 font-semibold text-white"
        >
          Buscar
        </button>

        {valorInicial && (
          <button
            type="button"
            onClick={limpiar}
            className="rounded-xl border border-gray-300 px-5 py-3 font-semibold text-[#173f32]"
          >
            Limpiar
          </button>
        )}
      </div>
    </form>
  );
}