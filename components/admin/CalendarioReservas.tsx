"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

interface Espacio {
  id: number;
  nombre: string;
}

interface Reserva {
  id: number;
  codigo_reserva: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado: string;
  espacio_id: number;
  alojamiento: string;
  cliente: string;
}

interface Bloqueo {
  id: number;
  fecha_inicio: string;
  fecha_fin: string;
  motivo: string | null;
  origen: string;
  espacio_id: number;
  alojamiento: string;
}

interface Props {
  espacios: Espacio[];
  reservas: Reserva[];
  bloqueos: Bloqueo[];
}

const meses = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const diasSemana = [
  "Lun",
  "Mar",
  "Mié",
  "Jue",
  "Vie",
  "Sáb",
  "Dom",
];

function fechaKey(
  year: number,
  month: number,
  day: number
) {
  return [
    year,
    String(month + 1).padStart(2, "0"),
    String(day).padStart(2, "0"),
  ].join("-");
}

function estaDentro(
  fecha: string,
  inicio: string,
  fin: string
) {
  // fecha_fin es checkout y NO cuenta
  return fecha >= inicio && fecha < fin;
}

export default function CalendarioReservas({
  espacios,
  reservas,
  bloqueos,
}: Props) {
  const hoy = new Date();

  const [year, setYear] = useState(
    hoy.getFullYear()
  );

  const [month, setMonth] = useState(
    hoy.getMonth()
  );

  const [espacioId, setEspacioId] =
    useState<number | "todos">("todos");

  const [fechaSeleccionada, setFechaSeleccionada,] =
   useState<string | null>(null);

  function mesAnterior() {
    if (month === 0) {
      setMonth(11);
      setYear((actual) => actual - 1);
    } else {
      setMonth((actual) => actual - 1);
    }
  }

  function mesSiguiente() {
    if (month === 11) {
      setMonth(0);
      setYear((actual) => actual + 1);
    } else {
      setMonth((actual) => actual + 1);
    }
  }

  function irHoy() {
    const ahora = new Date();

    setYear(ahora.getFullYear());
    setMonth(ahora.getMonth());
  }

  function crearHref(ruta: string) {
  if (!fechaSeleccionada) {
    return ruta;
  }

  const params = new URLSearchParams();

  params.set(
    "fecha_inicio",
    fechaSeleccionada
  );

  if (espacioId !== "todos") {
    params.set(
      "espacio_id",
      String(espacioId)
    );
  }

  return `${ruta}?${params.toString()}`;
}

  const dias = useMemo(() => {
    const cantidadDias =
      new Date(
        year,
        month + 1,
        0
      ).getDate();

    const primerDia =
      new Date(
        year,
        month,
        1
      ).getDay();

// JavaScript usa esta numeración en getDay():
// 0 = domingo, 1 = lunes, 2 = martes ... 6 = sábado.
//
// Como nuestro calendario empieza en lunes,
// convertimos esa numeración para que quede:
// 0 = lunes, 1 = martes ... 6 = domingo.

    const espaciosVacios =
      (primerDia + 6) % 7;

    const resultado: (
      | {
          tipo: "vacio";
          key: string;
        }
      | {
          tipo: "dia";
          key: string;
          numero: number;
          fecha: string;
        }
    )[] = [];

    for (
      let i = 0;
      i < espaciosVacios;
      i++
    ) {
      resultado.push({
        tipo: "vacio",
        key: `vacio-${i}`,
      });
    }

    for (
      let dia = 1;
      dia <= cantidadDias;
      dia++
    ) {
      const fecha = fechaKey(
        year,
        month,
        dia
      );

      resultado.push({
        tipo: "dia",
        key: fecha,
        numero: dia,
        fecha,
      });
    }

    return resultado;
  }, [year, month]);

  const hoyKey = fechaKey(
    hoy.getFullYear(),
    hoy.getMonth(),
    hoy.getDate()
  );

  const reservasFiltradas =
    espacioId === "todos"
      ? reservas
      : reservas.filter(
          (reserva) =>
            reserva.espacio_id === espacioId
        );

  const bloqueosFiltrados =
    espacioId === "todos"
      ? bloqueos
      : bloqueos.filter(
          (bloqueo) =>
            bloqueo.espacio_id === espacioId
        );

  return (
    <div>
      {/* CONTROLES */}

      <div className="mb-6 rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={mesAnterior}
              className="rounded-xl border border-gray-300 px-4 py-2 font-semibold text-[#173f32] hover:bg-gray-50"
            >
              ←
            </button>

            <h2 className="min-w-[210px] text-center text-xl font-bold text-[#173f32]">
              {meses[month]} {year}
            </h2>

            <button
              type="button"
              onClick={mesSiguiente}
              className="rounded-xl border border-gray-300 px-4 py-2 font-semibold text-[#173f32] hover:bg-gray-50"
            >
              →
            </button>

            <button
              type="button"
              onClick={irHoy}
              className="rounded-xl bg-[#173f32] px-4 py-2 font-semibold text-white"
            >
              Hoy
            </button>
          </div>

          <div>
            <select
              value={espacioId}
              onChange={(event) => {
                const value =
                  event.target.value;

                setEspacioId(
                  value === "todos"
                    ? "todos"
                    : Number(value)
                );
              }}
              className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-[#173f32]"
            >
              <option value="todos">
                Todos los alojamientos
              </option>

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
        </div>
      </div>

      {/* LEYENDA */}

      <div className="mb-6 flex flex-wrap gap-3">
        <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-800">
          Pendiente
        </span>

        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
          Confirmada
        </span>

        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
          Bloqueo manual
        </span>

        <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
          Airbnb
        </span>
      </div>

      {/* CALENDARIO */}

      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
        <div className="min-w-[900px]">

          {/* CABECERA */}

          <div className="grid grid-cols-7 border-b border-gray-200 bg-[#173f32] text-white">
            {diasSemana.map((dia) => (
              <div
                key={dia}
                className="px-3 py-4 text-center text-sm font-semibold"
              >
                {dia}
              </div>
            ))}
          </div>

          {/* DÍAS */}

          <div className="grid grid-cols-7">
            {dias.map((dia) => {
              if (dia.tipo === "vacio") {
                return (
                  <div
                    key={dia.key}
                    
                    className="min-h-[145px] border-b border-r border-gray-100 bg-gray-50"
                  />
                );
              }

              const reservasDia =
                reservasFiltradas.filter(
                  (reserva) =>
                    estaDentro(
                      dia.fecha,
                      reserva.fecha_inicio,
                      reserva.fecha_fin
                    )
                );

              const bloqueosDia =
                bloqueosFiltrados.filter(
                  (bloqueo) =>
                    estaDentro(
                      dia.fecha,
                      bloqueo.fecha_inicio,
                      bloqueo.fecha_fin
                    )
                );

              return (
                <div
                  key={dia.key}
                  onClick={() =>
                    setFechaSeleccionada(dia.fecha)
                  }
                  className="min-h-[145px] cursor-pointer border-b border-r border-gray-100 p-2 transition hover:bg-[#f5f1df]/60"
                >
                  <div className="mb-2 flex justify-end">
                    <span
                      className={
                        dia.fecha === hoyKey
                          ? "flex h-7 w-7 items-center justify-center rounded-full bg-[#173f32] text-sm font-bold text-white"
                          : "flex h-7 w-7 items-center justify-center text-sm font-semibold text-gray-600"
                      }
                    >
                      {dia.numero}
                    </span>
                  </div>

                  <div className="space-y-1">

                    {/* RESERVAS */}

                    {reservasDia.map(
                      (reserva) => (
                        <Link
                          key={`reserva-${reserva.id}`}
                          href={`/admin/reservas/${reserva.id}`}
                          onClick={(event) =>
                          event.stopPropagation()}
                          title={`${reserva.alojamiento} - ${reserva.cliente}`}
                          className={
                            reserva.estado ===
                            "confirmada"
                              ? "block truncate rounded-lg bg-green-100 px-2 py-1.5 text-xs font-semibold text-green-800 hover:bg-green-200"
                              : reserva.estado ===
                                "completada"
                              ? "block truncate rounded-lg bg-gray-100 px-2 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-200"
                              : "block truncate rounded-lg bg-yellow-100 px-2 py-1.5 text-xs font-semibold text-yellow-800 hover:bg-yellow-200"
                          }
                        >
                          {reserva.alojamiento}
                          {" · "}
                          {reserva.cliente}
                        </Link>
                      )
                    )}

                    {/* BLOQUEOS */}

                    {bloqueosDia.map(
                      (bloqueo) => (
                        <Link
                          key={`bloqueo-${bloqueo.id}`}
                          href={`/admin/bloqueos/${bloqueo.id}`}
                          onClick={(event) =>
                          event.stopPropagation()}
                          title={`${bloqueo.alojamiento} - ${
                            bloqueo.motivo ??
                            "Bloqueo"
                          }`}
                          className={
                            bloqueo.origen === "airbnb"
                              ? "block truncate rounded-lg bg-red-100 px-2 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-200"
                              : "block truncate rounded-lg bg-blue-100 px-2 py-1.5 text-xs font-semibold text-blue-800 hover:bg-blue-200"
                          }
                        >
                          {bloqueo.alojamiento}
                        </Link>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {fechaSeleccionada && (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={() =>
        setFechaSeleccionada(null)
      }
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-[#286453]">
              Calendario
            </p>

            <h2 className="mt-1 text-2xl font-bold text-[#173f32]">
              {fechaSeleccionada}
            </h2>
          </div>

          <button
            type="button"
            onClick={() =>
              setFechaSeleccionada(null)
            }
            className="rounded-lg px-3 py-1 text-xl text-gray-500 hover:bg-gray-100"
          >
            ×
          </button>
        </div>

        <p className="mt-4 text-gray-600">
          ¿Qué deseas registrar para esta fecha?
        </p>

        {espacioId !== "todos" && (
          <div className="mt-4 rounded-xl bg-[#f5f1df] px-4 py-3 text-sm text-[#173f32]">
            Alojamiento seleccionado:{" "}
            <strong>
              {
                espacios.find(
                  (espacio) =>
                    espacio.id === espacioId
                )?.nombre
              }
            </strong>
          </div>
        )}

        <div className="mt-6 grid gap-3">
          <Link
            href={crearHref(
              "/admin/reservas/nueva"
            )}
            className="rounded-xl bg-[#173f32] px-5 py-3 text-center font-semibold text-white hover:opacity-90"
          >
            Nueva reservación
          </Link>

          <Link
            href={crearHref(
              "/admin/bloqueos"
            )}
            className="rounded-xl border border-[#286453] px-5 py-3 text-center font-semibold text-[#286453] hover:bg-[#286453]/5"
          >
            Crear bloqueo
          </Link>

          <button
            type="button"
            onClick={() =>
              setFechaSeleccionada(null)
            }
            className="rounded-xl px-5 py-3 font-semibold text-gray-500 hover:bg-gray-50"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )}
  </div>
  );
}