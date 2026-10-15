/**
 * Meta Conversions API: replica en el servidor el evento `Contact` que el Pixel envía en el
 * navegador. Ambos comparten `event_id`, así Meta deduplica y cuenta una sola conversión.
 *
 * POST /api/capi  { eventId, cta, url }  → 204 (siempre; los errores solo se registran)
 *
 * Variables: PUBLIC_META_PIXEL_ID, META_CAPI_TOKEN, META_CAPI_TEST_EVENT_CODE (opcional).
 */
import type { Config, Context } from '@netlify/functions';

const GRAPH_API_VERSION = 'v24.0';
const CTA_IDS = new Set(['header', 'hero', 'plan', 'final', 'sticky']);
const EVENT_ID_PATTERN = /^[\w-]{8,64}$/;

interface ContactPayload {
  eventId: string;
  cta: string;
  url: string;
}

const noContent = () => new Response(null, { status: 204 });

function parsePayload(body: unknown, requestHost: string): ContactPayload | null {
  if (!body || typeof body !== 'object') return null;
  const { eventId, cta, url } = body as Record<string, unknown>;
  if (typeof eventId !== 'string' || !EVENT_ID_PATTERN.test(eventId)) return null;
  if (typeof cta !== 'string' || !CTA_IDS.has(cta)) return null;
  if (typeof url !== 'string') return null;
  try {
    // Solo se aceptan eventos de páginas de este mismo sitio.
    if (new URL(url).host !== requestHost) return null;
  } catch {
    return null;
  }
  return { eventId, cta, url };
}

/** `_fbc` lo crea el Pixel; si aún no existe, se arma desde el `fbclid` del anuncio. */
function clickId(cookie: string | undefined, pageUrl: string): string | undefined {
  if (cookie) return cookie;
  const fbclid = new URL(pageUrl).searchParams.get('fbclid');
  return fbclid ? `fb.1.${Date.now()}.${fbclid}` : undefined;
}

export default async (req: Request, context: Context) => {
  const pixelId = Netlify.env.get('PUBLIC_META_PIXEL_ID');
  const token = Netlify.env.get('META_CAPI_TOKEN');
  if (!pixelId || !token) return noContent();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }
  const payload = parsePayload(body, new URL(req.url).host);
  if (!payload) return new Response('Invalid payload', { status: 400 });

  const userData = Object.fromEntries(
    Object.entries({
      client_ip_address: context.ip,
      client_user_agent: req.headers.get('user-agent') ?? undefined,
      fbp: context.cookies.get('_fbp'),
      fbc: clickId(context.cookies.get('_fbc'), payload.url),
    }).filter(([, value]) => value),
  );

  const testEventCode = Netlify.env.get('META_CAPI_TEST_EVENT_CODE');
  const event = {
    data: [
      {
        event_name: 'Contact',
        event_time: Math.floor(Date.now() / 1000),
        event_id: payload.eventId,
        action_source: 'website',
        event_source_url: payload.url,
        user_data: userData,
        custom_data: { content_name: payload.cta },
      },
    ],
    ...(testEventCode ? { test_event_code: testEventCode } : {}),
  };

  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${pixelId}/events?access_token=${encodeURIComponent(token)}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(event),
      },
    );
    if (!res.ok) console.error(`[capi] Graph API ${res.status}: ${await res.text()}`);
  } catch (error) {
    console.error('[capi] request failed', error);
  }

  return noContent();
};

export const config: Config = {
  path: '/api/capi',
  method: 'POST',
};
