import type { ClinicalDNA, BrandKit, Fields, FormatDef } from "../types/studio";
import { fillVariant } from "../data/formats";
import { demoCaption } from "./planner";

export interface VariantsResult {
  variants: Fields[];
  source: "ia" | "local";
}

/** Pide variantes a /api/copy (Gemini, solo servidor). Sin API o sin key, usa el banco local del formato. */
export async function generateVariants(def: FormatDef, dna: ClinicalDNA, kit: BrandKit, current: Fields): Promise<VariantsResult> {
  try {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 20_000);
    const res = await fetch("/api/copy", {
      method: "POST",
      headers: { "content-type": "application/json" },
      signal: ctl.signal,
      body: JSON.stringify({
        format: def.title,
        fields: def.fields.map((f) => ({ key: f.key, label: f.label, max: f.max })),
        current,
        dna,
        voice_prompt: kit.voice_prompt,
        kit: kit.name,
      }),
    });
    clearTimeout(timer);
    if (res.ok) {
      const data = (await res.json()) as { variants?: Fields[] };
      const clean = (data.variants ?? []).filter((v) => def.fields.every((f) => typeof v[f.key] === "string"));
      if (clean.length) return { variants: clean.slice(0, 3), source: "ia" };
    }
  } catch {
    /* sin red o sin backend (vite dev): cae al banco local */
  }
  const bank = def.variants.map((v) => fillVariant(v, dna.recurring_concern));
  const currentJson = JSON.stringify(current);
  const rest = bank.filter((v) => JSON.stringify(v) !== currentJson);
  return { variants: (rest.length ? rest : bank).slice(0, 3), source: "local" };
}

const CAPTION_MAX = 600;

/** Descripción de Instagram: Gemini vía /api/copy (un solo campo «caption»); sin IA usa un texto base seguro. */
export async function generateCaption(def: FormatDef, dna: ClinicalDNA, kit: BrandKit, fields: Fields, topic: string): Promise<{ caption: string; source: "ia" | "local" }> {
  try {
    const res = await fetch("/api/copy", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        format: `Descripción de Instagram para: ${def.title}`,
        fields: [{ key: "caption", label: "Descripción de Instagram (cierra invitando a guardar y sin prometer resultados, con 5 hashtags de bienestar)", max: CAPTION_MAX }],
        current: fields,
        topic,
        dna,
        voice_prompt: kit.voice_prompt,
        kit: kit.name,
      }),
    });
    if (res.ok) {
      const data = (await res.json()) as { variants?: Fields[] };
      const caption = data.variants?.[0]?.caption;
      if (caption) return { caption, source: "ia" };
    }
  } catch {
    /* sin backend: texto base */
  }
  return { caption: demoCaption(topic || Object.values(fields)[0] || "", dna), source: "local" };
}
