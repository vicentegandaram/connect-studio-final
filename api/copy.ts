import { GoogleGenAI } from "@google/genai";

// Función de servidor (Vercel): GEMINI_API_KEY nunca llega al navegador.
const MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

const SYSTEM = `Eres redactor de contenido para psicólogos clínicos en Chile (Instagram).
Reglas éticas obligatorias:
- NUNCA diagnostiques ni digas "tienes X". Usa lenguaje psicoeducativo ("algunas personas...", "puede ser señal de...").
- No prometas curas, resultados ni plazos. No reemplaces la consulta profesional.
- Sin testimonios, casos reales ni menciones de pacientes. Sin urgencia, miedo ni descuentos.
- No afirmes mecanismos fisiológicos sin respaldo.
- Si el tema roza una crisis, no des detalles e invita a buscar ayuda (*4141 del Minsal).
Respeta el límite de caracteres de cada campo. Español de Chile, claro, sin tecnicismos salvo que el tono lo pida.
Responde SOLO un JSON: {"variants":[{...campos}, {...}, {...}]} con exactamente 3 variantes distintas.`;

const hits = new Map<string, number[]>();
function limited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 20;
}
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
const str = (x: unknown, max: number) => (typeof x === "string" ? x.trim().slice(0, max) : "");

interface FieldSpec {
  key: string;
  label: string;
  max: number;
}

export async function POST(request: Request): Promise<Response> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return json({ error: "demo" }, 503);
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (limited(ip)) return json({ error: "Demasiadas solicitudes." }, 429);

  const b = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const dna = (b?.dna ?? {}) as Record<string, unknown>;
  const fields: FieldSpec[] = Array.isArray(b?.fields)
    ? (b.fields as unknown[]).flatMap((f) => {
        const o = f as Record<string, unknown>;
        const max = typeof o.max === "number" ? Math.min(500, Math.max(10, o.max)) : 150;
        return typeof o.key === "string" && /^[a-z0-9]{1,16}$/i.test(o.key) ? [{ key: o.key, label: str(o.label, 60), max }] : [];
      })
    : [];
  if (fields.length === 0) return json({ error: "Faltan campos." }, 400);

  const prompt = [
    `Formato: ${str(b?.format, 120)}`,
    `Tema: ${str(b?.topic, 160) || "(el del texto actual)"}`,
    `Marca: ${str(b?.kit, 60)} · Voz: ${str(b?.voice_prompt, 300)}`,
    `Profesional: ${str(dna.title, 80)}, enfoque ${str(dna.approach, 40)}, población ${str(dna.target_population, 100)}, consulta frecuente: ${str(dna.recurring_concern, 120)}, tono ${str(dna.tone, 20)}`,
    `Campos (máx. caracteres): ${fields.map((f) => `${f.key} = ${f.label} (${f.max})`).join("; ")}`,
    `Texto actual (referencia de tema): ${JSON.stringify(b?.current ?? {}).slice(0, 800)}`,
  ].join("\n");

  try {
    const ai = new GoogleGenAI({ apiKey });
    const res = await ai.models.generateContent({ model: MODEL, contents: prompt, config: { systemInstruction: SYSTEM, maxOutputTokens: 2000, responseMimeType: "application/json" } });
    const parsed = JSON.parse(res.text ?? "{}") as { variants?: Record<string, unknown>[] };
    const variants = (parsed.variants ?? []).slice(0, 3).map((v) => Object.fromEntries(fields.map((f) => [f.key, str(v[f.key], f.max)])));
    if (!variants.length) return json({ error: "Respuesta vacía." }, 502);
    return json({ variants });
  } catch {
    return json({ error: "No se pudo generar con IA." }, 502);
  }
}
