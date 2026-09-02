import { resend } from "./resend";

interface ConfirmacionReservaProps {
  correo: string;
  nombre: string;
  codigoReserva: string;
  alojamiento: string;
  fechaInicio: string;
  fechaFin: string;
  cantidadHuespedes: number;
  incluyeDesayuno: boolean;
  total: number;
  estado: string;
}

export async function enviarConfirmacionReserva({
  correo,
  nombre,
  codigoReserva,
  alojamiento,
  fechaInicio,
  fechaFin,
  cantidadHuespedes,
  incluyeDesayuno,
  total,
  estado,
}: ConfirmacionReservaProps) {
  const { data, error } = await resend.emails.send({
    from: "Mowgli's Platz <onboarding@resend.dev>",
    to: correo,
    subject: `Reservación recibida - ${codigoReserva}`,

    html: `
      <div style="font-family: Arial, sans-serif; color: #19382d;">
        <h1>¡Gracias por reservar con Mowgli's Platz!</h1>

        <p>Hola ${nombre},</p>

        <p>
          Hemos recibido correctamente tu solicitud de reservación.
        </p>

        <h2>Detalles de la reserva</h2>

        <p><strong>Código:</strong> ${codigoReserva}</p>
        <p><strong>Alojamiento:</strong> ${alojamiento}</p>
        <p><strong>Check-in:</strong> ${fechaInicio}</p>
        <p><strong>Check-out:</strong> ${fechaFin}</p>
        <p><strong>Huéspedes:</strong> ${cantidadHuespedes}</p>
        <p>
          <strong>Desayuno:</strong>
          ${incluyeDesayuno ? "Incluido" : "No incluido"}
        </p>

        <p>
          <strong>Total:</strong>
          ₡${total.toLocaleString("es-CR")}
        </p>

        <p>
          <strong>Estado:</strong> ${estado}
        </p>

        <p>
          Conserva el código <strong>${codigoReserva}</strong>
          como referencia de tu reservación.
        </p>

        <p>Gracias,<br />Mowgli's Platz</p>
      </div>
    `,
  });
  if (error) {
  throw new Error(
    `No se pudo enviar la confirmación: ${error.message}`
  );
}

return data;
}