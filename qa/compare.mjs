// QA visual: compara el build (astro preview) contra la referencia aprobada del handoff.
// Uso: `npm run build && npm run qa:compare` → capturas y diffs en qa/output/.
//
// Para que ambas páginas sean comparables se congelan todas las animaciones en el mismo instante:
// - animaciones por tiempo: pausadas en `t` ms (por defecto, la escena del plan a mitad del ciclo)
// - animaciones por scroll (.rv): canceladas → estado final visible
import { chromium } from 'playwright';
import { spawn, spawnSync } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const root = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(root, 'output');
const referenceUrl = pathToFileURL(
  path.resolve(root, '../../concepto-landing-handoff/reference/index.html'),
).href;
const buildUrl = 'http://localhost:4321/';

const viewports = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'desktop', width: 1440, height: 900 },
];
// Instantes a capturar en la sección del plan (ms dentro del ciclo de 16s / secuencia móvil).
const planMoments = { desktop: [4000, 6000, 12000], mobile: [300, 1500, 4500] };

async function freeze(page, t) {
  await page.evaluate((t) => {
    document.querySelector('[data-plan-stage], #plan-stage')?.classList.add('play');
    for (const a of document.getAnimations()) {
      if (a.timeline instanceof DocumentTimeline) {
        a.pause();
        a.currentTime = t;
      } else {
        a.cancel();
      }
    }
  }, t);
}

async function settle(page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    // Fuerza la carga de imágenes lazy recorriendo la página.
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 40));
    }
    window.scrollTo(0, 0);
    await Promise.all(
      [...document.images].map((img) =>
        img.complete
          ? null
          : new Promise((r) => {
              img.addEventListener('load', r, { once: true });
              img.addEventListener('error', r, { once: true });
              setTimeout(r, 5000);
            }),
      ),
    );
  });
}

async function diff(a, b, file) {
  const [ia, ib] = await Promise.all([sharp(a).metadata(), sharp(b).metadata()]);
  const width = Math.min(ia.width, ib.width);
  const height = Math.min(ia.height, ib.height);
  const raw = (f) =>
    sharp(f).extract({ left: 0, top: 0, width, height }).ensureAlpha().raw().toBuffer();
  const [ra, rb] = await Promise.all([raw(a), raw(b)]);
  const mask = Buffer.alloc(width * height * 4);
  let changed = 0;
  for (let i = 0; i < ra.length; i += 4) {
    const d =
      Math.abs(ra[i] - rb[i]) + Math.abs(ra[i + 1] - rb[i + 1]) + Math.abs(ra[i + 2] - rb[i + 2]);
    const hit = d > 48;
    if (hit) changed++;
    mask[i] = hit ? 255 : ra[i] * 0.25;
    mask[i + 1] = hit ? 0 : ra[i + 1] * 0.25;
    mask[i + 2] = hit ? 64 : ra[i + 2] * 0.25;
    mask[i + 3] = 255;
  }
  await sharp(mask, { raw: { width, height, channels: 4 } })
    .png()
    .toFile(file);
  return {
    size: `${ia.width}×${ia.height} vs ${ib.width}×${ib.height}`,
    changed: ((changed / (width * height)) * 100).toFixed(2) + '%',
  };
}

async function sideBySide(a, b, file) {
  const [ia, ib] = await Promise.all([sharp(a).metadata(), sharp(b).metadata()]);
  const gap = 16;
  await sharp({
    create: {
      width: ia.width + ib.width + gap,
      height: Math.max(ia.height, ib.height),
      channels: 3,
      background: '#ff00ff',
    },
  })
    .composite([
      { input: a, left: 0, top: 0 },
      { input: b, left: ia.width + gap, top: 0 },
    ])
    .png()
    .toFile(file);
}

async function main() {
  await mkdir(out, { recursive: true });
  const server = spawn('npx astro preview --port 4321', { shell: true });
  await new Promise((resolve) => {
    server.stdout.on('data', (d) => String(d).includes('4321') && resolve());
  });

  const browser = await chromium.launch();
  const report = [];
  try {
    for (const vp of viewports) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 1,
      });
      const shots = {};
      for (const [label, url] of [
        ['reference', referenceUrl],
        ['build', buildUrl],
      ]) {
        const page = await context.newPage();
        await page.goto(url, { waitUntil: 'networkidle' });
        await settle(page);
        await freeze(page, 0);
        const full = path.join(out, `${vp.name}-${label}-full.png`);
        await page.screenshot({ path: full, fullPage: true });
        shots[label] = { full, plan: [] };
        // La captura extendida de `locator.screenshot` pierde las animaciones pausadas:
        // se agranda el viewport y se recorta la sección visible.
        await page.setViewportSize({ width: vp.width, height: 1200 });
        await page.evaluate(() => document.querySelector('#plan').scrollIntoView());
        for (const t of planMoments[vp.name]) {
          await freeze(page, t);
          const file = path.join(out, `${vp.name}-${label}-plan-${t}.png`);
          const box = await page.locator('#plan').boundingBox();
          await page.screenshot({ path: file, clip: box });
          shots[label].plan.push({ t, file });
        }
        await page.close();
      }
      await sideBySide(
        shots.reference.full,
        shots.build.full,
        path.join(out, `${vp.name}-side.png`),
      );
      report.push({
        view: `${vp.name} full`,
        ...(await diff(
          shots.reference.full,
          shots.build.full,
          path.join(out, `${vp.name}-diff.png`),
        )),
      });
      for (let i = 0; i < shots.build.plan.length; i++) {
        const t = shots.build.plan[i].t;
        const ref = shots.reference.plan[i].file;
        const bld = shots.build.plan[i].file;
        await sideBySide(ref, bld, path.join(out, `${vp.name}-plan-${t}-side.png`));
        report.push({
          view: `${vp.name} plan @${t}ms`,
          ...(await diff(ref, bld, path.join(out, `${vp.name}-plan-${t}-diff.png`))),
        });
      }
      await context.close();
    }
  } finally {
    await browser.close();
    // En Windows `kill()` no alcanza al proceso hijo de `npx`: se cierra el árbol completo.
    if (process.platform === 'win32') {
      spawnSync('taskkill', ['/pid', String(server.pid), '/f', '/t']);
    } else {
      server.kill();
    }
  }
  console.table(report);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
