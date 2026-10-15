# Guía para la campaña en Meta

Para el equipo que monta y optimiza los anuncios de "Servicio Todo Incluido".

## Qué es la landing

Una página única en `https://allinone.elconceptodigital.com`, pensada para tráfico móvil desde
Instagram y Facebook. Tiene **una sola conversión: abrir el WhatsApp de Alain** con un mensaje ya
escrito. Hay cinco botones que llevan ahí (menú, hero, plan, CTA final y barra fija en móvil) y
todos se miden.

Recorrido: promesa y cifras → servicios → equipo → preguntas frecuentes → plan con precio → CTA
final.

## Qué se mide (ya está programado)

| Evento     | Cuándo                              | Dónde llega                                              |
| :--------- | :---------------------------------- | :------------------------------------------------------- |
| `PageView` | Al entrar a la página               | Pixel                                                    |
| `Contact`  | Clic en cualquier botón de WhatsApp | Pixel **y** API de Conversiones (servidor), deduplicados |

Cada `Contact` lleva `content_name` con el botón que se pulsó (`header`, `hero`, `plan`, `final`,
`sticky`), para saber qué sección convierte más.

La API de Conversiones envía el mismo evento desde el servidor. Así se recuperan conversiones que el
navegador pierde (bloqueadores, iOS, navegador interno de Instagram), y Meta recibe más señal para
optimizar.

## Lo que necesitamos del equipo de Meta

No hace falta que nos pasen ningún script: el código del Pixel ya está en la página, con el ID
`1696345478770441`. Solo falta un dato del **Events Manager** para la API de Conversiones:

- **Token de acceso de la API de Conversiones**: _Events Manager → el Pixel → Configuración →
  API de Conversiones → Generar token de acceso_.

Con el token lo cargamos en Netlify (`META_CAPI_TOKEN`, y también `PUBLIC_META_PIXEL_ID`, porque la
función del servidor lo lee desde ahí) y volvemos a publicar. Sin el token el Pixel mide igual
desde el navegador; lo que no se envía es el evento del servidor.

**Verificar el dominio** (recomendado): en _Business Settings → Seguridad de la marca → Dominios_
agreguen `elconceptodigital.com` y elijan verificación por **registro TXT de DNS**. Nos pasan el
valor y lo añadimos en cPanel. Se verifica el dominio principal y eso cubre el subdominio.

## Cómo configurar los anuncios

- **Objetivo:** Clientes potenciales, con ubicación de conversión **Sitio web** y evento
  **Contact**. Meta optimiza mejor a partir de ~50 conversiones por semana por conjunto de anuncios;
  con poco presupuesto, mejor pocos conjuntos que muchos.
- **URL del sitio:** `https://allinone.elconceptodigital.com`
- **Parámetros de URL** (campo _Parámetros de URL_ del anuncio):

  ```text
  utm_source=meta&utm_medium=paid&utm_campaign={{campaign.name}}&utm_content={{ad.name}}
  ```

  `utm_content` tiene un uso extra: el nombre del anuncio se agrega al mensaje de WhatsApp como
  `[ref: Nombre del anuncio]`. Así Alain ve en el chat qué anuncio trajo a cada persona. Conviene
  ponerles a los anuncios nombres cortos y claros (por ejemplo `reel-equipo-v2`).

- **Optimización:** comparar anuncios por costo por `Contact`, no por clics. El desglose por
  `content_name` dice si la gente convierte arriba (hero) o después de ver el precio (plan / final).

## Antes de lanzar (checklist)

- [ ] Token de CAPI y `PUBLIC_META_PIXEL_ID` cargados en Netlify y sitio publicado de nuevo
- [ ] Prueba con _Events Manager → Eventos de prueba_: entrar a la página, pulsar un botón y ver
      `PageView` y `Contact` (navegador + servidor, marcados como deduplicados)
- [ ] Quitar `META_CAPI_TEST_EVENT_CODE` de Netlify al terminar la prueba
- [ ] Dominio verificado en Business Settings
- [ ] Abrir el enlace desde Instagram en un teléfono: carga, botones y WhatsApp funcionan
- [ ] Logo oficial y textos finales aprobados (ver "Pendientes de contenido" en el README)

## SEO y `robots.txt`

`robots.txt` permite a todos los buscadores indexar la landing y apunta al sitemap. La política de
privacidad y la página 404 llevan `noindex`. No hay nada que cambiar para la campaña: los anuncios
no dependen de Google, y el rastreador de Meta (que genera la vista previa del enlace) tiene acceso.
