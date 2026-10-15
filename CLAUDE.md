# Concepto · Landing "Servicio Todo Incluido"

Landing de campaña (Meta Ads, tráfico móvil). Única conversión: clic a WhatsApp de Alain.
Ver también `AGENTS.md` (comandos de Astro).

## Fuente de verdad del diseño

`../concepto-landing-handoff/reference/index.html` → réplica aprobada. Valores, tiempos y keyframes
se copian tal cual; los colores se expresan con las variables de `src/styles/tokens.css`.

## Convenciones

- Astro estático, sin framework de UI ni Tailwind ni librerías de animación (CSS `@keyframes`).
- Estilos con scope en cada componente; lo compartido vive en `src/styles/global.css`.
- Contenido en `src/data/landing.json` (tipado en `src/data/types.ts`). Los componentes recorren datos.
- JS de cliente mínimo, en `<script>` TS dentro del componente que lo usa o en `src/lib/`.
- Imágenes en `src/assets/` vía `astro:assets`, siempre con `alt`, `width` y `height`.
- Todo CTA de WhatsApp usa `<Button cta="…">`, que añade `data-cta` para medición.
- Git: ramas `feat/…`, `fix/…`, `chore/…` desde `main`; Conventional Commits; merge `--no-ff`.

## Breakpoints

`≤760px` móvil · `≤1100px` escena del plan en secuencia móvil · `>1100px` escena con cursor.
