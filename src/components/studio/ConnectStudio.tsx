import { useMemo, useState } from "react";
import { RotateCcw, Sparkles } from "lucide-react";
import { useStudio } from "../../lib/store";
import { hasBlocking, reviewPost } from "../../lib/ethics";
import { FORMAT_BY_ID } from "../../data/formats";
import { Sidebar } from "./Sidebar";
import { Stage } from "./Stage";
import { RightPanel } from "./RightPanel";
import { VariantsModal } from "./VariantsModal";
import { BeforeAfterModal } from "./BeforeAfterModal";
import { Teleprompter } from "./Teleprompter";

export function ConnectStudio() {
  const studio = useStudio();
  const { active } = studio;
  const [ai, setAi] = useState(false);
  const [beforeAfter, setBeforeAfter] = useState(false);
  const [prompter, setPrompter] = useState(false);
  const report = useMemo(() => reviewPost(active), [active]);

  return (
    <div className="flex h-full min-w-[1180px] flex-col bg-slate-950 text-slate-100">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-900/90 px-5">
        <div className="flex items-center gap-3">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-tr from-sky-500 to-teal-400 text-sm font-bold text-white">C</div>
          <div>
            <div className="text-sm font-semibold leading-tight text-white">Connect Clinical Studio</div>
            <div className="text-[11px] leading-tight text-slate-400">Contenido de marca con guardrails y ética clínica</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setBeforeAfter(true)} className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-300 hover:bg-amber-500/20"><Sparkles size={14} /> Antes vs. Después</button>
          <button onClick={() => { if (confirm("¿Volver a los datos de demostración? Se pierden tus cambios locales.")) studio.reset(); }} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-800 hover:text-white"><RotateCcw size={13} /> Reiniciar demo</button>
        </div>
      </header>
      <div className="flex min-h-0 flex-1">
        <Sidebar studio={studio} />
        <main className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_50%_0%,#111a33,transparent_60%)] px-6 py-6">
          <div className="mx-auto flex max-w-xl justify-center pr-16">
            <Stage key={active.id} studio={studio} blocked={hasBlocking(report)} onAI={() => setAi(true)} />
          </div>
        </main>
        <RightPanel studio={studio} report={report} onAI={() => setAi(true)} onTeleprompter={() => setPrompter(true)} />
      </div>
      {ai ? <VariantsModal studio={studio} onClose={() => setAi(false)} /> : null}
      {beforeAfter ? <BeforeAfterModal studio={studio} onClose={() => setBeforeAfter(false)} /> : null}
      {prompter ? <Teleprompter def={FORMAT_BY_ID[active.format]} fields={active.fields} onClose={() => setPrompter(false)} /> : null}
    </div>
  );
}
