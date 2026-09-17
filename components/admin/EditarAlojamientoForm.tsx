"use client";

import {
  FormEvent,
  useState,
} from "react";

import { useRouter } from "next/navigation";

interface Espacio {
  id: number;
  nombre: string;
  descripcion: string;
  tipo: string;
  estado: string;
  capacidad: number;
  seccion: number | null;
  incluido_en_casa_completa: boolean;
}

interface Props {
  espacio: Espacio;
}

export default function EditarAlojamientoForm({
  espacio,
}: Props) {
  const router = useRouter();

  const [nombre, setNombre] =
    useState(espacio.nombre);

  const [descripcion, setDescripcion] =
    useState(espacio.descripcion);

  const [estado, setEstado] =
    useState(espacio.estado);

  const [capacidad, setCapacidad] =
    useState(espacio.capacidad);

  const [guardando, setGuardando] =
    useState(false);

  const [mensaje, setMensaje] =
    useState("");

  const [error, setError] =
    useState("");

  async function guardar(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setGuardando(true);
    setMensaje("");
    setError("");

    try {
      const response = await fetch(
        `/api/admin/alojamientos/${espacio.id}`,
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            nombre,
            descripcion,
            estado,
            capacidad,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        setError(
          data?.error ??
            "No fue posible actualizar el alojamiento."
        );

        return;
      }

      setMensaje(
        "Alojamiento actualizado correctamente."
      );

      router.refresh();
    } catch (error) {
      console.error(error);

      setError(
        "Ocurrió un error actualizando el alojamiento."
      );
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
      <form
        onSubmit={guardar}
        className="rounded-2xl bg-white p-6 shadow-sm"
      >
        <div className="grid gap-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-[#173f32]">
              Nombre
            </label>

            <input
              required
              value={nombre}
              onChange={(event) =>
                setNombre(
                  event.target.value
                )
              }
              className="w-full rounded-xl border border-gray-300 px-4 py-3"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-[#173f32]">
              Descripción
            </label>

            <textarea
              value={descripcion}
              onChange={(event) =>
                setDescripcion(
                  event.target.value
                )
              }
              rows={5}
              className="w-full resize-y rounded-xl border border-gray-300 px-4 py-3"
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#173f32]">
                Capacidad
              </label>

              <input
                type="number"
                min={1}
                required
                value={capacidad}
                onChange={(event) =>
                  setCapacidad(
                    Number(
                      event.target.value
                    )
                  )
                }
                className="w-full rounded-xl border border-gray-300 px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#173f32]">
                Estado
              </label>

              <select
                value={estado}
                onChange={(event) =>
                  setEstado(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-gray-300 px-4 py-3"
              >
                <option value="activo">
                  Activo
                </option>

                <option value="mantenimiento">
                  Mantenimiento
                </option>

                <option value="inactivo">
                  Inactivo
                </option>
              </select>
            </div>
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
          disabled={guardando}
          className="mt-6 rounded-xl bg-[#173f32] px-6 py-3 font-semibold text-white disabled:opacity-50"
        >
          {guardando
            ? "Guardando..."
            : "Guardar cambios"}
        </button>
      </form>

      {/* DATOS ESTRUCTURALES */}

      <aside className="h-fit rounded-2xl bg-[#f5f1df] p-6">
        <h2 className="font-bold text-[#173f32]">
          Configuración estructural
        </h2>

        <p className="mt-2 text-sm text-gray-600">
          Estos valores no pueden modificarse desde
          el panel porque forman parte de las reglas
          de disponibilidad.
        </p>

        <dl className="mt-5 space-y-4 text-sm">
          <div>
            <dt className="text-gray-500">
              Tipo
            </dt>

            <dd className="mt-1 font-semibold text-[#173f32]">
              {espacio.tipo}
            </dd>
          </div>

          <div>
            <dt className="text-gray-500">
              Sección
            </dt>

            <dd className="mt-1 font-semibold text-[#173f32]">
              {espacio.seccion ??
                "No aplica"}
            </dd>
          </div>

          <div>
            <dt className="text-gray-500">
              Incluido en casa completa
            </dt>

            <dd className="mt-1 font-semibold text-[#173f32]">
              {espacio.incluido_en_casa_completa
                ? "Sí"
                : "No"}
            </dd>
          </div>
        </dl>
      </aside>
    </div>
  );
}