"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const router = useRouter();

  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");

  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  async function iniciarSesion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setCargando(true);

    try {
      const supabase = createClient();

      const { error: loginError } =
        await supabase.auth.signInWithPassword({
          email: correo,
          password,
        });

      if (loginError) {
        setError("Correo o contraseña incorrectos.");
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch (error) {
      console.error(error);

      setError(
        "Ocurrió un error al iniciar sesión."
      );
    } finally {
      setCargando(false);
    }
  }

  return (
    <form
      onSubmit={iniciarSesion}
      className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl"
    >
      <div className="mb-8">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-[#286453]">
          Administración
        </p>

        <h1 className="text-3xl font-bold text-[#173f32]">
          Mowgli&apos;s Platz
        </h1>

        <p className="mt-2 text-sm text-gray-600">
          Ingresa con tu cuenta de administrador.
        </p>
      </div>

      <div className="space-y-5">
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
            onChange={(event) => setCorreo(event.target.value)}
            required
            autoComplete="email"
            className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-[#286453]"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-2 block text-sm font-semibold text-[#173f32]"
          >
            Contraseña
          </label>

          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            autoComplete="current-password"
            className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-[#286453]"
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
          className="w-full rounded-xl bg-[#173f32] px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {cargando
            ? "Iniciando sesión..."
            : "Iniciar sesión"}
        </button>
      </div>
    </form>
  );
}