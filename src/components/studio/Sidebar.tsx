import { useState } from "react";
import { CalendarClock, ChevronDown, ChevronRight, Globe, Plus, ShieldCheck, Stethoscope } from "lucide-react";
import type { Approach, ClinicalDNA, FormatId, TherapeuticTone } from "../../types/studio";
import type { Studio } from "../../lib/store";
import { BRAND_KITS, KIT_BY_ID, recommendKit } from "../../data/kits";
import { FORMATS } from "../../data/formats";
import { auditKit } from "../../lib/color";
import { analyzeFeed, CATEGORY_LABEL } from "../../lib/harmony";
import type { FeedCategory } from "../../types/studio";
import { deriveDNA } from "../../lib/planner";

const APPROACHES: Approach[] = ["TCC", "Humanista", "Sistémico", "Psicoanálisis", "Somático / Mindfulness", "Integrativo"];
const TONES: { id: TherapeuticTone; label: string }[] = [
  { id: "calido", label: "Cálido / empático" },
  { id: "estructurado", label: "Estructurado" },
  { id: "reflexivo", label: "Reflexivo" },
];
const CATEGORY_FORMAT = (c: FeedCategory): FormatId[] => FORMATS.filter((f) => f.category === c).map((f) => f.id);

const input = "w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-100 outline-none focus:border-sky-500";
const label = "mb-1 block text-[10px] font-medium uppercase tracking-wide text-slate-500";

function Section({ title, icon, children, open: initial = true }: { title: string; icon: React.ReactNode; children: React.ReactNode; open?: boolean }) {
  const [open, setOpen] = useState(initial);
  return (
    <section className="border-b border-slate-800">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between px-4 py-3 text-left">
        <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{icon}{title}</span>
        {open ? <ChevronDown size={14} className="text-slate-500" /> : <ChevronRight size={14} className="text-slate-500" />}
      </button>
      {open ? <div className="px-4 pb-4">{children}</div> : null}
    </section>
  );
}

