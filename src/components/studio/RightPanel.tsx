import { useMemo, useState } from "react";
import { AlertTriangle, ArrowLeft, ArrowRight, CalendarDays, CheckCircle2, ClipboardCopy, FileDown, LayoutGrid, Loader2, MonitorPlay, Plus, RefreshCw, ShieldCheck, Sparkles, XCircle } from "lucide-react";
import type { Studio } from "../../lib/store";
import { KIT_BY_ID } from "../../data/kits";
import { FORMAT_BY_ID } from "../../data/formats";
import type { EthicsReport } from "../../lib/ethics";
import { analyzeFeed, categoryOf, CATEGORY_LABEL } from "../../lib/harmony";
import { Thumb } from "./SlideSurface";
import { buildPlan, fieldsForTopic, nextWeekday, PILLARS, todayISO } from "../../lib/planner";
import { generateCaption } from "../../lib/copy";
import type { PostStatus } from "../../types/studio";

type Tab = "contenido" | "etica" | "feed" | "plan";

const WORDS_PER_SECOND = 2.4;
export const seconds = (text: string): number => Math.round(text.trim().split(/\s+/).filter(Boolean).length / WORDS_PER_SECOND);

interface Props {
  studio: Studio;
  report: EthicsReport;
  onAI: () => void;
  onTeleprompter: () => void;
}

export function RightPanel({ studio, report, onAI, onTeleprompter }: Props) {
  const [tab, setTab] = useState<Tab>("contenido");
  const errors = report.issues.filter((i) => i.severity === "error").length;
  const tabBtn = (id: Tab, label: string, badge?: React.ReactNode) => (
    <button onClick={() => setTab(id)} className={`flex flex-1 items-center justify-center gap-1.5 border-b-2 px-2 py-3 text-xs font-medium transition ${tab === id ? "border-sky-500 text-white" : "border-transparent text-slate-500 hover:text-slate-300"}`}>
      {label}{badge}
    </button>
  );
  return (
    <aside className="flex w-[22rem] shrink-0 flex-col border-l border-slate-800 bg-slate-900">
      <div className="flex border-b border-slate-800">
        {tabBtn("contenido", "Contenido")}
        {tabBtn("etica", "Ética", errors ? <span className="rounded-full bg-rose-500 px-1.5 text-[10px] text-white">{errors}</span> : report.issues.length ? <span className="rounded-full bg-amber-500 px-1.5 text-[10px] text-slate-950">{report.issues.length}</span> : <CheckCircle2 size={13} className="text-emerald-400" />)}
        {tabBtn("feed", "Feed 3×3")}
        {tabBtn("plan", "Plan")}
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {tab === "contenido" ? <ContentForm studio={studio} onAI={onAI} onTeleprompter={onTeleprompter} /> : null}
        {tab === "etica" ? <EthicsPanel report={report} /> : null}
        {tab === "feed" ? <FeedHarmonizer studio={studio} /> : null}
        {tab === "plan" ? <PlanPanel studio={studio} onOpen={() => setTab("contenido")} /> : null}
      </div>
    </aside>
  );
}

