# Concepto · Landing "Servicio Todo Incluido"

Landing de campaña para Meta Ads (tráfico mayormente móvil desde Instagram/Facebook).
Única conversión: clic a WhatsApp de Alain Landini.

- **Stack:** Astro 7 (salida estática) · TypeScript strict · CSS con scope por componente · sin
  framework de UI ni librerías de animación.
- **Diseño fuente de verdad:** `../concepto-landing-handoff/reference/index.html`.
- **Producción:** Netlify → `todoincluido.elconceptodigital.com`.

## Requisitos

- Node 22.12 o superior (`.nvmrc`)
- npm

## Comandos

| Comando              | Acción                                                                       |
| :------------------- | :--------------------------------------------------------------------------- |
| `npm install`        | Instala dependencias                                                         |
| `npm run dev`        | Servidor de desarrollo en `http://localhost:4321`                            |
| `npm run build`      | `astro check` + build de producción en `dist/`                               |
| `npm run preview`    | Sirve `dist/` localmente                                                     |
| `npm test`           | Pruebas de la función de Conversions API                                     |
| `npm run qa:compare` | Compara el build contra la referencia a 390/1440 px (requiere `build` antes) |
| `npm run og`         | Regenera `public/og-image.jpg`                                               |
| `npm run format`     | Formatea con Prettier                                                        |

## Estructura

```text
├── netlify/functions/capi.mts   Conversions API de Meta (POST /api/capi)
├── netlify.toml                 Build, cabeceras de seguridad y caché
├── public/                      favicon, og-image, robots.txt
├── qa/compare.mjs               QA visual contra la referencia (Playwright)
├── scripts/generate-og.mjs      Generador de la imagen social
├── tests/                       node:test
└── src/
    ├── assets/team/             Fotos del equipo (se optimizan a AVIF/WebP en el build)
    ├── data/
    │   ├── landing.json         ← todo el contenido editable
    │   ├── types.ts             Tipos del contenido
    │   └── index.ts
    ├── lib/
    │   ├── whatsapp.ts          Construye el enlace wa.me
    │   └── tracking.ts          Pixel + CAPI en cada CTA, utm_content → mensaje
    ├── styles/
    │   ├── tokens.css           Tokens de Framer (colores, radios, easing)
    │   └── global.css           Keyframes y estilos compartidos (.btn, .card, .rv, .dots…)
    ├── layouts/                 Base (head, SEO, Pixel) y Simple (páginas secundarias)
    ├── components/
    │   ├── ui/                  Button, Icon
    │   ├── seo/                 Seo (meta + JSON-LD), MetaPixel
    │   ├── plan/                PlanSection, PlanStage (animaciones), PlanCard
    │   └── Header, Hero, Stats, Services, ServiceCard, Team, TeamCard, Faq,
    │       FinalCta, Footer, StickyCta
    └── pages/                   index, privacidad, 404
```

Orden de la landing: Header → Hero + stats → Servicios → Equipo + cita → FAQ → Plan → CTA final
→ Footer → barra CTA fija (solo móvil). El precio solo aparece en la tarjeta del plan.

## Editar contenido

Todo vive en `src/data/landing.json`: WhatsApp, precio, stats, servicios, equipo, FAQ, ítems del
plan y mensajes de proveedores. Los tipos en `src/data/types.ts` avisan en el build si falta algo.

**Foto de un integrante:** copia el archivo a `src/assets/team/` (vertical, mismo fondo; idealmente
860×1024) y pon su nombre sin extensión en `photo`:

```json
{
  "name": "Romano Landini",
  "role": "Web & Automatizaciones",
  "area": "Liderazgo",
  "photo": "romano-landini"
}
```

Con `"photo": null` se muestran sus iniciales. Si el archivo no existe, el build falla con un
mensaje claro.

**Íconos de servicios:** el campo `icon` usa los nombres definidos en
`src/components/ui/Icon.astro`.

## Variables de entorno

Copia `.env.example` a `.env` en local. En Netlify: _Site configuration → Environment variables_.

| Variable                    | Uso                                                              |
| :-------------------------- | :--------------------------------------------------------------- |
| `PUBLIC_META_PIXEL_ID`      | ID del Pixel. Vacío = sin Pixel ni CAPI                          |
| `META_CAPI_TOKEN`           | Token de la API de Conversiones (secreto, solo en la función)    |
| `META_CAPI_TEST_EVENT_CODE` | Opcional: código de prueba del Events Manager. Quitar al validar |

## Medición

- `PageView` se encola al cargar. La librería del Pixel (~114 KB) se descarga en la primera
  interacción (scroll, toque, tecla) o a los 5 s; los eventos en cola se envían entonces. Así no
  compite con la primera pantalla (Lighthouse móvil con Pixel: ~65 cargándolo al `load`, 99 diferido).
  Contrapartida: no se registra el PageView de quien se va sin interactuar en menos de 5 s.
  El tiempo se ajusta en `fallbackMs` de `src/components/seo/MetaPixel.astro`.
- Cada clic en un `a[data-cta]` (`header`, `hero`, `plan`, `final`, `sticky`) envía `Contact` al
  Pixel y a `/api/capi` con el mismo `eventID`. Meta deduplica.
- Si la URL trae `utm_content`, se agrega al mensaje de WhatsApp como `[ref: …]`.

Para validar: define `META_CAPI_TEST_EVENT_CODE`, haz clic en un CTA y revisa _Events Manager →
Test events_. Ahí deben aparecer el evento del navegador y el del servidor, marcados como
deduplicados.

## Despliegue

1. **GitHub:** crea el repositorio y sube `main`:
   ```sh
   git remote add origin git@github.com:<usuario>/concepto-landing.git
   git push -u origin main
   ```
2. **Netlify:** _Add new site → Import an existing project_ → GitHub → el repo. `netlify.toml` ya
   define el comando (`npm run build`), la carpeta (`dist`) y la versión de Node. Carga las
   variables de entorno y despliega.
3. **Dominio en Netlify:** _Domain management → Add a domain_ →
   `todoincluido.elconceptodigital.com`.
4. **DNS en cPanel:** _Zone Editor_ → `elconceptodigital.com` → _Add Record_:
   - Tipo `CNAME` · Nombre `todoincluido` · Destino `<tu-sitio>.netlify.app`
5. Cuando el DNS propague, Netlify emite el certificado HTTPS (Let's Encrypt) automáticamente.

## Git

- `main` siempre desplegable. Trabajo en ramas `feat/…`, `fix/…`, `chore/…`, `docs/…`.
- Commits con [Conventional Commits](https://www.conventionalcommits.org/es/).
- Merge a `main` con `--no-ff` para conservar el historial de cada rama.

## Pendientes de contenido

- [ ] Logo SVG oficial (hoy es texto en Bebas Neue; al cambiarlo, quitar la fuente en
      `astro.config.mjs` y regenerar la imagen OG)
- [ ] Foto de Romano Landini
- [ ] 5 fotos de "proveedores" para las burbujas del plan (hoy son siluetas)
- [ ] Validar los precios de ejemplo de las burbujas
- [ ] Descripción de "Planificación estratégica" (provisional)
- [ ] Revisión legal de `/privacidad` (borrador)
- [ ] ID del Pixel y token de CAPI en Netlify
