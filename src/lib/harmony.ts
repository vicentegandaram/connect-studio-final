import type { FeedCategory, Post } from "../types/studio";
import { FORMAT_BY_ID } from "../data/formats";

export interface HarmonyIssue {
  severity: "error" | "warning";
  message: string;
  /** Posiciones de la grilla (0–8) afectadas. */
  cells: number[];
}
export interface HarmonyReport {
  score: number;
  issues: HarmonyIssue[];
  counts: Record<FeedCategory, number>;
  /** Categoría sugerida para el próximo post. */
  next: FeedCategory;
}

export const CATEGORY_LABEL: Record<FeedCategory, string> = {
  educativo: "Psicoeducación",
  emocional: "Frase / validación",
  conversion: "Disponibilidad",
  video: "Reel",
};

const IDEAL: Record<FeedCategory, number> = { educativo: 3, emocional: 3, conversion: 1, video: 2 };

export function categoryOf(post: Post): FeedCategory {
  return FORMAT_BY_ID[post.format].category;
}

function neighbours(i: number, total: number): number[] {
  const out: number[] = [];
  const row = Math.floor(i / 3);
  if (i % 3 < 2 && i + 1 < total) out.push(i + 1);
  if (row < 2 && i + 3 < total) out.push(i + 3);
  return out;
}

/** `posts` va de más nuevo a más antiguo; la grilla muestra los primeros 9 (como Instagram). */
export function analyzeFeed(posts: Post[]): HarmonyReport {
  const grid = posts.slice(0, 9);
  const counts: Record<FeedCategory, number> = { educativo: 0, emocional: 0, conversion: 0, video: 0 };
  grid.forEach((p) => (counts[categoryOf(p)] += 1));
  const issues: HarmonyIssue[] = [];

  const sameKit = new Set(grid.map((p) => p.kit_id));
  if (sameKit.size > 1) {
    const main = [...sameKit].sort((a, b) => grid.filter((p) => p.kit_id === b).length - grid.filter((p) => p.kit_id === a).length)[0];
    issues.push({
      severity: "error",
      message: "Mezclas más de un Brand Kit. Un feed reconocible usa uno solo.",
      cells: grid.flatMap((p, i) => (p.kit_id === main ? [] : [i])),
    });
  }

  const repeated = new Set<number>();
  grid.forEach((p, i) => {
    for (const n of neighbours(i, grid.length)) if (grid[n] && grid[n]!.format === p.format) {
      repeated.add(i);
      repeated.add(n);
    }
  });
  if (repeated.size) issues.push({ severity: "warning", message: "Hay formatos iguales pegados. Alterna para dar ritmo.", cells: [...repeated] });

  const cta = grid.flatMap((p, i) => (categoryOf(p) === "conversion" ? [i] : []));
  if (cta.length > 2) issues.push({ severity: "warning", message: `${cta.length} posts de disponibilidad en 9: se siente comercial (máx. 2).`, cells: cta });
  const ctaAdjacent = cta.filter((i) => neighbours(i, grid.length).some((n) => cta.includes(n)));
  if (ctaAdjacent.length) issues.push({ severity: "warning", message: "Dos posts de disponibilidad seguidos saturan.", cells: ctaAdjacent });

  if (grid.length >= 6) {
    if (counts.educativo < 2) issues.push({ severity: "warning", message: "Falta psicoeducación: es lo que construye autoridad clínica.", cells: [] });
    if (counts.emocional < 1) issues.push({ severity: "warning", message: "Falta al menos una frase de validación para equilibrar el tono.", cells: [] });
  }

  const penalty = issues.reduce((acc, i) => acc + (i.severity === "error" ? 25 : 12), 0);
  const missing = grid.length < 9 ? Math.round((9 - grid.length) * 2) : 0;
  const score = Math.max(0, 100 - penalty - missing);

  const last = grid[0] ? categoryOf(grid[0]) : null;
  const next = (Object.keys(IDEAL) as FeedCategory[])
    .filter((c) => c !== last && !(c === "conversion" && counts.conversion >= 2))
    .sort((a, b) => counts[a] / IDEAL[a] - counts[b] / IDEAL[b])[0] ?? "educativo";

  return { score, issues, counts, next };
}
