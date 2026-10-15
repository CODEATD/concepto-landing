import { landing } from '@/data';

/** Enlace wa.me con el mensaje predefinido. `ref` se añade al final (p. ej. el `utm_content` del anuncio). */
export function buildWhatsAppUrl(ref?: string): string {
  const { number, message } = landing.whatsapp;
  const text = ref ? `${message} [ref: ${ref}]` : message;
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}