function ContentForm({ studio, onAI, onTeleprompter }: { studio: Studio; onAI: () => void; onTeleprompter: () => void }) {
  const { active } = studio;
  const def = FORMAT_BY_ID[active.format];
  const isScript = active.format === "guion-reel";
  const total = isScript ? def.fields.reduce((n, f) => n + seconds(active.fields[f.key] ?? ""), 0) : 0;
  const [busy, setBusy] = useState(false);
  const [capSource, setCapSource] = useState<"ia" | "local" | null>(null);
  const makeCaption = async () => {
    setBusy(true);
    const r = await generateCaption(def, studio.state.dna, KIT_BY_ID[active.kit_id], active.fields, active.topic ?? "");
    studio.patchActive({ caption: r.caption.slice(0, 600) });
    setCapSource(r.source);
    setBusy(false);
  };
  const scriptText = def.fields.map((f) => `${f.label.toUpperCase()}\n${active.fields[f.key] ?? ""}`).join("\n\n");
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">{def.title}</h3>
        <button onClick={onAI} className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-xs font-medium text-amber-300 hover:bg-amber-500/20"><Sparkles size={13} /> Variantes</button>
      </div>
      {def.fields.map((f) => {
        const value = active.fields[f.key] ?? "";
        const sec = isScript ? seconds(value) : 0;
        return (
          <div key={f.key}>
            <div className="mb-1 flex items-baseline justify-between">
              <label className="text-xs font-medium text-slate-300">{f.label}</label>
              <span className={`text-[10px] ${value.length > f.max * 0.92 ? "text-amber-400" : "text-slate-600"}`}>{isScript ? `~${sec}s · ` : ""}{value.length}/{f.max}</span>
            </div>
            {f.multiline ? (
              <textarea value={value} rows={isScript ? 4 : 3} onChange={(e) => studio.setFields({ ...active.fields, [f.key]: e.target.value.slice(0, f.max) })} className="w-full resize-none rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-2 text-xs leading-relaxed text-slate-100 outline-none focus:border-sky-500" />
            ) : (
              <input value={value} onChange={(e) => studio.setFields({ ...active.fields, [f.key]: e.target.value.slice(0, f.max) })} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-2 text-xs text-slate-100 outline-none focus:border-sky-500" />
            )}
            {f.hint ? <p className="mt-1 text-[10px] text-slate-500">{f.hint}</p> : null}
          </div>
        );
      })}
      {def.caution ? <p className="rounded-lg border border-amber-500/30 bg-amber-950/20 p-2.5 text-[11px] leading-relaxed text-amber-200">{def.caution}</p> : null}
      <div className="space-y-3 border-t border-slate-800 pt-4">
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="text-xs font-medium text-slate-300">Descripción de Instagram</label>
            <button onClick={() => void makeCaption()} disabled={busy} className="flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300 disabled:opacity-50">{busy ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} Generar</button>
          </div>
          <textarea value={active.caption ?? ""} rows={5} maxLength={600} onChange={(e) => studio.patchActive({ caption: e.target.value })} placeholder="Texto que acompaña la publicación…" className="w-full resize-none rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-2 text-xs leading-relaxed text-slate-100 outline-none focus:border-sky-500" />
          <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
            <span>{capSource === "local" ? "Texto base (sin IA configurada). " : capSource === "ia" ? "Generado con IA; revísalo. " : ""}Se revisa en la pestaña Ética.</span>
            <button disabled={!active.caption} onClick={() => void navigator.clipboard.writeText(active.caption ?? "")} className="flex items-center gap-1 hover:text-slate-300 disabled:opacity-30"><ClipboardCopy size={11} /> Copiar</button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-300">Estado</label>
            <select value={active.status ?? "borrador"} onChange={(e) => studio.patchActive({ status: e.target.value as PostStatus })} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-slate-100 outline-none focus:border-sky-500">
              <option value="borrador">Borrador</option><option value="programado">Programado</option><option value="publicado">Publicado</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-300">Fecha</label>
            <input type="date" value={active.scheduledAt ?? ""} onChange={(e) => studio.patchActive({ scheduledAt: e.target.value || undefined })} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-slate-100 outline-none focus:border-sky-500 [color-scheme:dark]" />
          </div>
        </div>
      </div>
      {isScript ? (
        <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-950 p-3">
          <p className={`text-xs ${total >= 30 && total <= 60 ? "text-emerald-400" : "text-amber-300"}`}>Duración estimada: ~{total}s {total > 60 ? "(largo para un reel: apunta a 30–60 s)" : total < 30 ? "(corto: puedes profundizar)" : "(ideal)"}</p>
          <button onClick={onTeleprompter} className="flex w-full items-center justify-center gap-2 rounded-lg bg-sky-600 py-2 text-xs font-semibold text-white hover:bg-sky-500"><MonitorPlay size={14} /> Abrir teleprompter</button>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => void navigator.clipboard.writeText(scriptText)} className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-700 py-1.5 text-xs text-slate-200 hover:bg-slate-800"><ClipboardCopy size={13} /> Copiar</button>
            <button onClick={() => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([scriptText], { type: "text/plain" })); a.download = "guion-reel.txt"; a.click(); URL.revokeObjectURL(a.href); }} className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-700 py-1.5 text-xs text-slate-200 hover:bg-slate-800"><FileDown size={13} /> .txt</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function EthicsPanel({ report }: { report: EthicsReport }) {
  return (
    <div className="space-y-3">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-white"><ShieldCheck size={16} className="text-emerald-400" /> Revisión ética</h3>
      {report.issues.map((i, n) => (
        <div key={n} className={`rounded-xl border p-3 text-xs ${i.severity === "error" ? "border-rose-500/40 bg-rose-950/30 text-rose-100" : "border-amber-500/40 bg-amber-950/20 text-amber-100"}`}>
          <div className="mb-1 flex items-center gap-1.5 font-semibold">{i.severity === "error" ? <XCircle size={14} /> : <AlertTriangle size={14} />}{i.where}: «{i.excerpt}»</div>
          <p className="opacity-90">{i.message}</p>
        </div>
      ))}
      {report.passed.length ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3">
          <ul className="space-y-1.5 text-xs text-emerald-100">
            {report.passed.map((p) => <li key={p.id} className="flex gap-1.5"><CheckCircle2 size={14} className="mt-px shrink-0 text-emerald-400" />{p.label}</li>)}
          </ul>
        </div>
      ) : null}
      <p className="text-[11px] leading-relaxed text-slate-500">Son heurísticas editoriales sobre el texto, no asesoría legal ni reemplazan el código de ética de tu colegio profesional. Los errores bloquean la exportación.</p>
    </div>
  );
}

