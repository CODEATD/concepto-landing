// Genera public/og-image.jpg (1200×630) para compartir en redes.
// PROVISIONAL: regenerar cuando llegue el logo SVG oficial. Uso: `npm run og`
import sharp from 'sharp';

const W = 1200;
const H = 630;

let dots = '';
for (let y = 7; y < H; y += 14) {
  for (let x = 7; x < W; x += 14) dots += `<circle cx="${x}" cy="${y}" r="1"/>`;
}

const sans = 'Inter, Segoe UI, Arial, sans-serif';

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <radialGradient id="glow" cx="85%" cy="10%" r="45%">
      <stop offset="0" stop-color="#FAD91A" stop-opacity=".18"/>
      <stop offset="1" stop-color="#FAD91A" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="fade" cx="75%" cy="30%" r="60%">
      <stop offset=".15" stop-color="#fff"/><stop offset="1" stop-color="#000"/>
    </radialGradient>
    <mask id="dots-mask"><rect width="${W}" height="${H}" fill="url(#fade)"/></mask>
    <linearGradient id="silver" x1="0" y1="0" x2="0" y2="1">
      <stop offset=".15" stop-color="#fff"/><stop offset="1" stop-color="#9C9C9C"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="#000"/>
  <g fill="#fff" fill-opacity=".14" mask="url(#dots-mask)">${dots}</g>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <text x="80" y="120" font-family="Bebas Neue, Impact, sans-serif" font-size="56" fill="#FAD91A">CONCEPTO</text>
  <rect x="80" y="180" width="330" height="44" rx="22" fill="#0E0E0E" stroke="#2F2F2F"/>
  <circle cx="106" cy="202" r="5" fill="#FAD91A"/>
  <text x="122" y="208" font-family="${sans}" font-size="17" font-weight="600" letter-spacing="2" fill="#EEEEEE">SERVICIO TODO INCLUIDO</text>
  <text font-family="${sans}" font-size="76" font-weight="600" letter-spacing="-2" fill="#fff">
    <tspan x="80" y="330">Tu equipo de <tspan font-family="Playfair Display, Georgia, serif" font-style="italic" font-weight="400" fill="url(#silver)">Marketing</tspan></tspan>
    <tspan x="80" y="420">completo a un precio</tspan>
    <tspan x="80" y="510" fill="#FAD91A">irresistible.</tspan>
  </text>
</svg>`;

const info = await sharp(Buffer.from(svg))
  .jpeg({ quality: 86, mozjpeg: true })
  .toFile('public/og-image.jpg');
console.log(`og-image.jpg ${info.width}×${info.height} · ${(info.size / 1024).toFixed(1)} KB`);
