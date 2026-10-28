import { useEffect, useState } from "react";
import { Loader2, Sparkles, X } from "lucide-react";
import type { Fields } from "../../types/studio";
import type { Studio } from "../../lib/store";
import { KIT_BY_ID } from "../../data/kits";
import { FORMAT_BY_ID } from "../../data/formats";
import { generateVariants } from "../../lib/copy";
import type { VariantsResult } from "../../lib/copy";

export function VariantsModal({ studio, onClose }: { studio: Studio; onClose: () => void }) {
  const { active, state } = studio;
  const def = FORMAT_BY_ID[active.format];
  const kit = KIT_BY_ID[active.kit_id];
  const [result, setResult] = useState<VariantsResult | null>(null);
  const [round, setRound] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setResult(null);
    void generateVariants(def, state.dna, kit, active.fields).then((r) => {
      if (!cancelled) setResult(r);
    });
    return () => {
      cancelled = true;
    };
    // `active.fields` se lee al abrir/regenerar; no queremos relanzar la IA en cada tecla.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);

  const use = (v: Fields) => {
    studio.setFields({ ...active.fields, ...v });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="fade-up max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-700 bg-slate-900 p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-1 flex items-start justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-white"><Sparkles size={18} className="text-amber-300" /> IA clínica · {def.title}</h2>
            <p className="mt-1 text-xs text-slate-400">Voz del kit «{kit.name}»: {kit.voice_prompt}</p>
          </div>
          <button onClick={onClose} className="rounded-full bg-slate-800 p-2 text-slate-400 hover:text-white"><X size={16} /></button>
        </div>
        {!result ? (
          <p className="flex items-center gap-2 py-10 text-sm text-slate-400"><Loader2 size={16} className="animate-spin" /> Escribiendo variantes…</p>
        ) : (
          <>
            <p className="mb-3 mt-4 text-[11px] text-slate-500">
              {result.source === "ia" ? "Generado con IA (Gemini) respetando reglas éticas y la voz del kit." : "Banco local de ejemplos (la IA se activa en el deploy con GEMINI_API_KEY)."} Revisa siempre antes de publicar.
            </p>
            <div className="space-y-3">
              {result.variants.map((v, i) => (
                <div key={i} className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <dl className="space-y-1.5 text-xs">
                    {def.fields.map((f) => (v[f.key] ? <div key={f.key}><dt className="text-[10px] uppercase tracking-wide text-slate-500">{f.label}</dt><dd className="text-slate-200">{v[f.key]}</dd></div> : null))}
                  </dl>
                  <button onClick={() => use(v)} className="mt-3 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-500">Usar esta variante</button>
                </div>
              ))}
            </div>
            <button onClick={() => setRound((r) => r + 1)} className="mt-4 text-xs text-sky-400 hover:text-sky-300">Generar otras</button>
          </>
        )}
      </div>
    </div>
  );
}
