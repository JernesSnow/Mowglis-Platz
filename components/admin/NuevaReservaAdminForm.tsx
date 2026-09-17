"use client";

import {
  FormEvent,
  useMemo,
  useState,
} from "react";

import { useRouter } from "next/navigation";

interface Espacio {
  id: number;
  nombre: string;
  capacidad: number;
}

interface Tarifa {
  espacio_id: number;
  cantidad_huespedes: number;
  incluye_desayuno: boolean;
  precio_por_noche: number;
}

interface Props {
  espacios: Espacio[];
  tarifas: Tarifa[];
  fechaInicioInicial?: string;
  espacioIdInicial?: number | null;
}

function calcularNoches(
  inicio: string,
  fin: string
) {
  if (!inicio || !fin) {
    return 0;
  }

  const [yi, mi, di] =
    inicio.split("-").map(Number);

  const [yf, mf, df] =
    fin.split("-").map(Number);

  const inicioUTC = Date.UTC(
    yi,
    mi - 1,
    di
  );

  const finUTC = Date.UTC(
    yf,
    mf - 1,
    df
  );

  return Math.max(
    0,
    Math.round(
      (finUTC - inicioUTC) / 86400000
    )
  );
}

export default function NuevaReservaAdminForm({
  espacios,
  tarifas,
  fechaInicioInicial = "",
  espacioIdInicial = null,
}: Props) {
  const router = useRouter();

  const [espacioId, setEspacioId] =
    useState(
      espacioIdInicial &&
        espacios.some(
          (espacio) =>
            espacio.id === espacioIdInicial
        )
        ? String(espacioIdInicial)
        : espacios[0]
          ? String(espacios[0].id)
          : ""
    );

  const [
    fechaInicio,
    setFechaInicio,
  ] = useState(fechaInicioInicial);

  const [fechaFin, setFechaFin] =
    useState("");

  const [
    cantidadHuespedes,
    setCantidadHuespedes,
  ] = useState(1);

  const [
    incluyeDesayuno,
    setIncluyeDesayuno,
  ] = useState(false);

  const [estado, setEstado] =
    useState<
      "pendiente" | "confirmada"
    >("confirmada");

  const [nombre, setNombre] =
    useState("");

  const [correo, setCorreo] =
    useState("");

  const [telefono, setTelefono] =
    useState("");

  const [guardando, setGuardando] =
    useState(false);

  const [error, setError] =
    useState("");

  const espacio = espacios.find(
    (item) =>
      item.id === Number(espacioId)
  );

  const tarifa = useMemo(
    () =>
      tarifas.find(
        (item) =>
          item.espacio_id ===
            Number(espacioId) &&
          item.cantidad_huespedes ===
            cantidadHuespedes &&
          item.incluye_desayuno ===
            incluyeDesayuno
      ),
    [
      tarifas,
      espacioId,
      cantidadHuespedes,
      incluyeDesayuno,
    ]
  );

  const noches = calcularNoches(
    fechaInicio,
    fechaFin
  );

  const total =
    tarifa && noches > 0
      ? tarifa.precio_por_noche *
        noches
      : null;

  async function guardar(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setGuardando(true);
    setError("");

    try {
      const response = await fetch(
        "/api/admin/reservas",
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

            cantidad_huespedes:
              cantidadHuespedes,

            incluye_desayuno:
              incluyeDesayuno,

            estado,

            nombre,
            correo,
            telefono,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        setError(
          data?.error ??
            "No fue posible crear la reservación."
        );

        return;
      }

      router.push(
        `/admin/reservas/${data.reserva.id}`
      );

      router.refresh();
    } catch (error) {
      console.error(error);

      setError(
        "Ocurrió un error creando la reservación."
      );
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form
      onSubmit={guardar}
      className="rounded-2xl bg-white p-6 shadow-sm"
    >
      <div className="grid gap-5 md:grid-cols-2">
        {/* ALOJAMIENTO */}

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-semibold text-[#173f32]">
            Alojamiento
          </label>

          <select
            value={espacioId}
            onChange={(event) => {
              setEspacioId(
                event.target.value
              );

              setCantidadHuespedes(1);
            }}
            className="w-full rounded-xl border border-gray-300 px-4 py-3"
          >
            {espacios.map(
              (espacio) => (
                <option
                  key={espacio.id}
                  value={espacio.id}
                >
                  {espacio.nombre}
                </option>
              )
            )}
          </select>
        </div>

        {/* FECHAS */}

        <div>
          <label className="mb-2 block text-sm font-semibold text-[#173f32]">
            Entrada
          </label>

          <input
            type="date"
            required
            value={fechaInicio}
            onChange={(event) =>
              setFechaInicio(
                event.target.value
              )
            }
            className="w-full rounded-xl border border-gray-300 px-4 py-3"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-[#173f32]">
            Salida
          </label>

          <input
            type="date"
            required
            value={fechaFin}
            onChange={(event) =>
              setFechaFin(
                event.target.value
              )
            }
            className="w-full rounded-xl border border-gray-300 px-4 py-3"
          />
        </div>

        {/* HUÉSPEDES */}

        <div>
          <label className="mb-2 block text-sm font-semibold text-[#173f32]">
            Huéspedes
          </label>

          <select
            value={cantidadHuespedes}
            onChange={(event) =>
              setCantidadHuespedes(
                Number(
                  event.target.value
                )
              )
            }
            className="w-full rounded-xl border border-gray-300 px-4 py-3"
          >
            {Array.from(
              {
                length:
                  espacio?.capacidad ??
                  1,
              },
              (_, index) =>
                index + 1
            ).map((cantidad) => (
              <option
                key={cantidad}
                value={cantidad}
              >
                {cantidad}
              </option>
            ))}
          </select>
        </div>

        {/* ESTADO */}

        <div>
          <label className="mb-2 block text-sm font-semibold text-[#173f32]">
            Estado
          </label>

          <select
            value={estado}
            onChange={(event) =>
              setEstado(
                event.target.value as
                  | "pendiente"
                  | "confirmada"
              )
            }
            className="w-full rounded-xl border border-gray-300 px-4 py-3"
          >
            <option value="confirmada">
              Confirmada
            </option>

            <option value="pendiente">
              Pendiente
            </option>
          </select>
        </div>

        {/* DESAYUNO */}

        <label className="flex items-center gap-3 md:col-span-2">
          <input
            type="checkbox"
            checked={incluyeDesayuno}
            onChange={(event) =>
              setIncluyeDesayuno(
                event.target.checked
              )
            }
          />

          <span className="font-medium text-[#173f32]">
            Incluye desayuno
          </span>
        </label>

        {/* CLIENTE */}

        <div className="border-t border-gray-100 pt-5 md:col-span-2">
          <h2 className="text-xl font-bold text-[#173f32]">
            Cliente
          </h2>
        </div>

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
            Teléfono
          </label>

          <input
            value={telefono}
            onChange={(event) =>
              setTelefono(
                event.target.value
              )
            }
            className="w-full rounded-xl border border-gray-300 px-4 py-3"
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-semibold text-[#173f32]">
            Correo
          </label>

          <input
            type="email"
            required
            value={correo}
            onChange={(event) =>
              setCorreo(
                event.target.value
              )
            }
            className="w-full rounded-xl border border-gray-300 px-4 py-3"
          />
        </div>
      </div>

      {/* PRECIO */}

      <div className="mt-6 rounded-xl bg-[#f5f1df] p-4">
        <p className="text-sm text-gray-600">
          Tarifa por noche
        </p>

        <p className="mt-1 text-lg font-bold text-[#173f32]">
          {tarifa
            ? `₡${tarifa.precio_por_noche.toLocaleString(
                "es-CR"
              )}`
            : "Tarifa pendiente"}
        </p>

        {total !== null && (
          <>
            <p className="mt-3 text-sm text-gray-600">
              {noches}{" "}
              {noches === 1
                ? "noche"
                : "noches"}
            </p>

            <p className="mt-1 text-2xl font-bold text-[#173f32]">
              Total: ₡
              {total.toLocaleString(
                "es-CR"
              )}
            </p>
          </>
        )}
      </div>

      {error && (
        <div className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={
          guardando ||
          !tarifa ||
          noches <= 0
        }
        className="mt-6 rounded-xl bg-[#173f32] px-6 py-3 font-semibold text-white disabled:opacity-50"
      >
        {guardando
          ? "Creando reservación..."
          : "Crear reservación"}
      </button>
    </form>
  );
}