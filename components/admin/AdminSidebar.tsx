import Link from "next/link";

import LogoutButton from "./LogoutButton";

export default function AdminSidebar() {
  return (
    <aside className="flex w-full flex-col bg-[#173f32] p-5 text-white md:h-screen md:w-64 md:shrink-0 md:overflow-y-auto">
      <div className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#72c8b5]">
          Administración
        </p>

        <h2 className="mt-2 text-2xl font-bold">
          Mowgli&apos;s Platz
        </h2>
      </div>

      <nav className="flex flex-1 flex-col gap-2">
        <Link
          href="/admin"
          className="rounded-xl px-4 py-3 font-medium hover:bg-white/10"
        >
          Dashboard
        </Link>

        <Link
          href="/admin/reservas"
          className="rounded-xl px-4 py-3 font-medium hover:bg-white/10"
        >
          Reservaciones
        </Link>

        <Link
          href="/admin/calendario"
          className="rounded-xl px-4 py-3 font-medium hover:bg-white/10"
        >
          Calendario
        </Link>

        <Link
          href="/admin/alojamientos"
          className="rounded-xl px-4 py-3 font-medium hover:bg-white/10"
        >
          Alojamientos
        </Link>

        <Link
          href="/admin/bloqueos"
          className="rounded-xl px-4 py-3 font-medium hover:bg-white/10"
        >
          Bloqueos
        </Link>

        <Link
          href="/admin/tarifas"
          className="rounded-xl px-4 py-3 font-medium hover:bg-white/10"
        >
          Tarifas
        </Link>

        <Link
          href="/admin/integraciones"
          className="rounded-xl px-4 py-3 font-medium hover:bg-white/10"
        >
          Integraciones
        </Link>
      </nav>

      <div className="border-t border-white/10 pt-4">
        <LogoutButton />
      </div>
    </aside>
  );
}