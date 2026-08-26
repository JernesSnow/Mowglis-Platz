"use client";

import { useMemo, useState } from "react";

type Tarifa = {
  id: number;
  cantidad_huespedes: number;
  incluye_desayuno: boolean;
  precio_por_noche: number;
};

type Espacio = {
  id: number;
  nombre: string;
  capacidad: number;
  precio_persona_extra: number | null;
  precio_mascota: number | null;
  max_mascotas: number;
  tarifas: Tarifa[];
};

type EspacioDisponible = {
  id: number;
  nombre: string;
  descripcion: string | null;
  capacidad: number;
  tipo: string;
  incluido_en_casa_completa: boolean;
  precio_persona_extra: number | null;
  precio_mascota: number | null;
  max_mascotas: number;

  disponible: boolean;
  motivo: string | null;
};

type ReservaFormProps = {
  espacios: Espacio[];
  espacioInicial?: number;
};

export default function ReservaForm({
  espacios,
  espacioInicial,
}: ReservaFormProps) {
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [huespedes, setHuespedes] = useState(1);

  const [buscando, setBuscando] = useState(false);
  const [busquedaRealizada, setBusquedaRealizada] = useState(false);
  const [errorBusqueda, setErrorBusqueda] = useState("");

  const [resultados, setResultados] = useState<EspacioDisponible[]>([]);

  const [espacioId, setEspacioId] = useState<number | null>(null);

  const [incluyeDesayuno, setIncluyeDesayuno] = useState(false);
  const [mascotas, setMascotas] = useState(0);

  const [creandoReserva, setCreandoReserva] = useState(false);
  const [errorReserva, setErrorReserva] = useState("");
  const [reservaCreada, setReservaCreada] = useState<{
    codigo: string;
    alojamiento: string;
    total: number;
  } | null>(null);

  const espacioSeleccionado = useMemo(() => {
    if (espacioId === null) {
      return null;
    }

    return espacios.find((espacio) => espacio.id === espacioId) ?? null;
  }, [espacios, espacioId]);

  const tarifaSeleccionada = useMemo(() => {
    if (!espacioSeleccionado) {
      return null;
    }

    return (
      espacioSeleccionado.tarifas.find(
        (tarifa) =>
          tarifa.cantidad_huespedes === huespedes &&
          tarifa.incluye_desayuno === incluyeDesayuno
      ) ?? null
    );
  }, [espacioSeleccionado, huespedes, incluyeDesayuno]);

  const cantidadNoches = useMemo(() => {
    if (!fechaInicio || !fechaFin) {
      return 0;
    }

    const inicio = new Date(`${fechaInicio}T00:00:00`);
    const fin = new Date(`${fechaFin}T00:00:00`);

    const diferencia = fin.getTime() - inicio.getTime();

    if (diferencia <= 0) {
      return 0;
    }

    return diferencia / (1000 * 60 * 60 * 24);
  }, [fechaInicio, fechaFin]);

  const subtotal =
    tarifaSeleccionada && cantidadNoches > 0
      ? Number(tarifaSeleccionada.precio_por_noche) * cantidadNoches
      : null;

  const hayDisponibles = resultados.some(
    (espacio) => espacio.disponible
  );

  async function buscarDisponibilidad() {
    setErrorBusqueda("");
    setBusquedaRealizada(false);
    setEspacioId(null);
    setMascotas(0);

    if (!fechaInicio || !fechaFin) {
      setErrorBusqueda("Seleccioná las fechas de entrada y salida.");
      return;
    }

    if (fechaFin <= fechaInicio) {
      setErrorBusqueda(
        "La fecha de salida debe ser posterior a la fecha de entrada."
      );
      return;
    }

    if (huespedes <= 0) {
      setErrorBusqueda("La cantidad de huéspedes no es válida.");
      return;
    }

    try {
      setBuscando(true);

      const params = new URLSearchParams({
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        huespedes: String(huespedes),
      });

      const response = await fetch(
        `/api/disponibilidad?${params.toString()}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ?? "No fue posible consultar la disponibilidad."
        );
      }

      setResultados(data.espacios ?? []);
      setBusquedaRealizada(true);

      // Si veníamos desde "Reservar" de un alojamiento,
      // intentamos seleccionarlo automáticamente si está disponible.
      if (espacioInicial) {
        const preferido = data.espacios?.find(
          (espacio: EspacioDisponible) =>
            espacio.id === espacioInicial && espacio.disponible
        );

        if (preferido) {
          setEspacioId(preferido.id);
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        setErrorBusqueda(error.message);
      } else {
        setErrorBusqueda("Ocurrió un error inesperado.");
      }
    } finally {
      setBuscando(false);
    }
  }

  function seleccionarEspacio(id: number) {
    setEspacioId(id);
    setMascotas(0);
    setIncluyeDesayuno(false);
  }

  async function handleSubmit(
  event: React.FormEvent<HTMLFormElement>
) {
  event.preventDefault();

  setErrorReserva("");

  if (!espacioSeleccionado) {
    setErrorReserva("Seleccioná un alojamiento.");
    return;
  }

  if (!tarifaSeleccionada) {
    setErrorReserva(
      "Todavía no existe una tarifa definida para esta combinación."
    );
    return;
  }

  const formData = new FormData(event.currentTarget);

  const nombre = String(formData.get("nombre") ?? "").trim();
  const correo = String(formData.get("correo") ?? "").trim();
  const telefono = String(formData.get("telefono") ?? "").trim();

  if (!nombre || !correo) {
    setErrorReserva(
      "Completá tu nombre y correo electrónico."
    );
    return;
  }

  try {
    setCreandoReserva(true);

    const response = await fetch("/api/reservas", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        espacio_id: espacioSeleccionado.id,

        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,

        cantidad_huespedes: huespedes,
        cantidad_mascotas: mascotas,

        incluye_desayuno: incluyeDesayuno,

        nombre,
        correo,
        telefono,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error ?? "No fue posible crear la reservación."
      );
    }

    setReservaCreada({
      codigo: data.reserva.codigo_reserva,
      alojamiento: data.reserva.alojamiento,
      total: Number(data.reserva.total),
    });
  } catch (error) {
    if (error instanceof Error) {
      setErrorReserva(error.message);
    } else {
      setErrorReserva("Ocurrió un error inesperado.");
    }
  } finally {
    setCreandoReserva(false);
  }
}

    if (reservaCreada) {
    return (
      <div className="py-10 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-2xl text-green-700">
          ✓
        </div>

        <h2 className="mt-6 text-3xl font-bold text-[var(--green-dark)]">
          ¡Reservación recibida!
        </h2>

        <p className="mx-auto mt-4 max-w-md leading-7 text-[var(--green-dark)]/65">
          Tu reservación para{" "}
          <strong>{reservaCreada.alojamiento}</strong> fue registrada
          correctamente.
        </p>

        <div className="mx-auto mt-8 max-w-sm rounded-[2rem] bg-[var(--cream)] p-6">
          <p className="text-sm text-[var(--green-dark)]/60">
            Código de reserva
          </p>

          <p className="mt-1 text-2xl font-bold text-[var(--green-dark)]">
            {reservaCreada.codigo}
          </p>

          <div className="mt-5 border-t border-black/10 pt-5">
            <p className="text-sm text-[var(--green-dark)]/60">
              Total
            </p>

            <p className="mt-1 text-2xl font-bold text-[var(--green-dark)]">
              ₡{reservaCreada.total.toLocaleString("es-CR")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-10">

      {/*PASO 1 - Buscar */}

      <section>
        <div className="mb-7">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[var(--green)]">
            Paso 1
          </p>

          <h2 className="mt-2 text-3xl font-bold text-[var(--green-dark)]">
            ¿Cuándo querés hospedarte?
          </h2>

          <p className="mt-2 text-[var(--green-dark)]/60">
            Indicá tus fechas para mostrarte solamente las opciones que podés
            reservar.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="fechaInicio"
              className="mb-2 block font-semibold text-[var(--green-dark)]"
            >
              Check-in
            </label>

            <input
              id="fechaInicio"
              type="date"
              value={fechaInicio}
              onChange={(event) => {
                setFechaInicio(event.target.value);
                setBusquedaRealizada(false);
                setEspacioId(null);
              }}
              required
              className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none focus:border-[var(--green)]"
            />
          </div>

          <div>
            <label
              htmlFor="fechaFin"
              className="mb-2 block font-semibold text-[var(--green-dark)]"
            >
              Check-out
            </label>

            <input
              id="fechaFin"
              type="date"
              value={fechaFin}
              min={fechaInicio || undefined}
              onChange={(event) => {
                setFechaFin(event.target.value);
                setBusquedaRealizada(false);
                setEspacioId(null);
              }}
              required
              className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none focus:border-[var(--green)]"
            />
          </div>
        </div>

        <div className="mt-5">
          <label
            htmlFor="huespedes"
            className="mb-2 block font-semibold text-[var(--green-dark)]"
          >
            Huéspedes
          </label>

          <input
            id="huespedes"
            type="number"
            min={1}
            value={huespedes}
            onChange={(event) => {
              setHuespedes(Number(event.target.value));
              setBusquedaRealizada(false);
              setEspacioId(null);
            }}
            required
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none focus:border-[var(--green)] sm:max-w-xs"
          />
        </div>

        {errorBusqueda && (
          <div className="mt-5 rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-700">
            {errorBusqueda}
          </div>
        )}

        <button
          type="button"
          onClick={buscarDisponibilidad}
          disabled={buscando}
          className="mt-7 rounded-full bg-[var(--green-dark)] px-8 py-3.5 font-bold text-white transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {buscando ? "Buscando..." : "Buscar disponibilidad"}
        </button>
      </section>

      {/* PASO 2 - Resultados*/}

{busquedaRealizada && (
  <section className="border-t border-black/10 pt-10">
    <div className="mb-7">
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-[var(--green)]">
        Paso 2
      </p>

      <h2 className="mt-2 text-3xl font-bold text-[var(--green-dark)]">
        Alojamientos
      </h2>

      <p className="mt-2 text-[var(--green-dark)]/60">
        Disponibilidad del {fechaInicio} al {fechaFin}.
      </p>
    </div>

    {resultados.length === 0 ? (
      <div className="rounded-[2rem] bg-[var(--cream)] p-8 text-center">
        <h3 className="text-xl font-bold text-[var(--green-dark)]">
          No encontramos alojamientos
        </h3>

        <p className="mt-2 text-[var(--green-dark)]/60">
          No hay opciones que coincidan con tu búsqueda.
        </p>
      </div>
    ) : !hayDisponibles ? (
      <div className="rounded-[2rem] bg-red-50 p-8 text-center">
        <h3 className="text-2xl font-bold text-red-700">
          No hay disponibilidad
        </h3>

        <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-red-700/80">
          Actualmente no tenemos alojamientos disponibles para las fechas y
          cantidad de huéspedes seleccionadas.
        </p>

        <p className="mt-2 text-sm text-red-700/70">
          Probá seleccionando otras fechas.
        </p>
      </div>
    ) : (
      <div className="space-y-4">
        {resultados.map((espacio) => {
          const seleccionado = espacioId === espacio.id;

          return (
            <div
              key={espacio.id}
              className={`
                rounded-[2rem] border p-6 transition
                ${
                  espacio.disponible
                    ? "border-[var(--green-dark)]/10 bg-[var(--cream)]"
                    : "border-red-100 bg-red-50/70"
                }
                ${
                  seleccionado
                    ? "ring-2 ring-[var(--green-dark)]"
                    : ""
                }
              `}
            >
              <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-xl font-bold text-[var(--green-dark)]">
                      {espacio.nombre}
                    </h3>

                    {espacio.disponible ? (
                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-800">
                        Disponible
                      </span>
                    ) : (
                      <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
                        No disponible
                      </span>
                    )}
                  </div>

                  <p className="mt-2 text-sm text-[var(--green-dark)]/60">
                    Hasta {espacio.capacidad} huéspedes
                  </p>

                  {!espacio.disponible && espacio.motivo && (
                    <p className="mt-3 text-sm font-medium text-red-700">
                      {espacio.motivo}
                    </p>
                  )}
                </div>

                {espacio.disponible && (
                  <button
                    type="button"
                    onClick={() => seleccionarEspacio(espacio.id)}
                    className={
                      seleccionado
                        ? "rounded-full bg-[var(--green-dark)] px-6 py-3 font-bold text-white"
                        : "rounded-full bg-white px-6 py-3 font-bold text-[var(--green-dark)] shadow-sm hover:scale-105"
                    }
                  >
                    {seleccionado ? "Seleccionado" : "Seleccionar"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    )}
  </section>
)}

      {/* PASO 3 - Configurar reserva*/}

      {espacioSeleccionado && (
        <section className="border-t border-black/10 pt-10">
          <div className="mb-7">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[var(--green)]">
              Paso 3
            </p>

            <h2 className="mt-2 text-3xl font-bold text-[var(--green-dark)]">
              Personalizá tu estadía
            </h2>

            <p className="mt-2 text-[var(--green-dark)]/60">
              Elegiste{" "}
              <strong className="text-[var(--green-dark)]">
                {espacioSeleccionado.nombre}
              </strong>
              .
            </p>
          </div>

          {/* Desayuno */}

          <label className="flex cursor-pointer items-center gap-3 rounded-2xl bg-[var(--cream)] p-4">
            <input
              type="checkbox"
              checked={incluyeDesayuno}
              onChange={(event) =>
                setIncluyeDesayuno(event.target.checked)
              }
              className="h-5 w-5"
            />

            <span className="font-medium text-[var(--green-dark)]">
              Incluir desayuno
            </span>
          </label>

          {/* Mascotas */}

          {espacioSeleccionado.max_mascotas > 0 && (
            <div className="mt-5">
              <label
                htmlFor="mascotas"
                className="mb-2 block font-semibold text-[var(--green-dark)]"
              >
                Mascotas
              </label>

              <input
                id="mascotas"
                type="number"
                min={0}
                max={espacioSeleccionado.max_mascotas}
                value={mascotas}
                onChange={(event) =>
                  setMascotas(Number(event.target.value))
                }
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none sm:max-w-xs"
              />

              <p className="mt-2 text-sm text-[var(--green-dark)]/50">
                Máximo {espacioSeleccionado.max_mascotas}.
              </p>
            </div>
          )}

          {/* Tarifa */}

          <div className="mt-7 rounded-[2rem] bg-[var(--green-dark)] p-6 text-white">
            <div className="flex justify-between gap-5">
              <span>Noches</span>

              <strong>{cantidadNoches}</strong>
            </div>

            <div className="mt-3 flex justify-between gap-5">
              <span>Huéspedes</span>

              <strong>{huespedes}</strong>
            </div>

            {tarifaSeleccionada ? (
              <>
                <div className="mt-3 flex justify-between gap-5">
                  <span>Precio por noche</span>

                  <strong>
                    ₡
                    {Number(
                      tarifaSeleccionada.precio_por_noche
                    ).toLocaleString("es-CR")}
                  </strong>
                </div>

                {subtotal !== null && (
                  <div className="mt-5 border-t border-white/20 pt-5">
                    <div className="flex justify-between gap-5 text-xl">
                      <span>Subtotal</span>

                      <strong>
                        ₡{subtotal.toLocaleString("es-CR")}
                      </strong>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="mt-5 border-t border-white/20 pt-5 text-sm text-white/70">
                La tarifa para esta combinación todavía debe confirmarse.
              </p>
            )}
          </div>
        </section>
      )}

      {/* PASO 4 - Datos cliente*/}

      {espacioSeleccionado && (
        <section className="border-t border-black/10 pt-10">
          <div className="mb-7">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[var(--green)]">
              Paso 4
            </p>

            <h2 className="mt-2 text-3xl font-bold text-[var(--green-dark)]">
              Tus datos
            </h2>

            <p className="mt-2 text-[var(--green-dark)]/60">
              No necesitás registrarte ni iniciar sesión.
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <label
                htmlFor="nombre"
                className="mb-2 block font-semibold text-[var(--green-dark)]"
              >
                Nombre completo
              </label>

              <input
                id="nombre"
                name="nombre"
                type="text"
                required
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="correo"
                  className="mb-2 block font-semibold text-[var(--green-dark)]"
                >
                  Correo electrónico
                </label>

                <input
                  id="correo"
                  name="correo"
                  type="email"
                  required
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="telefono"
                  className="mb-2 block font-semibold text-[var(--green-dark)]"
                >
                  Teléfono
                </label>

                <input
                  id="telefono"
                  name="telefono"
                  type="tel"
                  required
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none"
                />
              </div>
            </div>
          </div>

          {errorReserva && (
          <div className="mt-8 rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-700">
          {errorReserva}
          </div>
          )}

          <button
            type="submit"
            disabled={creandoReserva || !tarifaSeleccionada}
            className="mt-8 w-full rounded-full bg-[var(--yellow)] px-7 py-4 font-bold text-[var(--green-dark)] transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {creandoReserva
            ? "Procesando reservación..."
            : !tarifaSeleccionada
              ? "Tarifa pendiente"
              : "Confirmar reservación"
              }
          </button>
        </section>
      )}
    </form>
  );
}