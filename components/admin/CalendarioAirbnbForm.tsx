"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Calendario {
  id: number;
  url_ical: string;
  activo: boolean;
  ultima_sincronizacion: string | null;
}

interface CalendarioAirbnbFormProps {
  espacio: {
    id: number;
    nombre: string;
    tipo: string;
  };

  calendario: Calendario | null;
}

export default function CalendarioAirbnbForm({
  espacio,
  calendario,
}: CalendarioAirbnbFormProps) {
  const router = useRouter();

  const [
    calendarioId,
    setCalendarioId,
  ] = useState<number | null>(
    calendario?.id ?? null
  );

  const [urlIcal, setUrlIcal] =
    useState(
      calendario?.url_ical ?? ""
    );

  const [activo, setActivo] =
    useState(
      calendario?.activo ?? true
    );

  const [guardando, setGuardando] =
    useState(false);

  const [
    sincronizando,
    setSincronizando,
  ] = useState(false);

  const [error, setError] =
    useState("");

  const [mensaje, setMensaje] =
    useState("");

  async function guardar() {
    setGuardando(true);
    setError("");
    setMensaje("");

    try {
      const response = await fetch(
        "/api/admin/calendarios",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            espacio_id: espacio.id,
            url_ical: urlIcal,
            activo,
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
            "No fue posible guardar el calendario."
        );

        return;
      }

      setCalendarioId(
        data.calendario.id
      );

      setMensaje(
        "Configuración guardada."
      );

      router.refresh();
    } catch (error) {
      console.error(error);

      setError(
        "Ocurrió un error guardando el calendario."
      );
    } finally {
      setGuardando(false);
    }
  }

  async function sincronizar() {
    if (!calendarioId) {
      setError(
        "Primero debes guardar el calendario."
      );

      return;
    }

    setSincronizando(true);
    setError("");
    setMensaje("");

    try {
      const response = await fetch(
        `/api/admin/calendarios/${calendarioId}/sincronizar`,
        {
          method: "POST",
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
            "No fue posible sincronizar el calendario."
        );

        return;
      }

      setMensaje(
        `Sincronización completada. ${data.eventosProcesados ?? 0} eventos procesados y ${data.eventosEliminados ?? 0} eliminados.`
      );

      router.refresh();
    } catch (error) {
      console.error(error);

      setError(
        "Ocurrió un error sincronizando el calendario."
      );
    } finally {
      setSincronizando(false);
    }
  }

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#173f32]">
            {espacio.nombre}
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            {espacio.tipo}
          </p>
        </div>

        {calendarioId ? (
          <span className="w-fit rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
            Configurado
          </span>
        ) : (
          <span className="w-fit rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
            Sin configurar
          </span>
        )}
      </div>

      <div className="mt-6">
        <label
          htmlFor={`url-${espacio.id}`}
          className="mb-2 block text-sm font-semibold text-[#173f32]"
        >
          URL del calendario iCal de Airbnb
        </label>

        <input
          id={`url-${espacio.id}`}
          type="url"
          value={urlIcal}
          onChange={(event) =>
            setUrlIcal(
              event.target.value
            )
          }
          placeholder="https://www.airbnb.com/calendar/ical/..."
          className="w-full rounded-xl border border-gray-300 px-4 py-3"
        />

        <p className="mt-2 text-xs text-gray-500">
          Esta dirección solo se utiliza
          desde el servidor para sincronizar
          disponibilidad.
        </p>
      </div>

      <label className="mt-5 flex w-fit items-center gap-3">
        <input
          type="checkbox"
          checked={activo}
          onChange={(event) =>
            setActivo(
              event.target.checked
            )
          }
        />

        <span className="text-sm font-medium text-[#173f32]">
          Sincronización activa
        </span>
      </label>

      <div className="mt-5 rounded-xl bg-gray-50 p-4">
        <p className="text-xs text-gray-500">
          Última sincronización
        </p>

        <p className="mt-1 text-sm font-medium text-[#173f32]">
          {calendario?.ultima_sincronizacion
            ? new Date(
                calendario.ultima_sincronizacion
              ).toLocaleString(
                "es-CR"
              )
            : "Nunca"}
        </p>
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

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={guardar}
          disabled={
            guardando ||
            !urlIcal.trim()
          }
          className="rounded-xl bg-[#173f32] px-5 py-3 font-semibold text-white disabled:opacity-50"
        >
          {guardando
            ? "Guardando..."
            : "Guardar"}
        </button>

        <button
          type="button"
          onClick={sincronizar}
          disabled={
            sincronizando ||
            !calendarioId ||
            !activo
          }
          className="rounded-xl border border-[#286453] bg-white px-5 py-3 font-semibold text-[#286453] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {sincronizando
            ? "Sincronizando..."
            : "Sincronizar ahora"}
        </button>
      </div>
    </section>
  );
}