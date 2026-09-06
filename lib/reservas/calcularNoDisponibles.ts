interface EspacioDisponibilidad {
  id: number;
  tipo: string;
  incluido_en_casa_completa: boolean;
  seccion: number | null;
}

export function calcularNoDisponibles(
  espacios: EspacioDisponibilidad[],
  ocupadosDirectamente: Set<number>
) {
  const casaCompleta = espacios.find(
    (item) => item.tipo === "casa_completa"
  );

  const casaCompletaEstudio = espacios.find(
    (item) => item.tipo === "casa_completa_estudio"
  );

  const estudio = espacios.find(
    (item) => item.tipo === "estudio"
  );

  const secciones = espacios.filter(
    (item) => item.tipo === "seccion"
  );

  const habitacionesIndividuales = espacios.filter(
    (item) =>
      item.tipo === "habitacion_individual" &&
      item.incluido_en_casa_completa === true
  );

  const espaciosCasa = [
    ...secciones,
    ...habitacionesIndividuales,
  ];

  const noDisponibles = new Set<number>(
    ocupadosDirectamente
  );

  ocupadosDirectamente.forEach((idOcupado) => {
    const ocupado = espacios.find(
      (item) => item.id === idOcupado
    );

    if (!ocupado) {
      return;
    }

    // SECCIÓN
    if (ocupado.tipo === "seccion") {
      habitacionesIndividuales
        .filter(
          (habitacion) =>
            habitacion.seccion === ocupado.seccion
        )
        .forEach((habitacion) => {
          noDisponibles.add(habitacion.id);
        });

      if (casaCompleta) {
        noDisponibles.add(casaCompleta.id);
      }

      if (casaCompletaEstudio) {
        noDisponibles.add(casaCompletaEstudio.id);
      }
    }

    // HABITACIÓN INDIVIDUAL
    if (ocupado.tipo === "habitacion_individual") {
      const seccionRelacionada = secciones.find(
        (seccion) =>
          seccion.seccion !== null &&
          seccion.seccion === ocupado.seccion
      );

      if (seccionRelacionada) {
        noDisponibles.add(seccionRelacionada.id);
      }

      if (casaCompleta) {
        noDisponibles.add(casaCompleta.id);
      }

      if (casaCompletaEstudio) {
        noDisponibles.add(casaCompletaEstudio.id);
      }
    }

    // CASA COMPLETA
    if (ocupado.tipo === "casa_completa") {
      espaciosCasa.forEach((item) => {
        noDisponibles.add(item.id);
      });

      if (casaCompletaEstudio) {
        noDisponibles.add(casaCompletaEstudio.id);
      }
    }

    // ESTUDIO
    if (ocupado.tipo === "estudio") {
      if (casaCompletaEstudio) {
        noDisponibles.add(casaCompletaEstudio.id);
      }
    }

    // CASA COMPLETA + ESTUDIO
    if (
      ocupado.tipo === "casa_completa_estudio"
    ) {
      espaciosCasa.forEach((item) => {
        noDisponibles.add(item.id);
      });

      if (casaCompleta) {
        noDisponibles.add(casaCompleta.id);
      }

      if (estudio) {
        noDisponibles.add(estudio.id);
      }
    }
  });

  return noDisponibles;
}