export function Sidebar({ studio }: { studio: Studio }) {
  const { state, active } = studio;
  const [url, setUrl] = useState("");
  const dna = state.dna;
  const set = <K extends keyof ClinicalDNA>(k: K, v: ClinicalDNA[K]) => studio.setDna({ ...dna, [k]: v });
  const report = analyzeFeed(state.posts);
  const todayFormat = CATEGORY_FORMAT(report.next).map((id) => ({ id, n: state.posts.slice(0, 9).filter((p) => p.format === id).length })).sort((a, b) => a.n - b.n)[0]!.id;
  const todayDef = FORMATS.find((f) => f.id === todayFormat)!;
  const grid = state.posts.slice(0, 9);
  const recKit = recommendKit(dna.approach);

  return (
    <aside className="flex w-80 shrink-0 flex-col overflow-y-auto border-r border-slate-800 bg-slate-900">
      <section className="m-4 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-transparent p-4">
        <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-amber-300"><CalendarClock size={14} /> Recomendación de hoy</div>
        <p className="text-sm font-semibold text-white">{todayDef.title}</p>
        <p className="mt-1 text-xs leading-relaxed text-slate-400">
          En tus últimos {grid.length} posts hay {report.counts[report.next]} de «{CATEGORY_LABEL[report.next]}». Es lo que más equilibra tu feed ahora.
        </p>
        <button onClick={() => studio.create(todayFormat)} className="mt-3 flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-amber-400"><Plus size={14} /> Crear ahora</button>
      </section>

      <Section title="Clinical DNA" icon={<Stethoscope size={14} className="text-teal-400" />}>
        <div className="space-y-2.5">
          <div>
            <label className={label}>Analizar mi web (demo)</label>
            <div className="flex gap-1.5">
              <input className={input} placeholder="camilarojas.cl" value={url} onChange={(e) => setUrl(e.target.value.slice(0, 80))} onKeyDown={(e) => { if (e.key === "Enter" && url.trim()) { const d = deriveDNA(url, dna); studio.setDna(d); studio.setKit(recommendKit(d.approach).kit_id); } }} />
              <button disabled={!url.trim()} onClick={() => { const d = deriveDNA(url, dna); studio.setDna(d); studio.setKit(recommendKit(d.approach).kit_id); }} className="flex shrink-0 items-center gap-1 rounded-lg bg-slate-800 px-2.5 text-[11px] text-slate-200 hover:bg-slate-700 disabled:opacity-40"><Globe size={12} /> Deducir</button>
            </div>
            <p className="mt-1 text-[10px] text-slate-600">Propone nombre, enfoque y población desde la URL. No lee tu sitio: revísalo y ajústalo.</p>
          </div>
          <div><label className={label}>Nombre</label><input className={input} value={dna.name} onChange={(e) => set("name", e.target.value.slice(0, 40))} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className={label}>Instagram</label><input className={input} value={dna.handle} onChange={(e) => set("handle", e.target.value.slice(0, 30))} /></div>
            <div><label className={label}>Título</label><input className={input} value={dna.title} onChange={(e) => set("title", e.target.value.slice(0, 40))} /></div>
          </div>
          <div>
            <label className={label}>Enfoque clínico</label>
            <select className={input} value={dna.approach} onChange={(e) => set("approach", e.target.value as Approach)}>
              {APPROACHES.map((a) => <option key={a}>{a}</option>)}
            </select>
            {recKit.kit_id !== state.kit_id ? (
              <button onClick={() => studio.setKit(recKit.kit_id)} className="mt-1.5 text-[11px] text-sky-400 hover:text-sky-300">Kit sugerido para {dna.approach}: {recKit.name} → aplicar</button>
            ) : null}
          </div>
          <div><label className={label}>Población objetivo</label><input className={input} value={dna.target_population} onChange={(e) => set("target_population", e.target.value.slice(0, 80))} /></div>
          <div><label className={label}>Motivo de consulta recurrente</label><input className={input} value={dna.recurring_concern} onChange={(e) => set("recurring_concern", e.target.value.slice(0, 80))} /></div>
          <div>
            <label className={label}>Tono terapéutico</label>
            <div className="grid grid-cols-3 gap-1">
              {TONES.map((t) => (
                <button key={t.id} onClick={() => set("tone", t.id)} className={`rounded-lg px-1.5 py-1.5 text-[11px] leading-tight transition ${dna.tone === t.id ? "bg-sky-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}>{t.label}</button>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section title="Brand Kit protegido" icon={<ShieldCheck size={14} className="text-emerald-400" />}>
        <div className="grid grid-cols-2 gap-2">
          {BRAND_KITS.map((k) => {
            const ok = auditKit(k).every((c) => c.ok);
            const on = active.kit_id === k.kit_id;
            return (
              <button key={k.kit_id} onClick={() => studio.setKit(k.kit_id)} className={`rounded-xl border p-2.5 text-left transition ${on ? "border-sky-500 bg-sky-950/40" : "border-slate-800 bg-slate-900 hover:border-slate-600"}`}>
                <div className="flex gap-1">
                  {(["background", "surface", "primary", "accent"] as const).map((c) => <span key={c} className="h-4 w-4 rounded-full ring-1 ring-black/30" style={{ background: k.palette[c] }} />)}
                </div>
                <div className="mt-2 text-xs font-semibold text-slate-100" style={{ fontFamily: `"${k.fonts.heading}"` }}>{k.name}</div>
                <div className="text-[10px] text-slate-500">{k.archetype}</div>
                <div className={`mt-1 text-[10px] ${ok ? "text-emerald-400" : "text-amber-400"}`}>{ok ? "Contraste AA ✓" : "Revisar contraste"}</div>
              </button>
            );
          })}
        </div>
        <p className="mt-3 rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-[11px] leading-relaxed text-slate-400"><span className="font-medium text-sky-300">Voz del kit: </span>{KIT_BY_ID[active.kit_id].voice_prompt}</p>
        <p className="mt-2 text-[10px] text-slate-600">4 kits de muestra; el sistema está pensado para 20.</p>
      </Section>

      <Section title="Formatos clínicos" icon={<Plus size={14} className="text-sky-400" />}>
        <div className="space-y-1.5">
          {FORMATS.map((f) => (
            <button key={f.id} onClick={() => studio.create(f.id)} className={`flex w-full items-start justify-between rounded-xl border p-2.5 text-left transition ${active.format === f.id ? "border-teal-500/60 bg-teal-950/20" : "border-slate-800 hover:border-slate-600"}`}>
              <span>
                <span className="block text-xs font-medium text-slate-100">{f.title}</span>
                <span className="block text-[11px] leading-snug text-slate-500">{f.description}</span>
              </span>
              <Plus size={14} className="mt-0.5 shrink-0 text-slate-500" />
            </button>
          ))}
        </div>
      </Section>
    </aside>
  );
}
