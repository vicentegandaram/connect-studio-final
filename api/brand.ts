import { lookup } from "node:dns/promises";
import { isPrivateAddress, normalizeUrl, parseSite } from "./_lib/brandParse";

// Función de servidor (Vercel). Lee SOLO la portada pública de una web para proponer el Clinical DNA.
// Protecciones: solo http/https a puertos 80/443, sin IPs literales, resolución DNS comprobada contra
// rangos privados, redirecciones revisadas una a una, tiempo y tamaño acotados.
const MAX_BYTES = 1_500_000;
const hits = new Map<string, number[]>();
function limited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 15;
}
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

async function assertPublic(u: URL): Promise<void> {
  const addrs = await lookup(u.hostname, { all: true });
  if (!addrs.length || addrs.some((a) => isPrivateAddress(a.address))) throw new Error("blocked");
}

async function fetchHtml(start: URL): Promise<string> {
  let url = start;
  for (let hop = 0; hop < 4; hop++) {
    await assertPublic(url);
    const res = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(8000), headers: { "user-agent": "ConnectBrandBot/1.0 (+lectura de portada pública)", accept: "text/html" } });
    if (res.status >= 300 && res.status < 400) {
      const next = res.headers.get("location");
      const n = next ? normalizeUrl(new URL(next, url).toString()) : null;
      if (!n) throw new Error("redirect");
      url = n;
      continue;
    }
    if (!res.ok) throw new Error("status");
    if (!(res.headers.get("content-type") ?? "").includes("text/html")) throw new Error("type");
    const reader = res.body?.getReader();
    if (!reader) throw new Error("empty");
    const chunks: Uint8Array[] = [];
    let total = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.length;
      if (total > MAX_BYTES) { await reader.cancel(); break; }
      chunks.push(value);
    }
    return new TextDecoder().decode(Buffer.concat(chunks));
  }
  throw new Error("redirects");
}

export async function POST(request: Request): Promise<Response> {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (limited(ip)) return json({ error: "Demasiadas solicitudes." }, 429);
  const body = (await request.json().catch(() => null)) as { url?: unknown } | null;
  const u = typeof body?.url === "string" ? normalizeUrl(body.url) : null;
  if (!u) return json({ error: "URL no válida. Usa una web pública, por ejemplo tupsicologa.cl." }, 400);
  try {
    const html = await fetchHtml(u);
    return json({ site: parseSite(html), host: u.hostname });
  } catch {
    return json({ error: "No se pudo leer esa web (puede estar bloqueada o ser una app sin contenido público)." }, 422);
  }
}
