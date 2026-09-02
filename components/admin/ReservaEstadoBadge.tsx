interface ReservaEstadoBadgeProps {
  estado: string;
}

export default function ReservaEstadoBadge({
  estado,
}: ReservaEstadoBadgeProps) {
  const estilos: Record<string, string> = {
    pendiente:
      "bg-yellow-100 text-yellow-800",

    confirmada:
      "bg-green-100 text-green-800",

    cancelada:
      "bg-red-100 text-red-700",

    completada:
      "bg-blue-100 text-blue-800",
  };

  const nombres: Record<string, string> = {
    pendiente: "Pendiente",
    confirmada: "Confirmada",
    cancelada: "Cancelada",
    completada: "Completada",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
        estilos[estado] ??
        "bg-gray-100 text-gray-700"
      }`}
    >
      {nombres[estado] ?? estado}
    </span>
  );
}