function FeedHarmonizer({ studio }: { studio: Studio }) {
  const { state, active } = studio;
  const report = useMemo(() => analyzeFeed(state.posts), [state.posts]);
  const grid = state.posts.slice(0, 9);
  const flagged = new Set(report.issues.flatMap((i) => i.cells));
  const mixed = new Set(grid.map((p) => p.kit_id)).size > 1;
  const color = report.score >= 80 ? "text-emerald-400" : report.score >= 55 ? "text-amber-300" : "text-rose-400";
  const idx = state.posts.findIndex((p) => p.id === active.id);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-white"><LayoutGrid size={16} className="text-sky-400" /> Live Feed Harmonizer</h3>
        <span className={`text-xl font-bold ${color}`}>{report.score}<span className="text-xs text-slate-500">/100</span></span>
      </div>
      <div className="rounded-xl border border-slate-800 bg-slate-950 p-2">
        <div className="grid grid-cols-3 gap-1">
          {Array.from({ length: 9 }, (_, i) => {
            const post = grid[i];
            if (!post) return <div key={i} className="grid aspect-square place-items-center rounded-md border border-dashed border-slate-800 text-center text-[9px] text-slate-600">{i === grid.length ? `Siguiente: ${CATEGORY_LABEL[report.next]}` : ""}</div>;
            const on = post.id === active.id;
            return (
              <button key={post.id} onClick={() => studio.select(post.id)} className={`group relative aspect-square overflow-hidden rounded-md ring-2 transition ${on ? "ring-sky-400" : flagged.has(i) ? "ring-amber-500/80" : "ring-transparent hover:ring-slate-600"}`}>
                <div className="absolute inset-0 grid place-items-center overflow-hidden"><Thumb post={post} kit={KIT_BY_ID[post.kit_id]} dna={state.dna} width={post.ratio === "feed-portrait" ? 98 : post.ratio === "story" ? 98 : 98} /></div>
                <span className="absolute left-1 top-1 rounded bg-black/60 px-1 text-[8px] text-white">{CATEGORY_LABEL[categoryOf(post)]}</span>
              </button>
            );
          })}
        </div>
        <p className="mt-1.5 text-center text-[10px] text-slate-600">Instagram recorta al centro: lo que ves es lo que verá tu perfil.</p>
      </div>
      {idx >= 0 && idx < 9 ? (
        <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
          Posición {idx + 1}
          <button disabled={idx === 0} onClick={() => studio.move(active.id, -1)} className="rounded-md bg-slate-800 p-1.5 hover:bg-slate-700 disabled:opacity-30"><ArrowLeft size={13} /></button>
          <button disabled={idx === state.posts.length - 1} onClick={() => studio.move(active.id, 1)} className="rounded-md bg-slate-800 p-1.5 hover:bg-slate-700 disabled:opacity-30"><ArrowRight size={13} /></button>
        </div>
      ) : null}
      <div className="grid grid-cols-4 gap-1.5 text-center text-[10px] text-slate-400">
        {(Object.keys(report.counts) as (keyof typeof report.counts)[]).map((c) => <div key={c} className="rounded-lg bg-slate-800/70 py-1.5"><div className="text-sm font-semibold text-slate-100">{report.counts[c]}</div>{CATEGORY_LABEL[c]}</div>)}
      </div>
      <div className="space-y-2">
        {report.issues.length === 0 ? <p className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3 text-xs text-emerald-200"><CheckCircle2 size={14} /> Ritmo y marca coherentes.</p> : null}
        {report.issues.map((i, n) => <p key={n} className={`flex gap-1.5 rounded-xl border p-3 text-xs ${i.severity === "error" ? "border-rose-500/40 bg-rose-950/30 text-rose-100" : "border-amber-500/40 bg-amber-950/20 text-amber-100"}`}><AlertTriangle size={14} className="mt-px shrink-0" />{i.message}</p>)}
        {mixed ? <button onClick={studio.unifyKit} className="w-full rounded-lg bg-sky-600 py-2 text-xs font-semibold text-white hover:bg-sky-500">Unificar todo con «{KIT_BY_ID[state.kit_id].name}»</button> : null}
      </div>
    </div>
  );
}


