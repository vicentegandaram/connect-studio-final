import { useMemo, useState } from "react";
import { Frown, Smile, X } from "lucide-react";
import type { Studio } from "../../lib/store";
import { makePost, nextVariant } from "../../lib/store";
import { KIT_BY_ID } from "../../data/kits";
import type { FormatId, Post } from "../../types/studio";
import { Thumb } from "./SlideSurface";

// Cada celda del "antes" imita errores típicos: fuentes de sistema, colores chillones, texto ilegible.
const CHAOS: { bg: string; fg: string; font: string; rot: number; text: string }[] = [
  { bg: "#facc15", fg: "#ffffff", font: "'Comic Sans MS', cursive", rot: -3, text: "TE CURO LA ANSIEDAD 100%" },
  { bg: "#7e22ce", fg: "#a5b4fc", font: "Impact, sans-serif", rot: 2, text: "foto borrosa con filtro" },
  { bg: "#dc2626", fg: "#fde047", font: "'Courier New', monospace", rot: -2, text: "¡50% DCTO PRIMERA SESIÓN!!!" },
  { bg: "#93c5fd", fg: "#bfdbfe", font: "Georgia, serif", rot: 3, text: "frase que casi no se lee" },
  { bg: "#10b981", fg: "#ffffff", font: "Papyrus, fantasy", rot: -4, text: "meme fuera de tono 😂" },
  { bg: "#374151", fg: "#9ca3af", font: "Arial, sans-serif", rot: 1, text: "AVISO: horario cambió" },
  { bg: "#f472b6", fg: "#ffffff", font: "'Brush Script MT', cursive", rot: -1, text: "Testimonio de mi paciente ❤" },
  { bg: "#fb923c", fg: "#fff7ed", font: "Impact, sans-serif", rot: 4, text: "ÚLTIMOS CUPOS HOY" },
  { bg: "#1e293b", fg: "#475569", font: "Verdana, sans-serif", rot: -3, text: "texto gris sobre oscuro" },
];
const FORMAT_ROTATION: FormatId[] = ["frase-validacion", "mito-realidad", "carrusel-psicoeducativo", "guion-reel", "frase-validacion", "disponibilidad", "mito-realidad", "carrusel-psicoeducativo", "frase-validacion"];

export function BeforeAfterModal({ studio, onClose }: { studio: Studio; onClose: () => void }) {
  const [after, setAfter] = useState(false);
  const { state } = studio;
  const kit = KIT_BY_ID[state.kit_id];
  // Si el feed real tiene menos de 9 posts, se completa con ejemplos (solo en memoria).
  const demo = useMemo(() => {
    const out: Post[] = [];
    const base = state.posts.slice(0, 9).map((p) => ({ ...p, kit_id: state.kit_id }));
    for (let i = base.length; i < 9; i++) out.push(makePost(FORMAT_ROTATION[i]!, state.kit_id, nextVariant(FORMAT_ROTATION[i]!, [...base, ...out], state.dna.recurring_concern)));
    return [...base, ...out];
  }, [state.posts, state.kit_id, state.dna.recurring_concern]);

  const metrics = after
    ? [["Colores", "4 del kit"], ["Tipografías", "2 curadas"], ["Contraste AA", "100%"], ["Promesas / testimonios", "0 (bloqueado)"]]
    : [["Colores", "9+ sin criterio"], ["Tipografías", "7 distintas"], ["Contraste AA", "≈ 20%"], ["Promesas / testimonios", "3 en 9 posts"]];

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="fade-up max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-slate-300 bg-white p-6 md:p-8" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="float-right rounded-full bg-slate-100 p-2 text-slate-500 hover:text-slate-900"><X size={16} /></button>
        <p className="text-center text-xs font-semibold uppercase tracking-wider text-amber-800">La promesa de valor</p>
        <h2 className="mt-1 text-center text-2xl font-bold text-slate-900">Del feed caótico al feed que inspira confianza</h2>
        <p className="mx-auto mt-2 max-w-lg text-center text-sm text-slate-500">Sin lienzo en blanco: kit cerrado, formatos clínicos y revisión ética. Ejemplo ilustrativo con tu marca actual ({kit.name}).</p>

        <div className="my-6 flex items-center justify-center gap-4">
          <div className={`flex items-center gap-2 text-sm font-semibold transition ${after ? "text-slate-400" : "text-rose-600"}`}><Frown size={30} /> Antes</div>
          <button onClick={() => setAfter(!after)} role="switch" aria-checked={after} className={`relative h-9 w-20 rounded-full transition ${after ? "bg-emerald-500" : "bg-rose-600"}`}>
            <span className={`absolute top-1 h-7 w-7 rounded-full bg-white shadow transition-all ${after ? "left-12" : "left-1"}`} />
          </button>
          <div className={`flex items-center gap-2 text-sm font-semibold transition ${after ? "text-emerald-800" : "text-slate-400"}`}>Después <Smile size={30} /></div>
        </div>

        <div className={`mx-auto grid max-w-md grid-cols-3 gap-1.5 rounded-2xl border p-2 transition-colors ${after ? "border-emerald-500/40 bg-slate-50" : "border-rose-200 bg-slate-50"}`}>
          {demo.map((post, i) => {
            const c = CHAOS[i]!;
            return (
              <div key={post.id + i} className="relative aspect-square overflow-hidden rounded-md">
                <div className="absolute inset-0 grid place-items-center p-2 text-center text-[11px] font-bold leading-tight transition-opacity duration-500" style={{ background: c.bg, color: c.fg, fontFamily: c.font, transform: `rotate(${c.rot}deg) scale(1.1)`, opacity: after ? 0 : 1 }}>{c.text}</div>
                <div className="absolute inset-0 transition-opacity duration-500" style={{ opacity: after ? 1 : 0 }}>
                  <Thumb post={post} kit={KIT_BY_ID[post.kit_id]} dna={state.dna} width={140} />
                </div>
              </div>
            );
          })}
        </div>

        <dl className="mx-auto mt-5 grid max-w-md grid-cols-2 gap-2 text-xs">
          {metrics.map(([k, v]) => (
            <div key={k} className={`rounded-xl border px-3 py-2 ${after ? "border-emerald-200 bg-emerald-50" : "border-rose-500/30 bg-rose-950/20"}`}>
              <dt className="text-[10px] uppercase tracking-wide text-slate-500">{k}</dt>
              <dd className={after ? "text-emerald-800" : "text-rose-700"}>{v}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-6 flex justify-center">
          <button onClick={onClose} className="rounded-xl bg-brand px-6 py-2.5 text-xs font-semibold text-white hover:bg-blue-700">Volver al estudio</button>
        </div>
      </div>
    </div>
  );
}
