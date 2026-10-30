import type { Approach, BrandKit, KitId } from "../types/studio";

// Cuatro colores por kit: nada fuera de la paleta. `primary` es la tinta (texto), `accent` el color de marca.
// Los pares usados en las plantillas se verifican con `npm run check:kits` (WCAG AA 4.5:1).
export const BRAND_KITS: BrandKit[] = [
  {
    kit_id: "calido-cercano",
    name: "Cálido & Cercano",
    archetype: "Vínculo y contención",
    description: "Psicoterapia humanista, apego, duelo y ansiedad cotidiana.",
    palette: { background: "#FBF7F2", surface: "#F2E8DC", primary: "#2D2622", accent: "#A44B35" },
    fonts: { heading: "Lora", body: "Plus Jakarta Sans" },
    voice_prompt: "Cálido, validador y empático. Habla en segunda persona singular, sin tecnicismos, normalizando la experiencia sin minimizarla.",
    recommended_for: ["Humanista", "Sistémico", "Integrativo"],
  },
  {
    kit_id: "minimal-clinico",
    name: "Minimal Clínico",
    archetype: "Evidencia y rigor",
    description: "TCC, DBT, neuropsicología y hábitos.",
    palette: { background: "#F8FAFC", surface: "#E8EEF5", primary: "#0F172A", accent: "#1D4ED8" },
    fonts: { heading: "Inter", body: "Inter" },
    voice_prompt: "Estructurado, claro y psicoeducativo. Frases cortas, pasos numerados, sin promesas; explica el porqué de cada técnica.",
    recommended_for: ["TCC"],
  },
  {
    kit_id: "mente-tierra",
    name: "Mente & Tierra",
    archetype: "Calma y presencia",
    description: "Terapia somática, mindfulness, regulación y burnout.",
    palette: { background: "#F5F6F2", surface: "#E4E9DC", primary: "#1E2922", accent: "#3F624D" },
    fonts: { heading: "Playfair Display", body: "Outfit" },
    voice_prompt: "Sereno y orgánico. Invita a notar el cuerpo y el presente con autocompasión, sin exigir ni prometer calma inmediata.",
    recommended_for: ["Somático / Mindfulness", "Integrativo"],
  },
  {
    kit_id: "editorial-profundo",
    name: "Editorial Profundo",
    archetype: "Reflexión y sentido",
    description: "Orientación analítica, reflexiva o de autor.",
    palette: { background: "#FAF8F5", surface: "#ECE7DF", primary: "#1A1A1A", accent: "#7A4F2E" },
    fonts: { heading: "Cormorant Garamond", body: "Newsreader" },
    voice_prompt: "Elegante y evocador. Plantea preguntas abiertas en lugar de respuestas; deja espacio a la ambigüedad y a la introspección.",
    recommended_for: ["Psicoanálisis"],
  },
];

export const KIT_BY_ID: Record<KitId, BrandKit> = Object.fromEntries(BRAND_KITS.map((k) => [k.kit_id, k])) as Record<KitId, BrandKit>;

export function recommendKit(approach: Approach): BrandKit {
  return BRAND_KITS.find((k) => k.recommended_for.includes(approach)) ?? BRAND_KITS[0]!;
}

const rgb = (hex: string): [number, number, number] => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

/** Kit cerrado cuyo color de acento se parece más a los colores detectados en la web del psicólogo. */
export function nearestKit(colors: string[]): BrandKit | null {
  if (!colors.length) return null;
  const dist = (a: string, b: string): number => {
    const [x, y] = [rgb(a), rgb(b)];
    return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]);
  };
  return BRAND_KITS.map((k) => ({ k, d: Math.min(...colors.map((c) => Math.min(dist(c, k.palette.accent), dist(c, k.palette.primary)))) })).sort((a, b) => a.d - b.d)[0]!.k;
}
