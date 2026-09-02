"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

export default function UpdatePasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");

  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function cambiarPassword(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    if (password.length < 8) {
      setError(
        "La contraseña debe tener al menos 8 caracteres."
      );
      return;
    }

    if (password !== confirmarPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setCargando(true);

    try {
      const supabase = createClient();

      const { error: updateError } =
        await supabase.auth.updateUser({
          password,
        });

      if (updateError) {
        console.error(updateError);
        setError(
          "No fue posible actualizar la contraseña."
        );
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch (error) {
      console.error(error);

      setError(
        "Ocurrió un error al cambiar la contraseña."
      );
    } finally {
      setCargando(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f1df] px-4">
      <form
        onSubmit={cambiarPassword}
        className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl"
      >
        <h1 className="text-3xl font-bold text-[#173f32]">
          Nueva contraseña
        </h1>

        <p className="mt-2 text-sm text-gray-600">
          Ingresa la nueva contraseña para tu cuenta.
        </p>

        <div className="mt-8 space-y-5">
          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-semibold text-[#173f32]"
            >
              Nueva contraseña
            </label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              required
              className="w-full rounded-xl border border-gray-300 px-4 py-3"
            />
          </div>

          <div>
            <label
              htmlFor="confirmarPassword"
              className="mb-2 block text-sm font-semibold text-[#173f32]"
            >
              Confirmar contraseña
            </label>

            <input
              id="confirmarPassword"
              type="password"
              value={confirmarPassword}
              onChange={(event) =>
                setConfirmarPassword(event.target.value)
              }
              required
              className="w-full rounded-xl border border-gray-300 px-4 py-3"
            />
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="w-full rounded-xl bg-[#173f32] px-5 py-3 font-semibold text-white disabled:opacity-50"
          >
            {cargando
              ? "Actualizando..."
              : "Cambiar contraseña"}
          </button>
        </div>
      </form>
    </main>
  );
}