import { useState } from "react";
import { Globe, RotateCcw, ShieldCheck, Wand2 } from "lucide-react";
import type { Approach, ClinicalDNA, TherapeuticTone } from "../../types/studio";
import type { Studio } from "../../lib/store";
import { makePost } from "../../lib/store";
import { BRAND_KITS, KIT_BY_ID, recommendKit } from "../../data/kits";
import { auditKit } from "../../lib/color";
import { deriveDNA } from "../../lib/planner";
import { Btn, Card, FitThumb, inputCls, PageTitle } from "./ui";

const APPROACHES: Approach[] = ["TCC", "Humanista", "Sistémico", "Psicoanálisis", "Somático / Mindfulness", "Integrativo"];
const TONES: { id: TherapeuticTone; label: string; hint: string }[] = [
  { id: "calido", label: "Cálido", hint: "Cercano y empático" },
  { id: "estructurado", label: "Estructurado", hint: "Claro y ordenado" },
  { id: "reflexivo", label: "Reflexivo", hint: "Pausado y profundo" },
];

export function BrandView({ studio }: { studio: Studio }) {
  const { state } = studio;
  const dna = state.dna;
  const [url, setUrl] = useState("");
  const set = <K extends keyof ClinicalDNA>(k: K, v: ClinicalDNA[K]) => studio.setDna({ ...dna, [k]: v });
  const text = (k: "name" | "handle" | "title" | "target_population" | "recurring_concern", label: string, max = 80) => (
    <div><label className="mb-1 block text-xs font-bold text-slate-600">{label}</label><input className={inputCls} value={dna[k]} onChange={(e) => set(k, e.target.value.slice(0, max))} /></div>
  );
  const analyze = () => { const d = deriveDNA(url, dna); studio.setDna(d); studio.setKit(recommendKit(d.approach).kit_id); };
  const rec = recommendKit(dna.approach);
  const sample = makePost("frase-validacion", state.kit_id, { frase: "Así se verán tus publicaciones", apoyo: dna.name });
  return (
    <div className="fade-up">
      <PageTitle title="Brand DNA" subtitle="La IA y los kits usan esto para que cada publicación suene y se vea como tú." />
      <div className="grid gap-5 lg:grid-cols-[1fr_minmax(0,360px)]">
        <div className="space-y-5">
          <Card>
            <h2 className="mb-1 flex items-center gap-2 text-sm font-extrabold"><Wand2 size={16} /> Analizar mi sitio o Instagram</h2>
            <p className="mb-3 text-xs text-slate-500">Pega tu URL y armamos tu ADN. En esta demo el análisis es simulado: no sale de tu navegador.</p>
            <div className="flex gap-2">
              <div className="relative flex-1"><Globe size={15} className="absolute left-3 top-3.5 text-slate-400" /><input className={`${inputCls} !pl-9`} placeholder="tupsicologa.cl" value={url} onChange={(e) => setUrl(e.target.value.slice(0, 80))} onKeyDown={(e) => e.key === "Enter" && url.trim().length > 2 && analyze()} /></div>
              <Btn disabled={url.trim().length < 3} onClick={analyze}>Analizar</Btn>
            </div>
          </Card>

          <Card className="space-y-4">
            <h2 className="text-sm font-extrabold">Tu identidad clínica</h2>
            <div className="grid gap-3 sm:grid-cols-2">{text("name", "Nombre", 40)}{text("handle", "Usuario de Instagram", 30)}{text("title", "Título", 40)}
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-600">Enfoque clínico</label>
                <select className={inputCls} value={dna.approach} onChange={(e) => set("approach", e.target.value as Approach)}>{APPROACHES.map((a) => <option key={a}>{a}</option>)}</select>
              </div>
            </div>
            {text("target_population", "A quién te diriges")}
            {text("recurring_concern", "Motivo de consulta más frecuente")}
            <div>
              <p className="mb-2 text-xs font-bold text-slate-600">Tono de voz</p>
              <div className="grid grid-cols-3 gap-2">
                {TONES.map((t) => <button key={t.id} onClick={() => set("tone", t.id)} className={`rounded-2xl border px-3 py-2 text-left ${dna.tone === t.id ? "border-brand bg-soft" : "border-slate-200"}`}><span className="block text-sm font-bold">{t.label}</span><span className="text-[11px] text-slate-500">{t.hint}</span></button>)}
              </div>
            </div>
          </Card>

          <Card className="space-y-3">
            <h2 className="flex items-center gap-2 text-sm font-extrabold"><ShieldCheck size={16} className="text-emerald-600" /> Kit de marca protegido</h2>
            <p className="text-xs text-slate-500">Paleta cerrada de 4 colores y tipografías curadas: no se puede romper el contraste (AA) al editar.</p>
            {rec.kit_id !== state.kit_id && <button onClick={() => studio.setKit(rec.kit_id)} className="text-xs font-bold text-brand underline">Kit sugerido para {dna.approach}: {rec.name} → aplicar</button>}
            <div className="grid gap-2 sm:grid-cols-2">
              {BRAND_KITS.map((k) => {
                const ok = auditKit(k).every((c) => c.ok);
                return (
                  <button key={k.kit_id} onClick={() => studio.setKit(k.kit_id)} className={`rounded-2xl border p-3 text-left transition ${state.kit_id === k.kit_id ? "border-brand bg-soft" : "border-slate-200 hover:border-slate-400"}`}>
                    <span className="flex -space-x-1.5">{(["background", "surface", "primary", "accent"] as const).map((c) => <i key={c} className="h-5 w-5 rounded-full ring-2 ring-white" style={{ background: k.palette[c] }} />)}</span>
                    <span className="mt-2 block text-sm font-bold" style={{ fontFamily: `"${k.fonts.heading}"` }}>{k.name}</span>
                    <span className="block text-[11px] text-slate-500">{k.archetype}</span>
                    <span className={`mt-1 block text-[11px] font-bold ${ok ? "text-emerald-600" : "text-amber-600"}`}>{ok ? "Contraste AA ✓" : "Revisar contraste"}</span>
                  </button>
                );
              })}
            </div>
            <p className="rounded-2xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-600 ring-1 ring-slate-200"><b className="text-brand">Voz del kit: </b>{KIT_BY_ID[state.kit_id].voice_prompt}</p>
            <button onClick={studio.unifyKit} className="text-xs font-semibold text-slate-500 underline">Aplicar este kit a todos mis posts</button>
            <button onClick={() => confirm("¿Volver a los datos de demostración? Se pierden tus cambios locales.") && studio.reset()} className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"><RotateCcw size={13} /> Volver al ejemplo</button>
          </Card>
        </div>
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <p className="mb-2 text-[11px] font-bold tracking-widest text-slate-500">VISTA PREVIA</p>
          <FitThumb post={sample} studio={studio} />
        </aside>
      </div>
    </div>
  );
}
