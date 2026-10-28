import { useRef, useState } from "react";
import { Copy, Download, Eraser, ImagePlus, MousePointer2, PenLine, Sparkles, Sticker, Trash2, Type, Undo2 } from "lucide-react";
import type { Layer, PaletteKey, RatioId, StickerKind, TextSize } from "../../types/studio";
import { DIMENSIONS, RATIO_LABEL, uid } from "../../lib/store";
import type { Studio } from "../../lib/store";
import { KIT_BY_ID } from "../../data/kits";
import { FORMAT_BY_ID } from "../../data/formats";
import { download, loadPhoto, renderSlide } from "../../lib/export";
import type { ExportType } from "../../lib/export";
import { SlideSurface, Thumb } from "./SlideSurface";
import { PALETTE_KEYS, PALETTE_LABEL } from "./kitStyle";

const MAX_W = 500;
const MAX_H = 600;
const PEN_WIDTHS = [8, 16, 28];
const PEN_COLORS: PaletteKey[] = ["accent", "primary", "background"];

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

interface Props {
  studio: Studio;
  blocked: boolean;
  onAI: () => void;
}

export function Stage({ studio, blocked, onAI }: Props) {
  const { active, state } = studio;
  const kit = KIT_BY_ID[active.kit_id];
  const def = FORMAT_BY_ID[active.format];
  const size = DIMENSIONS[active.ratio];
  const scale = Math.min(MAX_W / size.w, MAX_H / size.h);
  const surface = useRef<HTMLDivElement | null>(null);
  const fileInput = useRef<HTMLInputElement | null>(null);
  const [tool, setTool] = useState<"select" | "draw">("select");
  const [penColor, setPenColor] = useState<PaletteKey>("accent");
  const [penWidth, setPenWidth] = useState(PEN_WIDTHS[1]!);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [stickerMenu, setStickerMenu] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const extras = active.extras[state.slide] ?? { layers: [], strokes: [] };
  const selected = extras.layers.find((l) => l.id === selectedId) ?? null;

  // En láminas de fondo oscuro o de acento, el texto nuevo parte con el color de fondo del kit para que se lea.
  const darkSlide = active.format === "disponibilidad" || active.format === "guion-reel" || (active.format === "carrusel-psicoeducativo" && state.slide === 0);
  const addText = () => {
    const l: Layer = { id: uid(), type: "text", x: size.w / 2, y: size.h / 2, text: "Tu texto", font: "heading", color: darkSlide ? "background" : "primary", size: "M" };
    studio.addLayer(l);
    setSelectedId(l.id);
    setTool("select");
  };
  const addSticker = (kind: StickerKind) => {
    const label = kind === "agenda" ? "Agenda en mi bio" : kind === "cupos" ? `${active.fields.cupos || "Nuevos cupos"}${active.fields.mes ? ` · ${active.fields.mes}` : ""}` : "";
    const l: Layer = { id: uid(), type: "sticker", kind, label, x: size.w / 2, y: size.h * 0.78 };
    studio.addLayer(l);
    setSelectedId(l.id);
    setTool("select");
    setStickerMenu(false);
  };
  const addPhoto = async (file: File | undefined) => {
    if (!file) return;
    try {
      const src = await loadPhoto(file);
      const l: Layer = { id: uid(), type: "image", src, width: Math.round(size.w * 0.55), x: size.w / 2, y: size.h / 2 };
      studio.addLayer(l);
      setSelectedId(l.id);
      setTool("select");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar la foto.");
    }
  };

  const doExport = async (type: ExportType, all: boolean) => {
    if (!surface.current || busy) return;
    setBusy(true);
    setError(null);
    const prevSlide = state.slide;
    try {
      setSelectedId(null);
      const indexes = all ? Array.from({ length: def.slides }, (_, i) => i) : [prevSlide];
      for (const i of indexes) {
        if (i !== state.slide || all) {
          studio.setSlide(i);
          await wait(160);
        }
        const url = await renderSlide(surface.current as HTMLElement, size, type);
        download(url, `${state.dna.handle.replace("@", "")}-${active.format}${def.slides > 1 ? `-${i + 1}` : ""}.${type === "png" ? "png" : "jpg"}`);
        await wait(250);
      }
      studio.setSlide(prevSlide);
    } catch {
      setError("No se pudo exportar. Si usaste fotos muy grandes, prueba con una más liviana.");
    } finally {
      setBusy(false);
    }
  };

  const toolBtn = (on: boolean) => `grid h-11 w-11 place-items-center rounded-xl transition ${on ? "bg-brand text-white shadow shadow-blue-600/30" : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"}`;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1">
        {(Object.keys(DIMENSIONS) as RatioId[]).map((r) => (
          <button key={r} onClick={() => studio.setRatio(r)} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${active.ratio === r ? "bg-slate-200 text-slate-900" : "text-slate-500 hover:text-slate-900"}`}>
            {RATIO_LABEL[r]}
          </button>
        ))}
      </div>

      <div className="relative">
        <div className="overflow-hidden rounded-2xl shadow-xl ring-1 ring-slate-300" style={{ width: size.w * scale, height: size.h * scale }}>
          <SlideSurface
            ref={surface}
            post={active}
            slideIndex={state.slide}
            kit={kit}
            dna={state.dna}
            interaction={{ tool, scale, selectedId, penColor, penWidth, onSelect: setSelectedId, onMove: (id, x, y) => studio.updateLayer(id, { x, y }), onStroke: studio.addStroke }}
          />
        </div>

        <div className="absolute -right-16 top-0 flex flex-col gap-1 rounded-2xl border border-slate-200 bg-white/95 p-1.5 shadow-xl">
          <button className={toolBtn(tool === "select")} title="Mover / seleccionar" onClick={() => setTool("select")}>
            <MousePointer2 size={19} />
          </button>
          <button className={toolBtn(false)} title="Texto (solo fuentes y colores del kit)" onClick={addText}>
            <Type size={19} />
          </button>
          <button className={toolBtn(tool === "draw")} title="Lápiz (paleta del kit)" onClick={() => setTool(tool === "draw" ? "select" : "draw")}>
            <PenLine size={19} />
          </button>
          <div className="relative">
            <button className={toolBtn(stickerMenu)} title="Stickers clínicos" onClick={() => setStickerMenu((v) => !v)}>
              <Sticker size={19} />
            </button>
            {stickerMenu ? (
              <div className="absolute right-14 top-0 z-20 w-44 rounded-xl border border-slate-300 bg-white p-1 text-xs shadow-xl">
                {(
                  [
                    ["agenda", "Agenda en mi bio"],
                    ["cupos", "Nuevos cupos"],
                    ["monograma", "Monograma"],
                  ] as [StickerKind, string][]
                ).map(([k, label]) => (
                  <button key={k} onClick={() => addSticker(k)} className="block w-full rounded-lg px-3 py-2 text-left text-slate-800 hover:bg-slate-100">
                    {label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <button className={toolBtn(false)} title="Foto" onClick={() => fileInput.current?.click()}>
            <ImagePlus size={19} />
          </button>
          <input ref={fileInput} type="file" accept="image/*" hidden onChange={(e) => { void addPhoto(e.target.files?.[0]); e.target.value = ""; }} />
          <div className="my-0.5 h-px bg-slate-100" />
          <button className="grid h-11 w-11 place-items-center rounded-xl border border-amber-200 bg-amber-50 text-amber-800 transition hover:bg-amber-100" title="IA clínica: variantes de copy con la voz del kit" onClick={onAI}>
            <Sparkles size={19} />
          </button>
          <button className={toolBtn(false)} title="Deshacer trazo" disabled={!extras.strokes.length} onClick={studio.undoStroke}>
            <Undo2 size={18} />
          </button>
          <button className={toolBtn(false)} title="Borrar todos los trazos" disabled={!extras.strokes.length} onClick={studio.clearStrokes}>
            <Eraser size={18} />
          </button>
        </div>
      </div>

      {tool === "draw" ? (
        <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-white px-3 py-2 text-xs text-blue-800">
          Lápiz
          <div className="flex gap-1.5">
            {PEN_COLORS.map((c) => (
              <button key={c} title={PALETTE_LABEL[c]} onClick={() => setPenColor(c)} className={`h-5 w-5 rounded-full ring-2 ${penColor === c ? "ring-brand" : "ring-slate-300"}`} style={{ background: kit.palette[c] }} />
            ))}
          </div>
          <div className="flex gap-1.5">
            {PEN_WIDTHS.map((w) => (
              <button key={w} onClick={() => setPenWidth(w)} className={`grid h-6 w-6 place-items-center rounded-md ${penWidth === w ? "bg-slate-200" : ""}`}>
                <span className="rounded-full bg-slate-500" style={{ width: 4 + w / 3, height: 4 + w / 3 }} />
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {def.slides > 1 ? (
        <div className="flex gap-2">
          {Array.from({ length: def.slides }, (_, i) => (
            <button key={i} onClick={() => { studio.setSlide(i); setSelectedId(null); }} className={`overflow-hidden rounded-lg ring-2 transition ${state.slide === i ? "ring-brand" : "ring-slate-200 hover:ring-slate-400"}`}>
              <Thumb post={active} slideIndex={i} kit={kit} dna={state.dna} width={64} />
            </button>
          ))}
        </div>
      ) : null}

      {selected ? <LayerInspector layer={selected} studio={studio} onDelete={() => { studio.removeLayer(selected.id); setSelectedId(null); }} /> : null}

      <div className="flex flex-wrap items-center justify-center gap-2">
        <button disabled={blocked || busy} onClick={() => void doExport("png", false)} className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-xs font-semibold text-white shadow shadow-blue-600/20 transition hover:bg-blue-700 disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none" title={blocked ? "Corrige los puntos en rojo de Ética antes de exportar" : undefined}>
          <Download size={14} /> {busy ? "Exportando…" : `PNG ${size.w}×${size.h}`}
        </button>
        <button disabled={blocked || busy} onClick={() => void doExport("jpeg", false)} className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-medium text-slate-800 transition hover:bg-slate-100 disabled:opacity-40">
          JPEG
        </button>
        {def.slides > 1 ? (
          <button disabled={blocked || busy} onClick={() => void doExport("png", true)} className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-medium text-slate-800 transition hover:bg-slate-100 disabled:opacity-40">
            Todas las láminas ({def.slides})
          </button>
        ) : null}
        <button onClick={studio.duplicate} className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900" title="Duplicar post"><Copy size={15} /></button>
        <button onClick={() => studio.remove(active.id)} disabled={state.posts.length <= 1} className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-rose-50 hover:text-rose-300 disabled:opacity-30" title="Eliminar post"><Trash2 size={15} /></button>
      </div>
      {blocked ? <p className="max-w-sm text-center text-xs text-rose-600">Exportación bloqueada: hay un problema ético que corregir (pestaña Ética).</p> : null}
      {error ? <p className="max-w-sm text-center text-xs text-amber-800">{error}</p> : null}
    </div>
  );
}

function LayerInspector({ layer, studio, onDelete }: { layer: Layer; studio: Studio; onDelete: () => void }) {
  const kit = KIT_BY_ID[studio.active.kit_id];
  const card = "w-full max-w-md rounded-xl border border-slate-200 bg-white p-3 text-xs";
  return (
    <div className={card}>
      <div className="mb-2 flex items-center justify-between">
        <span className="font-semibold text-slate-800">{layer.type === "text" ? "Texto" : layer.type === "sticker" ? "Sticker" : "Foto"}</span>
        <button onClick={onDelete} className="flex items-center gap-1 text-rose-600 hover:text-rose-200"><Trash2 size={13} /> Quitar</button>
      </div>
      {layer.type === "text" ? (
        <div className="space-y-2">
          <textarea value={layer.text} onChange={(e) => studio.updateLayer(layer.id, { text: e.target.value.slice(0, 140) })} rows={2} className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-slate-900 outline-none focus:border-brand" />
          <div className="flex items-center justify-between gap-3">
            <div className="flex gap-1">
              {(["heading", "body"] as const).map((r) => (
                <button key={r} onClick={() => studio.updateLayer(layer.id, { font: r })} className={`rounded-md px-2 py-1 ${layer.font === r ? "bg-brand text-white" : "bg-slate-100 text-slate-700"}`} style={{ fontFamily: `"${kit.fonts[r]}"` }}>
                  {r === "heading" ? "Título" : "Cuerpo"}
                </button>
              ))}
            </div>
            <div className="flex gap-1">
              {(["S", "M", "L"] as TextSize[]).map((s) => (
                <button key={s} onClick={() => studio.updateLayer(layer.id, { size: s })} className={`h-6 w-6 rounded-md ${layer.size === s ? "bg-brand text-white" : "bg-slate-100 text-slate-700"}`}>{s}</button>
              ))}
            </div>
            <div className="flex gap-1.5">
              {PALETTE_KEYS.map((c) => (
                <button key={c} title={PALETTE_LABEL[c]} onClick={() => studio.updateLayer(layer.id, { color: c })} className={`h-5 w-5 rounded-full ring-2 ${layer.color === c ? "ring-brand" : "ring-slate-300"}`} style={{ background: kit.palette[c] }} />
              ))}
            </div>
          </div>
        </div>
      ) : null}
      {layer.type === "sticker" && layer.kind !== "monograma" ? (
        <input value={layer.label} onChange={(e) => studio.updateLayer(layer.id, { label: e.target.value.slice(0, 40) })} className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-slate-900 outline-none focus:border-brand" />
      ) : null}
      {layer.type === "image" ? (
        <input type="range" min={200} max={1080} value={layer.width} onChange={(e) => studio.updateLayer(layer.id, { width: Number(e.target.value) })} className="w-full" />
      ) : null}
      <p className="mt-2 text-[11px] text-slate-500">Arrastra sobre el lienzo para mover. Solo hay colores y fuentes del kit.</p>
    </div>
  );
}
