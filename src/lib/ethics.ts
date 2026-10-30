import type { Fields, FormatDef, Post } from "../types/studio";
import { FORMAT_BY_ID } from "../data/formats";

export type Severity = "error" | "warning";
export interface EthicsIssue {
  severity: Severity;
  where: string;
  excerpt: string;
  message: string;
}
export interface EthicsPass {
  id: string;
  label: string;
}
export interface EthicsReport {
  issues: EthicsIssue[];
  passed: EthicsPass[];
  /** Ids de todas las reglas que fallaron (incluye «crisis», que no está en `passed`). */
  failed: string[];
}

interface Rule {
  id: string;
  passLabel: string;
  re: RegExp;
  /** Frases que niegan la promesa («no es una cura», «sin prometer»): se quitan antes de evaluar. */
  strip?: RegExp;
  severity: Severity;
  message: string;
}

// Heurísticas editoriales: no son asesoría legal ni reemplazan el código de ética del Colegio de Psicólogos.
const RULES: Rule[] = [
  {
    id: "no-diagnostica",
    passLabel: "No diagnostica: habla de experiencias comunes, no de trastornos.",
    re: /(?<!\bsi\s)\b(tienes|padeces|sufres de|eres)\s+(un[a]?\s+)?(depresi[oó]n|ansiedad|trastorno|bipolar|tdah|toc|tept|autis\w*|borderline)/i,
    severity: "error",
    message: "Parece un diagnóstico directo. Usa lenguaje psicoeducativo («puede ser señal de…»).",
  },
  {
    id: "no-promete",
    passLabel: "No promete curas ni resultados.",
    re: /(\b(te vas a curar|cura|curar\w*|sanar\w*|garantiz\w+|resultados?\s+(asegurad|garantizad)\w*|para siempre|(de\s+)?(forma|manera)\s+definitiva|definitivamente)\b|100\s?%|\b(supera|elimina|resuelve|acaba con|olv[ií]date de)\w*\b[^.!?]{0,40}\ben\s+\d+\s+(d[ií]as|semanas|sesiones|meses))/i,
    strip: /\b(no|sin)\s+(es\s+|son\s+)?(una\s+)?(prometer|promet\w+|garantiz\w+|cura\w*|curar\w*)(\s+m[aá]gica)?/gi,
    severity: "error",
    message: "Promete curas o resultados. No se puede garantizar un resultado terapéutico.",
  },
  {
    id: "no-reemplaza",
    passLabel: "No sugiere reemplazar la atención profesional.",
    re: /(no necesitas\s+(un[a]?\s+)?(psic[a-záéíóúñ]+|terapia)|en vez de ir al psic[a-záéíóúñ]+|en lugar de (ir a )?terapia)/i,
    severity: "error",
    message: "Sugiere reemplazar la atención profesional.",
  },
  {
    id: "no-promete-pacientes",
    passLabel: "No promete captar pacientes.",
    re: /(llena\s+tu\s+agenda|duplica\s+tus\s+pacientes|consigue\s+(m[aá]s\s+)?pacientes\s+(garantizados|en\s+\d+)|de\s+\d+\s+a\s+\d+\s+pacientes|pacientes\s+nuevos\s+(cada|por)\s+(semana|mes)|aumenta\s+tus\s+pacientes)/i,
    severity: "error",
    message: "Promete captar pacientes o cifras de captación. Publicidad sanitaria no debe prometer resultados.",
  },
  {
    id: "no-medicacion",
    passLabel: "No habla de fármacos ni dosis.",
    re: /\b(\d+\s?mg|dosis|antidepresiv\w+|ansiol[ií]tic\w+|benzodiacepin\w+|sertralina|fluoxetina|clonazepam|alprazolam|escitalopram|f[aá]rmacos?|medicamentos?)\b/i,
    severity: "warning",
    message: "Menciona fármacos o dosis. Un psicólogo no prescribe: deriva a un médico y evita recomendar o comparar medicación.",
  },
  {
    id: "no-evidencia-sin-fuente",
    passLabel: "Sin afirmaciones de «la ciencia dice» sin fuente.",
    re: /(estudios\s+(demuestran|prueban|muestran|confirman)|la\s+ciencia\s+(dice|demuestra|prueba)|cient[ií]ficamente\s+(probado|comprobado)|est[aá]\s+comprobado)/i,
    severity: "warning",
    message: "Afirma evidencia científica sin fuente. Cita autor y año, o reformula con «algunos estudios sugieren…».",
  },
  {
    id: "no-comparacion",
    passLabel: "Sin superlativos ni comparaciones con colegas.",
    re: /(\b(el|la)\s+mejor\s+(psic[a-záéíóúñ]+|terapeuta)|\bel\s+[uú]nico\s+(psic[a-záéíóúñ]+|terapeuta)|a\s+diferencia\s+de\s+otros\s+(psic[a-záéíóúñ]+|terapeutas)|los\s+dem[aá]s\s+(psic[a-záéíóúñ]+|terapeutas)\s+no)/i,
    severity: "warning",
    message: "Compara o se declara superior a otros profesionales. El código de ética pide evitar publicidad comparativa.",
  },
  {
    id: "no-testimonios",
    passLabel: "No usa testimonios ni casos de pacientes.",
    re: /\b(mi paciente|mis pacientes|(una?|esta|este)\s+pacientes?\s+(de|m[ií]o|m[ií]a)|testimonios?|caso real|me (dijo|dijeron) (un|una) paciente)\b/i,
    severity: "error",
    message: "Menciona pacientes o testimonios: riesgo de confidencialidad y publicidad indebida.",
  },
  {
    id: "no-presion",
    passLabel: "Sin urgencia ni descuentos agresivos.",
    re: /(\b(urgente|[uú]ltim[oa]s?\s+cupos?|solo hoy|no esperes m[aá]s|oferta|promo\w*)\b|\d+\s?%\s?(dcto|descuento|off))/i,
    severity: "warning",
    message: "Tono comercial o de urgencia. Para servicios de salud mental, mejor informar y dejar decidir.",
  },
  {
    id: "no-hashtag-dx",
    passLabel: "Sin hashtags que etiqueten diagnósticos.",
    re: /#(depresi[oó]n|bipolar|tdah|suicid\w*|trastorno\w*)/i,
    severity: "warning",
    message: "Hashtag que etiqueta un diagnóstico; prefiere etiquetas de bienestar (#saludmental, #autocuidado).",
  },
  {
    id: "no-fisiologia",
    passLabel: "Sin afirmaciones fisiológicas sin respaldo.",
    re: /(nervio vago|reprogram\w+\s+(tu\s+)?cerebro|cortisol|qu[ií]mica cerebral)/i,
    severity: "warning",
    message: "Afirmación fisiológica: cítala con fuente o evítala.",
  },
];

