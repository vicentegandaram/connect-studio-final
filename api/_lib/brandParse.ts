/** Lógica pura del análisis de marca desde una web (sin red): se prueba en evals/ y se usa en api/brand.ts. */

export interface SiteInfo {
  name: string;
  description: string;
  themeColor: string | null;
  colors: string[];
  keywords: string[];
  approach: string | null;
  population: string | null;
}

const decode = (s: string): string =>
  s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&nbsp;/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim();

const meta = (html: string, key: string): string => {
  const re = new RegExp(`<meta[^>]+(?:name|property)=["']${key}["'][^>]*>`, "i");
  const tag = html.match(re)?.[0] ?? "";
  return decode(tag.match(/content=["']([^"']*)["']/i)?.[1] ?? "");
};

const APPROACH: [RegExp, string][] = [
  [/\b(tcc|cognitivo[- ]conductual|terapia cognitiva)\b/i, "TCC"],
  [/\b(sist[eé]mic[oa]|terapia (de )?pareja|terapia familiar)\b/i, "Sistémico"],
  [/\b(humanista|gestalt|centrad[oa] en la persona)\b/i, "Humanista"],
  [/\b(psicoan[aá]li\w+|psicodin[aá]mic\w+)\b/i, "Psicoanálisis"],
  [/\b(mindfulness|som[aá]tic[oa]|emdr|trauma)\b/i, "Somático / Mindfulness"],
  [/\b(integrativ[oa])\b/i, "Integrativo"],
];
const POPULATION: [RegExp, string][] = [
  [/\b(ni[ñn]os|infanto|infantil|adolescentes)\b/i, "Niños y adolescentes"],
  [/\b(parejas?)\b/i, "Parejas"],
  [/\b(familias?)\b/i, "Familias"],
  [/\b(adultos? mayor|tercera edad)\b/i, "Adultos mayores"],
  [/\b(adultos?)\b/i, "Adultos"],
];

export function parseSite(html: string): SiteInfo {
  const body = html.slice(0, 400_000);
  const title = decode(body.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "");
  const siteName = meta(body, "og:site_name");
  const description = meta(body, "description") || meta(body, "og:description");
  const headings = [...body.matchAll(/<h[12][^>]*>([\s\S]*?)<\/h[12]>/gi)].map((m) => decode(m[1]!.replace(/<[^>]+>/g, " "))).filter(Boolean).slice(0, 6);
  const text = [title, siteName, description, ...headings, meta(body, "keywords")].join(" ");
  const theme = meta(body, "theme-color");
  const hexes = [...body.matchAll(/#([0-9a-f]{6})\b/gi)].map((m) => `#${m[1]!.toLowerCase()}`);
  const count = new Map<string, number>();
  for (const h of hexes) count.set(h, (count.get(h) ?? 0) + 1);
  const isNeutral = (h: string): boolean => {
    const n = parseInt(h.slice(1), 16);
    const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    return Math.max(r, g, b) - Math.min(r, g, b) < 24; // gris, blanco o negro
  };
  const colors = [...count.entries()].filter(([h]) => !isNeutral(h)).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([h]) => h);
  const keywords = meta(body, "keywords").split(",").map((k) => k.trim()).filter(Boolean).slice(0, 8);
  return {
    name: (siteName || title.split(/[|–—-]/)[0] || "").trim().slice(0, 60),
    description: description.slice(0, 240),
    themeColor: /^#[0-9a-f]{6}$/i.test(theme) ? theme.toLowerCase() : null,
    colors,
    keywords,
    approach: APPROACH.find(([re]) => re.test(text))?.[1] ?? null,
    population: POPULATION.find(([re]) => re.test(text))?.[1] ?? null,
  };
}

/** true si la IP es privada, local, de enlace local o reservada (protección SSRF). */
export function isPrivateAddress(ip: string): boolean {
  const v = ip.trim().toLowerCase();
  if (v.includes(":")) {
    if (v === "::1" || v === "::" || v.startsWith("fe80") || v.startsWith("fc") || v.startsWith("fd")) return true;
    const mapped = v.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    return mapped ? isPrivateAddress(mapped[1]!) : false;
  }
  const p = v.split(".").map(Number);
  if (p.length !== 4 || p.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return true;
  const [a, b] = p as [number, number, number, number];
  return a === 10 || a === 127 || a === 0 || a >= 224 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127);
}

/** Valida y normaliza la URL que entrega el usuario. Devuelve null si no es una web pública http(s). */
export function normalizeUrl(raw: string): URL | null {
  const t = raw.trim().slice(0, 200);
  if (!t) return null;
  try {
    const u = new URL(/^https?:\/\//i.test(t) ? t : `https://${t}`);
    if (!/^https?:$/.test(u.protocol) || u.username || u.password) return null;
    if (u.port && !["80", "443"].includes(u.port)) return null;
    const h = u.hostname.toLowerCase();
    if (h === "localhost" || h.endsWith(".localhost") || h.endsWith(".local") || h.endsWith(".internal") || !h.includes(".")) return null;
    if (/^[\d.]+$/.test(h) || h.startsWith("[")) return null; // IPs literales no se aceptan
    return u;
  } catch {
    return null;
  }
}
