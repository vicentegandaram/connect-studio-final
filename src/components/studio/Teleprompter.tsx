import { useEffect, useRef, useState } from "react";
import { FlipHorizontal2, Minus, Pause, Play, Plus, X } from "lucide-react";
import type { Fields, FormatDef } from "../../types/studio";

export function Teleprompter({ def, fields, onClose }: { def: FormatDef; fields: Fields; onClose: () => void }) {
  const box = useRef<HTMLDivElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(60); // px/s
  const [fontSize, setFontSize] = useState(54);
  const [mirror, setMirror] = useState(false);

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const el = box.current;
      if (el) {
        el.scrollTop += ((now - last) / 1000) * speed;
        if (el.scrollTop + el.clientHeight >= el.scrollHeight - 1) setPlaying(false);
      }
      last = now;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, speed]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === " ") {
        e.preventDefault();
        setPlaying((p) => !p);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const btn = "grid h-9 w-9 place-items-center rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700";
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black text-white">
      <div className="flex items-center justify-between gap-4 border-b border-slate-800 bg-slate-950 px-5 py-3 text-xs">
        <div className="flex items-center gap-2">
          <button onClick={() => setPlaying((p) => !p)} className="flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 font-semibold hover:bg-sky-500">{playing ? <Pause size={15} /> : <Play size={15} />}{playing ? "Pausar" : "Iniciar"}</button>
          <span className="text-slate-500">Espacio = pausa · Esc = salir</span>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-slate-400">Velocidad<input type="range" min={20} max={200} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} /></label>
          <div className="flex items-center gap-1.5 text-slate-400">Tamaño<button className={btn} onClick={() => setFontSize((s) => Math.max(32, s - 6))}><Minus size={14} /></button><button className={btn} onClick={() => setFontSize((s) => Math.min(110, s + 6))}><Plus size={14} /></button></div>
          <button className={`${btn} ${mirror ? "ring-2 ring-sky-400" : ""}`} onClick={() => setMirror(!mirror)} title="Espejo (para pantalla reflejada)"><FlipHorizontal2 size={15} /></button>
          <button className={btn} onClick={onClose}><X size={16} /></button>
        </div>
      </div>
      <div ref={box} className="relative flex-1 overflow-y-auto scroll-smooth px-[12%]" style={{ transform: mirror ? "scaleX(-1)" : undefined }}>
        <div className="pointer-events-none sticky top-[38%] z-10 h-0.5 bg-sky-500/50" />
        <div style={{ height: "40vh" }} />
        {def.fields.map((f, i) => (
          <section key={f.key} className="mb-24">
            <div className="mb-4 text-sm font-bold uppercase tracking-[0.25em] text-sky-400">{i + 1} · {f.label.replace(/^\d\s·\s/, "")}</div>
            <p style={{ fontSize, lineHeight: 1.35, fontWeight: 600 }}>{fields[f.key]}</p>
          </section>
        ))}
        <div style={{ height: "60vh" }} />
      </div>
    </div>
  );
}
