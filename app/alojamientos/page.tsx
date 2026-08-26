import { createClient } from "@/lib/supabase/server";

export default async function AlojamientosPage() {
  const supabase = await createClient();

  const { data: espacios, error } = await supabase
    .from("espacios")
    .select("*");

  if (error) {
    return (
      <main>
        <h1>Error al consultar Supabase</h1>
        <p>{error.message}</p>
      </main>
    );
  }

  return (
    <main>
      <h1>Alojamientos</h1>

      {espacios?.map((espacio) => (
        <div key={espacio.id}>
          <h2>{espacio.nombre}</h2>
          <p>{espacio.descripcion}</p>
          <p>${espacio.precio_por_noche} por noche</p>
          <p>Capacidad: {espacio.capacidad}</p>
        </div>
      ))}
    </main>
  );
}