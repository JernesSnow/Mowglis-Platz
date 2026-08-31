import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;

if (!apiKey) {
  throw new Error("Falta RESEND_API_KEY en las variables de entorno.");
}

export const resend = new Resend(apiKey);