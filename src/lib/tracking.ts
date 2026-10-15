/**
 * Medición de los CTA de WhatsApp (cliente).
 * - Añade el `utm_content` del anuncio al mensaje de WhatsApp: "… [ref: {utm_content}]".
 * - En cada clic de un `a[data-cta]` envía `Contact` al Pixel y a la Conversions API con el mismo
 *   `eventID`, para que Meta deduplique.
 */

type Fbq = (...args: unknown[]) => void;

declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

const CAPI_ENDPOINT = '/api/capi';
const CTA_SELECTOR = 'a[data-cta]';

function newEventId(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

/** Agrega la referencia del anuncio al texto predefinido de todos los enlaces de WhatsApp. */
export function appendAdReference(search = location.search): void {
  const ref = new URLSearchParams(search).get('utm_content')?.trim().slice(0, 100);
  if (!ref) return;

  for (const link of document.querySelectorAll<HTMLAnchorElement>(CTA_SELECTOR)) {
    const url = new URL(link.href);
    const text = url.searchParams.get('text');
    if (url.hostname !== 'wa.me' || !text) continue;
    // encodeURIComponent (y no URLSearchParams) para mantener %20 en vez de "+".
    link.href = `${url.origin}${url.pathname}?text=${encodeURIComponent(`${text} [ref: ${ref}]`)}`;
  }
}

function sendToCapi(eventId: string, cta: string): void {
  const body = JSON.stringify({ eventId, cta, url: location.href });
  // sendBeacon sobrevive a la navegación hacia wa.me (también en el navegador interno de Instagram).
  const queued = navigator.sendBeacon?.(
    CAPI_ENDPOINT,
    new Blob([body], { type: 'application/json' }),
  );
  if (!queued) {
    fetch(CAPI_ENDPOINT, {
      method: 'POST',
      body,
      keepalive: true,
      headers: { 'content-type': 'application/json' },
    }).catch(() => {});
  }
}

export function trackContact(cta: string): void {
  // Sin Pixel configurado no se mide nada (desarrollo local, previews sin variables).
  if (!window.fbq) return;
  const eventId = newEventId();
  window.fbq('track', 'Contact', { content_name: cta }, { eventID: eventId });
  sendToCapi(eventId, cta);
}

export function initTracking(): void {
  appendAdReference();
  document.addEventListener('click', (event) => {
    const link = (event.target as Element | null)?.closest<HTMLAnchorElement>(CTA_SELECTOR);
    if (link?.dataset.cta) trackContact(link.dataset.cta);
  });
}