const CRISIS_RE = /(suicid\w*|autolesi\w*|quitarme la vida|quitarte la vida)/i;

function fieldLabels(def: FormatDef): Record<string, string> {
  return Object.fromEntries(def.fields.map((f) => [f.key, f.label]));
}

/** Junta todo el texto visible del post: campos y capas de texto. */
export function postTexts(post: Post): Record<string, string> {
  const def = FORMAT_BY_ID[post.format];
  const labels = fieldLabels(def);
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(post.fields)) out[labels[k] ?? k] = v;
  if (post.caption) out["Descripción de Instagram"] = post.caption;
  post.extras.forEach((ex, i) =>
    ex.layers.forEach((l, j) => {
      if (l.type === "text") out[`Capa de texto ${i + 1}.${j + 1}`] = l.text;
    }),
  );
  return out;
}

export function reviewTexts(texts: Record<string, string>): EthicsReport {
  const issues: EthicsIssue[] = [];
  const failed = new Set<string>();
  for (const [where, text] of Object.entries(texts)) {
    for (const rule of RULES) {
      const m = (rule.strip ? text.replace(rule.strip, " ") : text).match(rule.re);
      if (m) {
        issues.push({ severity: rule.severity, where, excerpt: m[0], message: rule.message });
        failed.add(rule.id);
      }
    }
  }
  const all = Object.values(texts).join(" ");
  if (CRISIS_RE.test(all) && !/4141/.test(all)) {
    issues.push({
      severity: "error",
      where: "Contenido",
      excerpt: all.match(CRISIS_RE)?.[0] ?? "",
      message: "Menciona crisis o autolesión: incluye una línea de ayuda (ej. *4141 del Minsal) y evita detalles.",
    });
    failed.add("crisis");
  }
  const passed = RULES.filter((r) => !failed.has(r.id)).map((r) => ({ id: r.id, label: r.passLabel }));
  return { issues, passed, failed: [...failed] };
}

export function reviewPost(post: Post): EthicsReport {
  return reviewTexts(postTexts(post));
}

export function hasBlocking(report: EthicsReport): boolean {
  return report.issues.some((i) => i.severity === "error");
}

export function fieldsToText(fields: Fields): string {
  return Object.values(fields).join("\n");
}
