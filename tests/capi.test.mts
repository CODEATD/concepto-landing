// Pruebas de la Netlify Function de Conversions API. Ejecutar con `npm test`.
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import handler from '../netlify/functions/capi.mts';

const env = new Map<string, string>();
let calls: { url: string; body: any }[] = [];

(globalThis as any).Netlify = { env: { get: (key: string) => env.get(key) } };
globalThis.fetch = (async (url: string, init: RequestInit) => {
  calls.push({ url, body: JSON.parse(String(init.body)) });
  return new Response('{}', { status: 200 });
}) as typeof fetch;

const SITE = 'https://todoincluido.elconceptodigital.com';

function request(body: unknown) {
  return new Request(`${SITE}/api/capi`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'user-agent': 'test-agent' },
    body: JSON.stringify(body),
  });
}

function context(cookies: Record<string, string> = {}) {
  return { ip: '203.0.113.7', cookies: { get: (name: string) => cookies[name] } } as any;
}

const valid = { eventId: 'abc12345-ef', cta: 'hero', url: `${SITE}/?utm_content=ad1` };

beforeEach(() => {
  calls = [];
  env.clear();
  env.set('PUBLIC_META_PIXEL_ID', '123');
  env.set('META_CAPI_TOKEN', 'secret');
});

test('envía Contact con el mismo event_id y los datos del navegador', async () => {
  const res = await handler(request(valid), context({ _fbp: 'fb.1.1.2', _fbc: 'fb.1.1.click' }));
  assert.equal(res.status, 204);
  assert.equal(calls.length, 1);
  assert.match(calls[0].url, /graph\.facebook\.com\/v\d+\.0\/123\/events\?access_token=secret$/);
  const [event] = calls[0].body.data;
  assert.equal(event.event_name, 'Contact');
  assert.equal(event.event_id, valid.eventId);
  assert.equal(event.action_source, 'website');
  assert.equal(event.event_source_url, valid.url);
  assert.deepEqual(event.custom_data, { content_name: 'hero' });
  assert.deepEqual(event.user_data, {
    client_ip_address: '203.0.113.7',
    client_user_agent: 'test-agent',
    fbp: 'fb.1.1.2',
    fbc: 'fb.1.1.click',
  });
});

test('arma fbc desde fbclid cuando no hay cookie', async () => {
  await handler(request({ ...valid, url: `${SITE}/?fbclid=XYZ` }), context());
  assert.match(calls[0].body.data[0].user_data.fbc, /^fb\.1\.\d+\.XYZ$/);
});

test('incluye test_event_code si está configurado', async () => {
  env.set('META_CAPI_TEST_EVENT_CODE', 'TEST42');
  await handler(request(valid), context());
  assert.equal(calls[0].body.test_event_code, 'TEST42');
});

test('rechaza payloads inválidos o de otro dominio', async () => {
  for (const body of [
    { ...valid, cta: 'otro' },
    { ...valid, eventId: 'x' },
    { ...valid, url: 'https://evil.example/' },
    { ...valid, url: 'no-es-url' },
  ]) {
    const res = await handler(request(body), context());
    assert.equal(res.status, 400);
  }
  assert.equal(calls.length, 0);
});

test('no hace nada sin credenciales', async () => {
  env.clear();
  const res = await handler(request(valid), context());
  assert.equal(res.status, 204);
  assert.equal(calls.length, 0);
});
