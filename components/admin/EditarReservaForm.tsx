"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Tarifa = {
  id: number;
  cantidad_huespedes: number;
  incluye_desayuno: boolean;
  precio_por_noche: number;
  activo: boolean;
};

type Espacio = {
  id: number;
  nombre: string;
  capacidad: number;
  tarifas: Tarifa[];
};

interface EditarReservaFormProps {
  reserva: {
    id: number;
    espacio_id: number;
    fecha_inicio: string;
    fecha_fin: string;
    cantidad_huespedes: number;
    incluye_desayuno: boolean;

    cliente: {
      nombre: string;
      correo: string;
      telefono: string | null;
    };
  };

  espacios: Espacio[];
}

export default function EditarReservaForm({
  reserva,
  espacios,
}: EditarReservaFormProps) {
  const router = useRouter();

  const [espacioId, setEspacioId] = useState(
    String(reserva.espacio_id)
  );

  const [fechaInicio, setFechaInicio] = useState(
    reserva.fecha_inicio
  );

  const [fechaFin, setFechaFin] = useState(
    reserva.fecha_fin
  );

  const [cantidadHuespedes, setCantidadHuespedes] =
    useState(String(reserva.cantidad_huespedes));

  const [incluyeDesayuno, setIncluyeDesayuno] =
    useState(reserva.incluye_desayuno);

  const [nombre, setNombre] = useState(
    reserva.cliente.nombre
  );

  const [correo, setCorreo] = useState(
    reserva.cliente.correo
  );

  const [telefono, setTelefono] = useState(
    reserva.cliente.telefono ?? ""
  );

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const espacioSeleccionado = useMemo(
    () =>
      espacios.find(
        (espacio) => espacio.id === Number(espacioId)
      ),
    [espacios, espacioId]
  );

  const tarifaSeleccionada = useMemo(() => {
    if (!espacioSeleccionado) {
      return null;
    }

    return (
      espacioSeleccionado.tarifas.find(
        (tarifa) =>
          tarifa.activo &&
          tarifa.cantidad_huespedes ===
            Number(cantidadHuespedes) &&
          tarifa.incluye_desayuno === incluyeDesayuno
      ) ?? null
    );
  }, [
    espacioSeleccionado,
    cantidadHuespedes,
    incluyeDesayuno,
  ]);

  const cantidadNoches = useMemo(() => {
    if (!fechaInicio || !fechaFin) {
      return 0;
    }

    const inicio = new Date(
      `${fechaInicio}T00:00:00Z`
    );

    const fin = new Date(
      `${fechaFin}T00:00:00Z`
    );

    const noches =
      (fin.getTime() - inicio.getTime()) /
      (1000 * 60 * 60 * 24);

    return Number.isInteger(noches) && noches > 0
      ? noches
      : 0;
  }, [fechaInicio, fechaFin]);

  const totalEstimado =
    tarifaSeleccionada && cantidadNoches > 0
      ? tarifaSeleccionada.precio_por_noche *
        cantidadNoches
      : null;

  async function guardarCambios(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setGuardando(true);
    setError("");

    try {
      const response = await fetch(
        `/api/admin/reservas/${reserva.id}`,
        {
          method: "PATCH",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            espacio_id: Number(espacioId),
            fecha_inicio: fechaInicio,
            fecha_fin: fechaFin,
            cantidad_huespedes:
              Number(cantidadHuespedes),
            incluye_desayuno: incluyeDesayuno,

            nombre,
            correo,
            telefono,
          }),
        }
      );

      const contentType =
        response.headers.get("content-type");

      const data = contentType?.includes(
        "application/json"
      )
        ? await response.json()
        : null;

      if (!response.ok) {
        setError(
          data?.error ??
            "No fue posible actualizar la reservación."
        );

        return;
      }

      router.push(
        `/admin/reservas/${reserva.id}`
      );

      router.refresh();
    } catch (error) {
      console.error(error);

      setError(
        "Ocurrió un error actualizando la reservación."
      );
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form
      onSubmit={guardarCambios}
      className="space-y-8"
    >
      {/* RESERVACIÓN */}
      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="mb-6 text-xl font-bold text-[#173f32]">
          Reservación
        </h2>

        <div className="grid gap-5 md:grid-cols-2">
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
                setEspacioId(event.target.value)
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

          {/* CHECK-IN */}
          <div>
            <label
              htmlFor="fechaInicio"
              className="mb-2 block text-sm font-semibold text-[#173f32]"
            >
              Check-in
            </label>

            <input
              id="fechaInicio"
              type="date"
              value={fechaInicio}
              onChange={(event) =>
                setFechaInicio(event.target.value)
              }
              required
              className="w-full rounded-xl border border-gray-300 px-4 py-3"
            />
          </div>

          {/* CHECK-OUT */}
          <div>
            <label
              htmlFor="fechaFin"
              className="mb-2 block text-sm font-semibold text-[#173f32]"
            >
              Check-out
            </label>

            <input
              id="fechaFin"
              type="date"
              value={fechaFin}
              onChange={(event) =>
                setFechaFin(event.target.value)
              }
              required
              className="w-full rounded-xl border border-gray-300 px-4 py-3"
            />
          </div>

          {/* HUÉSPEDES */}
          <div>
            <label
              htmlFor="huespedes"
              className="mb-2 block text-sm font-semibold text-[#173f32]"
            >
              Huéspedes
            </label>

            <input
              id="huespedes"
              type="number"
              min="1"
              max={
                espacioSeleccionado?.capacidad ?? 1
              }
              value={cantidadHuespedes}
              onChange={(event) =>
                setCantidadHuespedes(
                  event.target.value
                )
              }
              required
              className="w-full rounded-xl border border-gray-300 px-4 py-3"
            />

            {espacioSeleccionado && (
              <p className="mt-1 text-xs text-gray-500">
                Capacidad máxima:{" "}
                {espacioSeleccionado.capacidad}
              </p>
            )}
          </div>

          {/* DESAYUNO */}
          <div>
            <label
              htmlFor="desayuno"
              className="mb-2 block text-sm font-semibold text-[#173f32]"
            >
              Desayuno
            </label>

            <select
              id="desayuno"
              value={
                incluyeDesayuno ? "si" : "no"
              }
              onChange={(event) =>
                setIncluyeDesayuno(
                  event.target.value === "si"
                )
              }
              className="w-full rounded-xl border border-gray-300 px-4 py-3"
            >
              <option value="no">
                Sin desayuno
              </option>

              <option value="si">
                Con desayuno
              </option>
            </select>
          </div>
        </div>
      </section>

      {/* CLIENTE */}
      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="mb-6 text-xl font-bold text-[#173f32]">
          Cliente
        </h2>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="nombre"
              className="mb-2 block text-sm font-semibold text-[#173f32]"
            >
              Nombre
            </label>

            <input
              id="nombre"
              type="text"
              value={nombre}
              onChange={(event) =>
                setNombre(event.target.value)
              }
              required
              className="w-full rounded-xl border border-gray-300 px-4 py-3"
            />
          </div>

          <div>
            <label
              htmlFor="correo"
              className="mb-2 block text-sm font-semibold text-[#173f32]"
            >
              Correo
            </label>

            <input
              id="correo"
              type="email"
              value={correo}
              onChange={(event) =>
                setCorreo(event.target.value)
              }
              required
              className="w-full rounded-xl border border-gray-300 px-4 py-3"
            />
          </div>

          <div>
            <label
              htmlFor="telefono"
              className="mb-2 block text-sm font-semibold text-[#173f32]"
            >
              Teléfono
            </label>

            <input
              id="telefono"
              type="text"
              value={telefono}
              onChange={(event) =>
                setTelefono(event.target.value)
              }
              className="w-full rounded-xl border border-gray-300 px-4 py-3"
            />
          </div>
        </div>
      </section>

      {/* NUEVA TARIFA */}
      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-[#173f32]">
          Nuevo cálculo
        </h2>

        {tarifaSeleccionada &&
        cantidadNoches > 0 ? (
          <div className="mt-5 grid gap-5 sm:grid-cols-3">
            <div>
              <p className="text-sm text-gray-500">
                Noches
              </p>

              <p className="mt-1 text-xl font-semibold">
                {cantidadNoches}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Precio por noche
              </p>

              <p className="mt-1 text-xl font-semibold">
                ₡
                {tarifaSeleccionada.precio_por_noche.toLocaleString(
                  "es-CR"
                )}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Nuevo total
              </p>

              <p className="mt-1 text-2xl font-bold text-[#173f32]">
                ₡
                {totalEstimado?.toLocaleString(
                  "es-CR"
                )}
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-5 rounded-xl bg-yellow-50 p-4 text-sm text-yellow-800">
            No existe una tarifa activa para esta
            combinación de alojamiento, huéspedes y
            desayuno.
          </div>
        )}
      </section>

      {error && (
        <div className="rounded-xl bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ACCIONES */}
      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={
            guardando ||
            !tarifaSeleccionada ||
            cantidadNoches <= 0
          }
          className="rounded-xl bg-[#173f32] px-6 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {guardando
            ? "Guardando..."
            : "Guardar cambios"}
        </button>

        <button
          type="button"
          onClick={() =>
            router.push(
              `/admin/reservas/${reserva.id}`
            )
          }
          disabled={guardando}
          className="rounded-xl border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 hover:bg-gray-50"
        >
          Cancelar edición
        </button>
      </div>
    </form>
  );
}