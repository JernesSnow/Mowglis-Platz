"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  motion,
  type PanInfo,
  useMotionValue,
} from "motion/react";

interface Imagen {
  id: number;
  url: string;
  alt_text: string | null;
  orden: number | null;
  es_principal: boolean | null;
}

interface Props {
  imagenes: Imagen[];
  nombreAlojamiento: string;
  descripcion: string | null;
}

const GAP = 0;
const VELOCITY_THRESHOLD = 500;

const SPRING_OPTIONS = {
  type: "spring" as const,
  stiffness: 300,
  damping: 30,
};

export default function GaleriaAlojamiento({
  imagenes,
  nombreAlojamiento,
  descripcion,
}: Props) {
  const containerRef =
    useRef<HTMLDivElement>(null);

  const [
    containerWidth,
    setContainerWidth,
  ] = useState(0);

  /*
   * Ordenamos las fotografías según el orden
   * configurado desde administración.
   *
   * La fotografía principal se coloca primero
   * para que sea la primera que ve el usuario.
   */
  const imagenesOrdenadas = useMemo(() => {
    const ordenadas = [...imagenes].sort(
      (a, b) =>
        Number(a.orden ?? 0) -
        Number(b.orden ?? 0)
    );

    const principal = ordenadas.find(
      (imagen) =>
        imagen.es_principal
    );

    if (!principal) {
      return ordenadas;
    }

    return [
      principal,
      ...ordenadas.filter(
        (imagen) =>
          imagen.id !== principal.id
      ),
    ];
  }, [imagenes]);

  /*
   * Para crear un loop visual sin saltos,
   * agregamos una copia de la última imagen
   * al inicio y una copia de la primera al final.
   */
  const imagenesRender = useMemo(() => {
    if (
      imagenesOrdenadas.length <= 1
    ) {
      return imagenesOrdenadas;
    }

    return [
      imagenesOrdenadas[
        imagenesOrdenadas.length - 1
      ],
      ...imagenesOrdenadas,
      imagenesOrdenadas[0],
    ];
  }, [imagenesOrdenadas]);

  const tieneLoop =
    imagenesOrdenadas.length > 1;

  const [
    posicion,
    setPosicion,
  ] = useState(
    tieneLoop ? 1 : 0
  );

  const [
    saltando,
    setSaltando,
  ] = useState(false);

  const [
    animando,
    setAnimando,
  ] = useState(false);

  const x = useMotionValue(0);

const [
  arrastrando,
  setArrastrando,
] = useState(false);

const [
  hover,
  setHover,
] = useState(false);

const [
  tocando,
  setTocando,
] = useState(false);


  /*
   * Observamos el ancho real del carrusel para
   * hacerlo responsive sin usar un ancho fijo.
   */
  useEffect(() => {
    const container =
      containerRef.current;

    if (!container) {
      return;
    }

    const observer =
      new ResizeObserver(
        ([entry]) => {
          setContainerWidth(
            entry.contentRect.width
          );
        }
      );

    observer.observe(container);

    return () =>
      observer.disconnect();
  }, []);

  /*
   * Cuando cambia el conjunto de imágenes,
   * volvemos a iniciar en la principal.
 */

  const slideWidth =
    Math.max(
      containerWidth,
      1
    );

  const trackOffset =
    slideWidth + GAP;

    useEffect(() => {
  if (containerWidth <= 0) {
    return;
  }

  const posicionInicial =
    tieneLoop ? 1 : 0;

  setPosicion(posicionInicial);

  x.set(
    -posicionInicial *
      trackOffset
  );
}, [
  imagenesOrdenadas.length,
  tieneLoop,
  trackOffset,
  containerWidth,
  x,
]);

  const activeIndex =
    imagenesOrdenadas.length === 0
      ? 0
      : tieneLoop
        ? (
            posicion -
            1 +
            imagenesOrdenadas.length
          ) %
          imagenesOrdenadas.length
        : posicion;

  function siguiente() {
    if (
      animando ||
      imagenesRender.length <= 1
    ) {
      return;
    }

    setPosicion(
      (actual) =>
        Math.min(
          actual + 1,
          imagenesRender.length - 1
        )
    );
  }

  function anterior() {
    if (
      animando ||
      imagenesRender.length <= 1
    ) {
      return;
    }

    setPosicion(
      (actual) =>
        Math.max(
          actual - 1,
          0
        )
    );
  }

  function irAImagen(
    index: number
  ) {
    if (animando) {
      return;
    }

    setPosicion(
      tieneLoop
        ? index + 1
        : index
    );
  }

  function manejarDragEnd(
    _: MouseEvent |
      TouchEvent |
      PointerEvent,
    info: PanInfo
  ) {
    const {
      offset,
      velocity,
    } = info;

    if (
      offset.x < -50 ||
      velocity.x <
        -VELOCITY_THRESHOLD
    ) {
      siguiente();
      return;
    }

    if (
      offset.x > 50 ||
      velocity.x >
        VELOCITY_THRESHOLD
    ) {
      anterior();
    }
  }

  function terminarAnimacion() {
    if (
      !tieneLoop ||
      imagenesRender.length <= 1
    ) {
      setAnimando(false);
      return;
    }

    const ultimoClon =
      imagenesRender.length - 1;

    /*
     * Si llegamos al clon final,
     * saltamos sin animación a la primera
     * imagen real.
     */
    if (posicion === ultimoClon) {
    setSaltando(true);

    const destino = 1;

    setPosicion(destino);

    x.set(
        -destino *
        trackOffset
    );

    requestAnimationFrame(() => {
        setSaltando(false);
        setAnimando(false);
    });

    return;
    }

    /*
     * Si llegamos al clon inicial,
     * saltamos sin animación a la última
     * imagen real.
     */
    if (posicion === 0) {
        setSaltando(true);

        const destino =
            imagenesOrdenadas.length;

        setPosicion(destino);

        x.set(
            -destino *
            trackOffset
        );

        requestAnimationFrame(() => {
            setSaltando(false);
            setAnimando(false);
        });

        return;
        }

    setAnimando(false);
  }

  /*
   * También permitimos usar las flechas
   * izquierda y derecha del teclado.
   */
  useEffect(() => {
    function teclado(
      event: KeyboardEvent
    ) {
      if (
        event.key ===
        "ArrowLeft"
      ) {
        anterior();
      }

      if (
        event.key ===
        "ArrowRight"
      ) {
        siguiente();
      }
    }

    window.addEventListener(
      "keydown",
      teclado
    );

    return () =>
      window.removeEventListener(
        "keydown",
        teclado
      );
  });

  useEffect(() => {
  if (
    !tieneLoop ||
    arrastrando ||
    hover ||
    animando
  ) {
    return;
  }

  const timer =
    window.setTimeout(() => {
      setPosicion((actual) =>
        Math.min(
          actual + 1,
          imagenesRender.length - 1
        )
      );
    }, 4500);

  return () => {
    window.clearTimeout(timer);
  };
}, [
  posicion,
  tieneLoop,
  arrastrando,
  hover,
  animando,
  imagenesRender.length,
]);

  return (
    <>
      {/* CARRUSEL */}

      {imagenesOrdenadas.length >
      0 ? (
        <div className="relative w-full min-w-0">
          <div
            ref={containerRef}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            onTouchStart={() => setTocando(true)}
            onTouchEnd={() => setTocando(false)}
            onTouchCancel={() => setTocando(false)}
            className="w-full min-w-0 overflow-hidden rounded-[2.5rem] bg-[var(--green-dark)]/10 shadow-sm"
          >
            {containerWidth > 0 && (
              <motion.div
                className="flex"
                drag={
                    animando
                    ? false
                    : "x"
                }
                dragElastic={0.08}
                style={{
                    gap: `${GAP}px`,
                    x,
                }}
                onDragStart={() =>
                    setArrastrando(true)
                }
                animate={{
                  x:
                    -posicion *
                    trackOffset,
                }}
                transition={
                  saltando
                    ? {
                        duration: 0,
                      }
                    : SPRING_OPTIONS
                }
                onDragEnd={(event, info) => {
                setArrastrando(false);

                manejarDragEnd(
                    event,
                    info
                );
                }}
                onAnimationStart={() =>
                  setAnimando(true)
                }
                onAnimationComplete={
                  terminarAnimacion
                }
              >
                {imagenesRender.map(
                  (
                    imagen,
                    index
                  ) => (
                    <motion.div
                      key={`${imagen.id}-${index}`}
                      className="relative shrink-0 cursor-grab overflow-hidden active:cursor-grabbing"
                      style={{
                        width:
                          slideWidth,
                      }}
                    >
                      <div className="aspect-[16/10]">
                        <img
                          src={
                            imagen.url
                          }
                          alt={
                            imagen.alt_text ??
                            nombreAlojamiento
                          }
                          draggable={
                            false
                          }
                          className="h-full w-full select-none object-cover"
                        />
                      </div>

                      {/* SOMBRA INFERIOR */}

                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/50 to-transparent" />

                      {/* TEXTO */}

                      {imagen.alt_text && (
                        <div className="pointer-events-none absolute bottom-6 left-7 right-7">
                          <p className="text-sm font-medium text-white drop-shadow">
                            {
                              imagen.alt_text
                            }
                          </p>
                        </div>
                      )}
                    </motion.div>
                  )
                )}
              </motion.div>
            )}
          </div>

          {/* FLECHA IZQUIERDA */}

          {imagenesOrdenadas.length >
            1 && (
            <button
              type="button"
              onClick={anterior}
              className="absolute left-4 top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-3xl text-[var(--green-dark)] shadow-md transition hover:scale-105 hover:bg-white sm:flex"
              aria-label="Fotografía anterior"
            >
              ‹
            </button>
          )}

          {/* FLECHA DERECHA */}

          {imagenesOrdenadas.length >
            1 && (
            <button
              type="button"
              onClick={siguiente}
              className="absolute right-4 top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-3xl text-[var(--green-dark)] shadow-md transition hover:scale-105 hover:bg-white sm:flex"
              aria-label="Siguiente fotografía"
            >
              ›
            </button>
          )}

          {/* CONTADOR */}

          {imagenesOrdenadas.length >
            1 && (
            <div className="absolute right-5 top-5 rounded-full bg-black/50 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
              {activeIndex + 1} /{" "}
              {
                imagenesOrdenadas.length
              }
            </div>
          )}
        </div>
      ) : (
        <div className="flex aspect-[16/10] items-center justify-center rounded-[2.5rem] bg-[var(--green-dark)]/10 px-8 text-center text-[var(--green-dark)]/50">
          Fotografía de{" "}
          {nombreAlojamiento}
        </div>
      )}

      {/* INDICADORES */}

      {imagenesOrdenadas.length >
        1 && (
        <div className="mt-5 flex items-center justify-center gap-2">
          {imagenesOrdenadas.map(
            (imagen, index) => (
              <button
                key={imagen.id}
                type="button"
                aria-label={`Ver fotografía ${
                  index + 1
                }`}
                aria-current={
                  activeIndex === index
                }
                onClick={() =>
                  irAImagen(index)
                }
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  activeIndex ===
                  index
                    ? "w-8 bg-[var(--green-dark)]"
                    : "w-2.5 bg-[var(--green-dark)]/25 hover:bg-[var(--green-dark)]/50"
                }`}
              />
            )
          )}
        </div>
      )}

      {/* DESCRIPCIÓN */}

      <div className="mt-10">
        <h2 className="text-3xl font-bold text-[var(--green-dark)]">
          Sobre este alojamiento
        </h2>

        <p className="mt-5 max-w-3xl text-lg leading-8 text-[var(--green-dark)]/70">
          {descripcion ||
            "La descripción de este alojamiento estará disponible próximamente."}
        </p>
      </div>
    </>
  );
}