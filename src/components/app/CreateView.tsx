import { useMemo, useState } from "react";
import { ArrowLeft, ImagePlus, Video } from "lucide-react";
import type { FormatId } from "../../types/studio";
import type { Studio } from "../../lib/store";
import { makePost } from "../../lib/store";
import { FORMATS, FORMAT_BY_ID } from "../../data/formats";
import { recommendFormat } from "../../lib/harmony";
import { fieldsForTopic } from "../../lib/planner";
import { hasBlocking, reviewPost } from "../../lib/ethics";
import { Stage } from "../studio/Stage";
import { RightPanel } from "../studio/RightPanel";
import { VariantsModal } from "../studio/VariantsModal";
import { Teleprompter } from "../studio/Teleprompter";
import { Card, Chip, FitThumb, inputCls } from "./ui";

export type CreateStep = "pick" | "edit";

export function CreateView({ studio, step, setStep }: { studio: Studio; step: CreateStep; setStep: (s: CreateStep) => void }) {
  return step === "pick" ? <Pick studio={studio} setStep={setStep} /> : <Edit studio={studio} back={() => setStep("pick")} />;
}

/* ───────── Paso 1: elegir formato ───────── */
function Pick({ studio, setStep }: { studio: Studio; setStep: (s: CreateStep) => void }) {
  const { state } = studio;
  const [topic, setTopic] = useState("");
  const [mode, setMode] = useState<"imagen" | "video">("imagen");
  const rec = useMemo(() => recommendFormat(state.posts).format, [state.posts]);
  const t = topic.trim();
  const list = FORMATS.filter((f) => (mode === "video") === (f.category === "video"));
  const pick = (id: FormatId) => {
    studio.create(id, t ? fieldsForTopic(id, t, state.dna, state.posts) : undefined, t ? { topic: t, status: "borrador" } : { status: "borrador" });
    setStep("edit");
  };
  return (
    <div className="fade-up">
      <p className="text-[11px] font-bold tracking-widest text-slate-500">PASO 1 DE 2</p>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold md:text-3xl">Crea tu publicación</h1>
        <div className="flex rounded-2xl border border-slate-200 bg-white p-1">
          <button onClick={() => setMode("imagen")} className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold ${mode === "imagen" ? "bg-brand text-white" : "text-slate-600"}`}><ImagePlus size={16} />Imagen</button>
          <button onClick={() => setMode("video")} className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold ${mode === "video" ? "bg-brand text-white" : "text-slate-600"}`}><Video size={16} />Video</button>
        </div>
      </div>
      <Card className="mb-5">
        <label className="mb-1 block text-sm font-bold">¿De qué quieres hablar? <span className="font-normal text-slate-500">(opcional, rellenamos el formato con tu tema)</span></label>
        <input className={inputCls} value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Ej. Cómo manejar la ansiedad social" />
      </Card>
      <p className="mb-3 text-sm text-slate-500">Elige un formato y lo generamos al instante. Todos usan tu kit de marca y pasan por la revisión ética.</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {list.map((f) => {
          const post = makePost(f.id, state.kit_id, fieldsForTopic(f.id, t || "Un tema que te importa", state.dna, []), "feed-portrait");
          return (
            <button key={f.id} onClick={() => pick(f.id)} className="group relative rounded-3xl border border-slate-200 bg-white p-3 text-left transition hover:-translate-y-0.5 hover:border-brand hover:shadow-lg">
              {f.id === rec && <span className="absolute right-4 top-4 z-10"><Chip>Recomendada</Chip></span>}
              <div className="pointer-events-none"><FitThumb post={post} studio={studio} /></div>
              <p className="mt-3 text-center text-sm font-extrabold">{f.title}</p>
              <p className="text-center text-xs text-slate-500">{f.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ───────── Paso 2: editar, revisar y exportar ───────── */
function Edit({ studio, back }: { studio: Studio; back: () => void }) {
  const { active } = studio;
  const [ai, setAi] = useState(false);
  const [prompter, setPrompter] = useState(false);
  const report = useMemo(() => reviewPost(active), [active]);
  return (
    <div className="fade-up">
      <p className="text-[11px] font-bold tracking-widest text-slate-500">PASO 2 DE 2</p>
      <div className="mb-5 flex items-center gap-3">
        <button aria-label="Volver" onClick={back} className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white hover:bg-slate-50"><ArrowLeft size={18} /></button>
        <h1 className="text-2xl font-extrabold">{FORMAT_BY_ID[active.format].title}</h1>
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex justify-center rounded-3xl bg-slate-50 py-6 pr-16 ring-1 ring-slate-200/70 xl:self-start">
          <Stage key={active.id} studio={studio} blocked={hasBlocking(report)} onAI={() => setAi(true)} />
        </div>
        <RightPanel studio={studio} report={report} onAI={() => setAi(true)} onTeleprompter={() => setPrompter(true)} />
      </div>
      {ai ? <VariantsModal studio={studio} onClose={() => setAi(false)} /> : null}
      {prompter ? <Teleprompter def={FORMAT_BY_ID[active.format]} fields={active.fields} onClose={() => setPrompter(false)} /> : null}
    </div>
  );
}