const STATUS_STYLE: Record<PostStatus, string> = {
  borrador: "bg-slate-700/60 text-slate-300",
  programado: "bg-sky-500/20 text-sky-300",
  publicado: "bg-emerald-500/20 text-emerald-300",
};

const fmtDate = (iso: string): string => new Date(`${iso}T12:00:00`).toLocaleDateString("es-CL", { weekday: "short", day: "numeric", month: "short" });

function PlanPanel({ studio, onOpen }: { studio: Studio; onOpen: () => void }) {
  const { state } = studio;
  const plan = useMemo(() => buildPlan(state.planRound), [state.planRound]);
  const byPlan = new Map(state.posts.filter((p) => p.planId).map((p) => [p.planId!, p]));
  const scheduled = state.posts.filter((p) => p.scheduledAt).sort((a, b) => a.scheduledAt!.localeCompare(b.scheduledAt!));
  const today = todayISO();
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-white"><CalendarDays size={16} className="text-amber-300" /> Plan semanal</h3>
        <button onClick={studio.nextRound} className="flex items-center gap-1.5 rounded-lg border border-slate-700 px-2 py-1 text-[11px] text-slate-300 hover:bg-slate-800"><RefreshCw size={12} /> Otra semana</button>
      </div>
      <p className="text-[11px] leading-relaxed text-slate-500">7 ideas equilibradas entre educar, desmitificar y dar señales. «Crear» arma la pieza con el formato sugerido, queda programada para su día y se revisa con la ética igual que el resto.</p>
      <ul className="space-y-2">
        {plan.map((idea) => {
          const made = byPlan.get(idea.id);
          const def = FORMAT_BY_ID[idea.format];
          return (
            <li key={idea.id} className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
              <div className="mb-1 flex items-center justify-between text-[10px]">
                <span className="font-semibold uppercase tracking-wide text-slate-400">{idea.day}</span>
                <span className={`rounded-full px-2 py-0.5 ${PILLARS[idea.pillar].chip}`}>{PILLARS[idea.pillar].label}</span>
              </div>
              <p className="text-xs font-medium leading-snug text-slate-100">{idea.topic}</p>
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="text-[10px] text-slate-500">{def.title}</span>
                {made ? (
                  <button onClick={() => { studio.select(made.id); onOpen(); }} className="rounded-md bg-slate-800 px-2 py-1 text-[11px] text-slate-200 hover:bg-slate-700">Abrir</button>
                ) : (
                  <button onClick={() => { studio.create(idea.format, fieldsForTopic(idea.format, idea.topic, state.dna, state.posts), { topic: idea.topic, pillar: idea.pillar, planId: idea.id, status: "programado", scheduledAt: nextWeekday(idea.weekday) }); onOpen(); }} className="flex items-center gap-1 rounded-md bg-amber-500 px-2 py-1 text-[11px] font-semibold text-slate-950 hover:bg-amber-400"><Plus size={12} /> Crear</button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <div>
        <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Calendario ({scheduled.length})</h4>
        {scheduled.length === 0 ? <p className="text-xs text-slate-600">Aún no hay piezas con fecha.</p> : (
          <ul className="space-y-1">
            {scheduled.map((p) => (
              <li key={p.id}>
                <button onClick={() => { studio.select(p.id); onOpen(); }} className={`flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-xs hover:bg-slate-800 ${p.id === studio.active.id ? "bg-slate-800" : ""}`}>
                  <span className="min-w-0"><span className={`mr-1.5 ${p.scheduledAt! < today && p.status !== "publicado" ? "text-rose-400" : "text-slate-400"}`}>{fmtDate(p.scheduledAt!)}</span><span className="truncate text-slate-200">{FORMAT_BY_ID[p.format].title}</span></span>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] ${STATUS_STYLE[p.status ?? "borrador"]}`}>{p.status ?? "borrador"}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
