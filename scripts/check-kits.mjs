// Verifica que los 4 kits cumplan contraste WCAG AA (4.5:1) en los pares que usan las plantillas.
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("../src/data/kits.ts", import.meta.url), "utf8");
const kits = [...src.matchAll(/kit_id: "([^"]+)"[\s\S]*?palette: \{ background: "(#\w+)", surface: "(#\w+)", primary: "(#\w+)", accent: "(#\w+)" \}/g)];
const ch = (v) => ((s) => (s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4))(v / 255);
const lum = (h) => { const n = parseInt(h.slice(1), 16); return 0.2126 * ch((n >> 16) & 255) + 0.7152 * ch((n >> 8) & 255) + 0.0722 * ch(n & 255); };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

let failed = 0;
for (const [, id, bg, surface, primary, accent] of kits) {
  const on = (c) => (ratio(c, bg) >= ratio(c, primary) ? bg : primary);
  const pairs = { "tinta/fondo": [primary, bg], "tinta/superficie": [primary, surface], "acento/fondo": [accent, bg], "acento/superficie": [accent, surface], "texto/acento": [on(accent), accent], "texto/tinta": [on(primary), primary] };
  for (const [name, [a, b]] of Object.entries(pairs)) {
    const r = ratio(a, b);
    const ok = r >= 4.5;
    if (!ok) failed++;
    console.log(`${ok ? "OK  " : "FAIL"} ${id.padEnd(20)} ${name.padEnd(18)} ${r.toFixed(2)}`);
  }
}
if (kits.length !== 4) { console.error(`Se esperaban 4 kits, se leyeron ${kits.length}`); process.exit(1); }
process.exit(failed ? 1 : 0);
