import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mowgli's Platz | Puerto Viejo",
  description:
    "Hospedaje en Playa Negra, Puerto Viejo, rodeado de naturaleza y a pocos metros de la playa.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}