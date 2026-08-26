import Header from "@/components/layout/Header";
import ReservaForm from "@/components/reservar/ReservaForm";
import { createClient } from "@/lib/supabase/server";

type Props = {
  searchParams: Promise<{
    espacio?: string;
  }>;
};

export default async function ReservarPage({ searchParams }: Props) {
  const { espacio } = await searchParams;

  const supabase = await createClient();

  const { data: espacios, error: espaciosError } = await supabase
    .from("espacios")
    .select(`
      id,
      nombre,
      capacidad,
      precio_persona_extra,
      precio_mascota,
      max_mascotas
    `)
    .eq("estado", "activo")
    .order("id");

  if (espaciosError) {
    console.error("Error cargando espacios:", espaciosError);
  }

  const { data: tarifas, error: tarifasError } = await supabase
  .from("tarifas")
  .select(`
    id,
    espacio_id,
    cantidad_huespedes,
    incluye_desayuno,
    precio_por_noche
  `)
  .eq("activo", true);

if (tarifasError) {
  console.error("Error cargando tarifas:", tarifasError);
}
  const espaciosConTarifas =
    espacios?.map((item) => ({
      ...item,

      tarifas:
        tarifas
          ?.filter((tarifa) => tarifa.espacio_id === item.id)
          .map((tarifa) => ({
            id: tarifa.id,
            cantidad_huespedes: tarifa.cantidad_huespedes,
            incluye_desayuno: tarifa.incluye_desayuno,
            precio_por_noche: Number(tarifa.precio_por_noche),
          })) ?? [],
    })) ?? [];

  const espacioInicial = espacio ? Number(espacio) : undefined;

  return (
    <>
      <Header />

      <main>
        <section className="bg-[var(--green-dark)] px-6 pb-16 pt-32 text-center text-white lg:px-10">
          <div className="mx-auto max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-[var(--turquoise)]">
              Mowgli&apos;s Platz
            </p>

            <h1 className="mt-3 text-5xl font-bold sm:text-6xl">
              Reservar
            </h1>

            <p className="mx-auto mt-5 max-w-xl leading-7 text-white/70">
              Seleccioná tu alojamiento y las fechas de tu estadía.
            </p>
          </div>
        </section>

        <section className="bg-[var(--cream)] px-6 py-16 lg:px-10">
          <div className="mx-auto max-w-3xl">
            <div className="rounded-[2.5rem] bg-white p-6 shadow-sm sm:p-10">
              <ReservaForm
                espacios={espaciosConTarifas}
                espacioInicial={
                  Number.isInteger(espacioInicial)
                    ? espacioInicial
                    : undefined
                }
              />
            </div>
          </div>
        </section>
      </main>
    </>
  );
}