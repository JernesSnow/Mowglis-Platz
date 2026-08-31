import { resend } from "./resend";

interface AvisoAdministradorProps {
  nombreCliente: string;
  correoCliente: string;
  telefono: string | null;
  codigoReserva: string;
  alojamiento: string;
  fechaInicio: string;
  fechaFin: string;
  cantidadHuespedes: number;
  incluyeDesayuno: boolean;
  total: number;
}

export async function enviarAvisoAdministrador({
  nombreCliente,
  correoCliente,
  telefono,
  codigoReserva,
  alojamiento,
  fechaInicio,
  fechaFin,
  cantidadHuespedes,
  incluyeDesayuno,
  total,
}: AvisoAdministradorProps) {
  const adminEmail = process.env.RESERVAS_ADMIN_EMAIL;

  if (!adminEmail) {
    throw new Error(
      "Falta RESERVAS_ADMIN_EMAIL en las variables de entorno."
    );
  }

  const { data, error } = await resend.emails.send({

    from: "Mowgli's Platz <onboarding@resend.dev>",
    to: adminEmail,
    subject: `Nueva reservación - ${codigoReserva}`,

    html: `
      <div style="font-family: Arial, sans-serif; color: #19382d;">
        <h1>Nueva reservación</h1>

        <h2>Cliente</h2>

        <p><strong>Nombre:</strong> ${nombreCliente}</p>
        <p><strong>Correo:</strong> ${correoCliente}</p>
        <p>
          <strong>Teléfono:</strong>
          ${telefono || "No proporcionado"}
        </p>

        <h2>Reserva</h2>

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

        <p><strong>Estado:</strong> Pendiente</p>
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