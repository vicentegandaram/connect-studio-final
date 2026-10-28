import type { Approach, ClinicalDNA, Fields, FormatId, Pillar, Post } from "../types/studio";
import { FORMAT_BY_ID, fillVariant } from "../data/formats";
import { cleanTopic } from "../data/formats-extra";

export const PILLARS: Record<Pillar, { label: string; chip: string }> = {
  psicoeducacion: { label: "Psicoeducación", chip: "bg-sky-500/15 text-sky-300" },
  desmitificacion: { label: "Desmitificación", chip: "bg-amber-500/15 text-amber-300" },
  sintomas: { label: "Señales y síntomas", chip: "bg-violet-500/15 text-violet-300" },
};

export interface PlanIdea {
  id: string;
  /** 0 = lunes … 6 = domingo */
  weekday: number;
  day: string;
  pillar: Pillar;
  topic: string;
  format: FormatId;
}

const BANK: Record<Pillar, string[]> = {
  psicoeducacion: [
    "Qué pasa en el cuerpo cuando sentimos ansiedad",
    "Por qué postergamos y no es flojera",
    "Cómo poner límites sin culpa",
    "La diferencia entre estrés y agotamiento",
    "Cómo funcionan los pensamientos automáticos",
    "Para qué sirve la terapia, paso a paso",
  ],
  desmitificacion: [
    "Ir al psicólogo no es de locos",
    "Mito: pensar positivo lo arregla todo",
    "Mito: hablar de lo que duele lo empeora",
    "Mito: la terapia es para toda la vida",
    "Mito: si no lloras en sesión, no sirve",
    "Mito: los hombres no necesitan terapia",
  ],
  sintomas: [
    "Señales de que estás emocionalmente agotado/a",
    "Cómo se siente el burnout en el cuerpo",
    "Cuando dormir mal es una señal para escucharte",
    "Señales de que estás evitando algo",
    "Qué es una crisis de pánico y cómo acompañarte",
    "Señales de que necesitas pausar",
  ],
};

/** Formatos que sirven a cada pilar; el plan los va rotando para no repetir lámina. */
const FORMATS_BY_PILLAR: Record<Pillar, FormatId[]> = {
  psicoeducacion: ["carrusel-psicoeducativo", "sabias-que", "checklist"],
  desmitificacion: ["mito-realidad", "antes-despues"],
  sintomas: ["checklist", "guion-reel", "frase-validacion"],
};

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const ORDER: Pillar[] = ["psicoeducacion", "desmitificacion", "sintomas", "psicoeducacion", "desmitificacion", "sintomas", "psicoeducacion"];

/** Plan semanal de 7 ideas. `round` cambia las ideas elegidas al pedir «otra semana». */
export function buildPlan(round: number): PlanIdea[] {
  const seen: Record<Pillar, number> = { psicoeducacion: 0, desmitificacion: 0, sintomas: 0 };
  return DAYS.map((day, i) => {
    const pillar = ORDER[i]!;
    const n = seen[pillar]++;
    const topics = BANK[pillar];
    const formats = FORMATS_BY_PILLAR[pillar];
    return { id: `${round}-${i}`, weekday: i, day, pillar, topic: topics[(round * 2 + n) % topics.length]!, format: formats[(round + n) % formats.length]! };
  });
}

const iso = (d: Date): string => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const todayISO = (): string => iso(new Date());

/** Próxima fecha (hoy incluido) que cae en ese día de la semana. */
export function nextWeekday(weekday: number): string {
  const d = new Date();
  const today = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() + ((weekday - today + 7) % 7));
  return iso(d);
}

/** Contenido inicial para una idea del plan: usa el tema si el formato lo admite y completa con el banco local. */
export function fieldsForTopic(format: FormatId, topic: string, dna: ClinicalDNA, posts: Post[]): Fields {
  const def = FORMAT_BY_ID[format];
  const used = posts.filter((p) => p.format === format).length;
  const base = def.fromTopic ? def.fromTopic(topic, dna) : fillVariant(def.variants[used % def.variants.length]!, dna.recurring_concern);
  const fields: Fields = { ...fillVariant(def.variants[used % def.variants.length]!, dna.recurring_concern), ...base };
  if (def.topicKey && !def.fromTopic) fields[def.topicKey] = cleanTopic(topic);
  return Object.fromEntries(def.fields.map((f) => [f.key, (fields[f.key] ?? "").slice(0, f.max)]));
}

/** Descripción de Instagram de ejemplo (sin IA): invita a guardar y a consultar, sin prometer nada. */
export function demoCaption(topic: string, dna: ClinicalDNA): string {
  const t = cleanTopic(topic) || "lo que estás viviendo";
  return `${t}. Si algo de esto te resuena, no tienes que cargarlo solo/a: conversarlo con un profesional puede ayudarte.\n\nGuarda este post para cuando lo necesites.\n\n#psicologia #saludmental #bienestaremocional #autocuidado #psicologiachile\n\nMás en ${dna.handle}`;
}

const APPROACH_RULES: [RegExp, Approach][] = [
  [/pareja|vincul|familia/i, "Sistémico"],
  [/mindful|soma|yoga/i, "Somático / Mindfulness"],
  [/humanis|gestalt/i, "Humanista"],
  [/psicoanal|lacan|freud/i, "Psicoanálisis"],
  [/tcc|cogni|ansied/i, "TCC"],
];
const POPULATIONS = ["Adultos jóvenes", "Adultos", "Familias", "Profesionales con estrés"];
const hash = (s: string): number => [...s].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0, 2166136261);

/** Demo del «análisis de marca»: deriva un DNA verosímil desde la URL, sin llamar a ningún servicio. */
export function deriveDNA(rawUrl: string, current: ClinicalDNA): ClinicalDNA {
  const host = rawUrl.trim().replace(/^https?:\/\//i, "").replace(/^www\./i, "").replace(/\/.*$/, "");
  const base = host.split(".")[0] || "tu consulta";
  const h = hash(host);
  return {
    ...current,
    website: host,
    name: "Ps. " + base.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    handle: "@" + base.replace(/[^a-z0-9._]/gi, "").toLowerCase(),
    approach: APPROACH_RULES.find(([re]) => re.test(host))?.[1] ?? "Integrativo",
    target_population: POPULATIONS[h % POPULATIONS.length]!,
  };
}
