import type { Approach, ClinicalDNA, FormatId, KitId, Post } from "../types/studio";
import { makePost } from "./store";
import { buildPlan, demoCaption, fieldsForTopic, nextWeekday } from "./planner";

export interface PackageAnswers {
  approach: Approach;
  target_population: string;
  recurring_concern: string;
  tone: ClinicalDNA["tone"];
  perWeek: 3 | 5 | 7;
}

/** Días de la semana (0 = lunes) que se usan según cuántas piezas por semana pide el psicólogo. */
const WEEKDAYS: Record<3 | 5 | 7, number[]> = { 3: [0, 2, 4], 5: [0, 1, 2, 3, 4], 7: [0, 1, 2, 3, 4, 5, 6] };

const addDays = (iso: string, n: number): string => {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const dnaFromAnswers = (dna: ClinicalDNA, a: PackageAnswers): ClinicalDNA => ({ ...dna, approach: a.approach, target_population: a.target_population, recurring_concern: a.recurring_concern, tone: a.tone });

/** Paquete de 2 semanas: piezas en borrador, con fecha planificada y descripción base. Nada queda aprobado. */
export function buildPackage(dna: ClinicalDNA, kit_id: KitId, existing: Post[], a: PackageAnswers, startRound: number): Post[] {
  const d = dnaFromAnswers(dna, a);
  const out: Post[] = [];
  const have = new Set(existing.map((p) => p.planId).filter(Boolean));
  for (let week = 0; week < 2; week++) {
    const plan = buildPlan(startRound + week);
    for (const idea of plan.filter((i) => WEEKDAYS[a.perWeek].includes(i.weekday))) {
      const planId = `pk-${startRound}-${week}-${idea.weekday}`;
      if (have.has(planId)) continue;
      const fields = fieldsForTopic(idea.format as FormatId, idea.topic, d, [...existing, ...out]);
      const post = makePost(idea.format as FormatId, kit_id, fields);
      out.push({ ...post, topic: idea.topic, pillar: idea.pillar, planId, status: "borrador", scheduledAt: addDays(nextWeekday(idea.weekday), week * 7), caption: demoCaption(idea.topic, d) });
    }
  }
  return out;
}
