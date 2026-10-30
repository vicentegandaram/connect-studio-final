import { useMemo, useState } from "react";
import { RefreshCw, Sparkles, Wand2 } from "lucide-react";
import type { FormatId, Pillar } from "../../types/studio";
import type { Studio } from "../../lib/store";
import { makePost } from "../../lib/store";
import { FORMAT_BY_ID } from "../../data/formats";
import { analyzeFeed } from "../../lib/harmony";
import { buildPlan, fieldsForTopic, nextWeekday, PILLARS, type PlanIdea } from "../../lib/planner";
import { BeforeAfterModal } from "../studio/BeforeAfterModal";
import { PackageWizard } from "./PackageWizard";
import { Btn, Card, Chip, FitThumb } from "./ui";

const OBJECTIVE: Record<Pillar, string> = { psicoeducacion: "Educar", desmitificacion: "Desmitificar", sintomas: "Dar señales" };

export function HomeView({ studio, onOpen, onPackage }: { studio: Studio; onOpen: () => void; onPackage: () => void }) {
  const { state } = studio;
  const [beforeAfter, setBeforeAfter] = useState(false);
  const [wizard, setWizard] = useState(false);
  const plan = useMemo(() => buildPlan(state.planRound), [state.planRound]);
  const today = plan[(new Date().getDay() + 6) % 7]!;
  const made = (i: PlanIdea) => state.posts.find((p) => p.planId === i.id);
  const preview = useMemo(() => makePost(today.format, state.kit_id, fieldsForTopic(today.format, today.topic, state.dna, [])), [today, state.kit_id, state.dna]);
  const feed = useMemo(() => analyzeFeed(state.posts), [state.posts]);
  const build = (i: PlanIdea) => {
    const existing = made(i);
    if (existing) studio.select(existing.id);
    else studio.create(i.format as FormatId, fieldsForTopic(i.format, i.topic, state.dna, state.posts), { topic: i.topic, pillar: i.pillar, planId: i.id, status: "borrador", scheduledAt: nextWeekday(i.weekday) });
    onOpen();
  };
  const first = state.dna.name.replace(/^Ps\.\s*/i, "").split(" ")[0];
  return (
    <div className="fade-up">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold md:text-3xl">Hola, {first} 👋</h1>
        <div className="flex gap-2">
          <Btn variant="ghost" onClick={() => setBeforeAfter(true)}><Wand2 size={15} />Ver antes vs. después</Btn>
          <Btn onClick={() => setWizard(true)}><Sparkles size={15} />Armar mi paquete de 2 semanas</Btn>
        </div>
      </div>
      <p className="mb-6 text-sm text-slate-500">
        Tu semana de contenido ya está pensada: {state.posts.length} publicaciones creadas, {state.posts.filter((p) => p.status === "publicado").length} publicadas. Armonía del feed: <b className={feed.score >= 80 ? "text-emerald-700" : feed.score >= 55 ? "text-amber-700" : "text-rose-600"}>{feed.score}/100</b>.
      </p>

      <div className="mb-8 grid gap-5 md:grid-cols-[minmax(0,320px)_1fr]">
        <div className="self-start rounded-3xl border border-blue-100 bg-gradient-to-b from-blue-50/70 to-white p-4">
          <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-brand px-3 py-1.5 text-xs font-extrabold text-white"><Sparkles size={13} /> RECOMENDACIÓN DEL DÍA</span>
          <div className="mb-2"><Chip>Objetivo: {OBJECTIVE[today.pillar]} · {FORMAT_BY_ID[today.format].title}</Chip></div>
          <p className="mb-3 text-sm text-slate-600">Ya lo pensamos y armamos por ti. Solo apruébalo.</p>
          <FitThumb post={preview} studio={studio} />
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Btn variant="soft" onClick={() => build(today)}>Editar</Btn>
            <Btn onClick={() => build(today)}>Crear ahora</Btn>
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-extrabold">Plan semanal</h2>
            <Btn variant="ghost" onClick={studio.nextRound}><RefreshCw size={14} />Otras ideas</Btn>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {plan.map((i) => (
              <Card key={i.id} className={`!p-4 ${i === today ? "ring-2 ring-brand/30" : ""}`}>
                <div className="mb-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  <span>{i.day}</span><Chip color={PILLARS[i.pillar].color}>{PILLARS[i.pillar].label}</Chip>
                </div>
                <p className="mb-1 min-h-12 text-sm font-bold leading-snug">{i.topic}</p>
                <p className="mb-3 text-[11px] text-slate-500">{FORMAT_BY_ID[i.format].title}</p>
                <Btn variant={made(i) ? "soft" : "primary"} className="w-full" onClick={() => build(i)}>{made(i) ? "Abrir publicación" : "Crear publicación"}</Btn>
              </Card>
            ))}
          </div>
        </div>
      </div>
      {beforeAfter ? <BeforeAfterModal studio={studio} onClose={() => setBeforeAfter(false)} /> : null}
      {wizard ? <PackageWizard studio={studio} onClose={() => setWizard(false)} onDone={() => { setWizard(false); onPackage(); }} /> : null}
    </div>
  );
}
