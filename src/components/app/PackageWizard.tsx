import { useState } from "react";
import { Loader2, Sparkles, X } from "lucide-react";
import type { Approach, TherapeuticTone } from "../../types/studio";
import type { Studio } from "../../lib/store";
import { recommendKit } from "../../data/kits";
import { buildPackage, dnaFromAnswers, type PackageAnswers } from "../../lib/package";
import { Btn, inputCls } from "./ui";

const APPROACHES: Approach[] = ["TCC", "Humanista", "Sistémico", "Psicoanálisis", "Somático / Mindfulness", "Integrativo"];
const TONES: { id: TherapeuticTone; label: string }[] = [{ id: "calido", label: "Cálido" }, { id: "estructurado", label: "Estructurado" }, { id: "reflexivo", label: "Reflexivo" }];

/** Spotli: «5 preguntas → el mes». Aquí: 5 preguntas → 2 semanas, todo en borrador para que el psicólogo apruebe. */
export function PackageWizard({ studio, onClose, onDone }: { studio: Studio; onClose: () => void; onDone: (n: number) => void }) {
  const { dna } = studio.state;
  const [a, setA] = useState<PackageAnswers>({ approach: dna.approach, target_population: dna.target_population, recurring_concern: dna.recurring_concern, tone: dna.tone, perWeek: 5 });
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof PackageAnswers>(k: K, v: PackageAnswers[K]) => setA((x) => ({ ...x, [k]: v }));
  const valid = a.target_population.trim().length > 2 && a.recurring_concern.trim().length > 2;
  const go = () => {
    setBusy(true);
    const pieces = buildPackage(dna, studio.state.kit_id, studio.state.posts, a, studio.state.planRound);
    studio.setDna(dnaFromAnswers(dna, a));
    studio.setKit(recommendKit(a.approach).kit_id);
    studio.addMany(pieces);
    onDone(pieces.length);
  };
  const q = (n: number, label: string) => <label className="mb-1 block text-sm font-bold"><span className="mr-1.5 text-brand">{n}.</span>{label}</label>;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Armar mi paquete">
        <div className="mb-1 flex items-start justify-between">
          <h2 className="flex items-center gap-2 text-xl font-extrabold"><Sparkles size={18} className="text-brand" />Armar mi paquete de 2 semanas</h2>
          <button aria-label="Cerrar" onClick={onClose} className="rounded-full bg-slate-100 p-2 text-slate-500 hover:text-slate-900"><X size={16} /></button>
        </div>
        <p className="mb-5 text-sm text-slate-500">5 preguntas y te dejamos todas las piezas en <b>borrador</b>. Nada se publica hasta que tú las apruebes.</p>
        <div className="space-y-4">
          <div>{q(1, "¿Cuál es tu enfoque clínico?")}<select className={inputCls} value={a.approach} onChange={(e) => set("approach", e.target.value as Approach)}>{APPROACHES.map((x) => <option key={x}>{x}</option>)}</select></div>
          <div>{q(2, "¿A quién acompañas?")}<input className={inputCls} value={a.target_population} onChange={(e) => set("target_population", e.target.value.slice(0, 80))} placeholder="Ej. Adultos jóvenes" /></div>
          <div>{q(3, "¿Cuál es el motivo de consulta más frecuente?")}<input className={inputCls} value={a.recurring_concern} onChange={(e) => set("recurring_concern", e.target.value.slice(0, 80))} placeholder="Ej. ansiedad y sobrepensamiento" /></div>
          <div>{q(4, "¿Cómo quieres sonar?")}
            <div className="grid grid-cols-3 gap-2">{TONES.map((t) => <button key={t.id} onClick={() => set("tone", t.id)} className={`rounded-2xl border px-3 py-2 text-sm font-bold ${a.tone === t.id ? "border-brand bg-soft text-brand" : "border-slate-200 text-slate-600"}`}>{t.label}</button>)}</div></div>
          <div>{q(5, "¿Cuántas publicaciones por semana?")}
            <div className="grid grid-cols-3 gap-2">{([3, 5, 7] as const).map((n) => <button key={n} onClick={() => set("perWeek", n)} className={`rounded-2xl border px-3 py-2 text-sm font-bold ${a.perWeek === n ? "border-brand bg-soft text-brand" : "border-slate-200 text-slate-600"}`}>{n}<span className="block text-[11px] font-normal text-slate-500">{n * 2} en total</span></button>)}</div></div>
        </div>
        <Btn className="mt-6 w-full" disabled={!valid || busy} onClick={go}>{busy ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}Crear {a.perWeek * 2} piezas en borrador</Btn>
      </div>
    </div>
  );
}
