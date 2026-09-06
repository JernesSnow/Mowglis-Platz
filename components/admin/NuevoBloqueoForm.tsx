"use client";

import {
  FormEvent,
  useState,
} from "react";

import { useRouter } from "next/navigation";

interface Espacio {
  id: number;
  nombre: string;
}

interface NuevoBloqueoFormProps {
  espacios: Espacio[];
}

export default function NuevoBloqueoForm({
  espacios,
}: NuevoBloqueoFormProps) {
  const router = useRouter();

  const [espacioId, setEspacioId] =
    useState(
      espacios.length > 0
        ? String(espacios[0].id)
        : ""
    );

  const [fechaInicio, setFechaInicio] =
    useState("");

  const [fechaFin, setFechaFin] =
    useState("");

  const [motivo, setMotivo] =
    useState("");

  const [guardando, setGuardando] =
    useState(false);

  const [error, setError] =
    useState("");

  const [mensaje, setMensaje] =
    useState("");

  async function crearBloqueo(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setGuardando(true);
    setError("");
    setMensaje("");

    try {
      const response = await fetch(
        "/api/admin/bloqueos",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            espacio_id:
              Number(espacioId),

            fecha_inicio:
              fechaInicio,

            fecha_fin:
              fechaFin,

            motivo,
          }),
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
        setError(
          data?.error ??
            "No fue posible crear el bloqueo."
        );

        return;
      }

      setFechaInicio("");
      setFechaFin("");
      setMotivo("");

      setMensaje(
        "Bloqueo creado correctamente."
      );

      router.refresh();
    } catch (error) {
      console.error(error);

      setError(
        "Ocurrió un error creando el bloqueo."
      );
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form
      onSubmit={crearBloqueo}
      className="rounded-2xl bg-white p-6 shadow-sm"
    >
      <h2 className="text-xl font-bold text-[#173f32]">
        Crear bloqueo
      </h2>

      <p className="mt-1 text-sm text-gray-500">
        Bloquea temporalmente un alojamiento
        para impedir nuevas reservaciones.
      </p>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        {/* ALOJAMIENTO */}

        <div className="md:col-span-2">
          <label
            htmlFor="espacio"
            className="mb-2 block text-sm font-semibold text-[#173f32]"
          >
            Alojamiento
          </label>

          <select
            id="espacio"
            value={espacioId}
            onChange={(event) =>
              setEspacioId(
                event.target.value
              )
            }
            required
            className="w-full rounded-xl border border-gray-300 px-4 py-3"
          >
            {espacios.map((espacio) => (
              <option
                key={espacio.id}
                value={espacio.id}
              >
                {espacio.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* FECHA INICIO */}

        <div>
          <label
            htmlFor="fechaInicio"
            className="mb-2 block text-sm font-semibold text-[#173f32]"
          >
            Desde
          </label>

          <input
            id="fechaInicio"
            type="date"
            value={fechaInicio}
            onChange={(event) =>
              setFechaInicio(
                event.target.value
              )
            }
            required
            className="w-full rounded-xl border border-gray-300 px-4 py-3"
          />
        </div>

        {/* FECHA FIN */}

        <div>
          <label
            htmlFor="fechaFin"
            className="mb-2 block text-sm font-semibold text-[#173f32]"
          >
            Hasta
          </label>

          <input
            id="fechaFin"
            type="date"
            value={fechaFin}
            onChange={(event) =>
              setFechaFin(
                event.target.value
              )
            }
            required
            className="w-full rounded-xl border border-gray-300 px-4 py-3"
          />
        </div>

        {/* MOTIVO */}

        <div className="md:col-span-2">
          <label
            htmlFor="motivo"
            className="mb-2 block text-sm font-semibold text-[#173f32]"
          >
            Motivo
          </label>

          <input
            id="motivo"
            type="text"
            maxLength={50}
            value={motivo}
            onChange={(event) =>
              setMotivo(
                event.target.value
              )
            }
            placeholder="Ej. Mantenimiento"
            required
            className="w-full rounded-xl border border-gray-300 px-4 py-3"
          />

          <p className="mt-1 text-xs text-gray-500">
            {motivo.length}/50
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {mensaje && (
        <div className="mt-5 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">
          {mensaje}
        </div>
      )}

      <button
        type="submit"
        disabled={
          guardando ||
          espacios.length === 0
        }
        className="mt-6 rounded-xl bg-[#173f32] px-6 py-3 font-semibold text-white disabled:opacity-50"
      >
        {guardando
          ? "Creando bloqueo..."
          : "Crear bloqueo"}
      </button>
    </form>
  );
}