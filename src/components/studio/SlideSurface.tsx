import { forwardRef, useRef, useState } from "react";
import type { CSSProperties, PointerEvent as RPointerEvent } from "react";
import type { BrandKit, ClinicalDNA, Dimensions, Layer, PaletteKey, Post, Stroke, TextSize } from "../../types/studio";
import { DIMENSIONS, uid } from "../../lib/store";
import { BaseSlide, StickerView } from "./Templates";
import { kitVars, paletteVar } from "./kitStyle";

export const TEXT_PX: Record<TextSize, number> = { S: 46, M: 70, L: 108 };

export interface Interaction {
  tool: "select" | "draw";
  scale: number;
  selectedId: string | null;
  penColor: PaletteKey;
  penWidth: number;
  onSelect: (id: string | null) => void;
  onMove: (id: string, x: number, y: number) => void;
  onStroke: (s: Stroke) => void;
}

interface Props {
  post: Post;
  slideIndex: number;
  kit: BrandKit;
  dna: ClinicalDNA;
  interaction?: Interaction;
}

const pathOf = (pts: [number, number][]): string => pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");

function LayerNode({ layer, kit, dna, size, it }: { layer: Layer; kit: BrandKit; dna: ClinicalDNA; size: Dimensions; it?: Interaction }) {
  const drag = useRef<{ px: number; py: number; x: number; y: number } | null>(null);
  const selected = it?.selectedId === layer.id;
  const style: CSSProperties = {
    position: "absolute",
    left: layer.x,
    top: layer.y,
    transform: "translate(-50%, -50%)",
    touchAction: "none",
    pointerEvents: it?.tool === "select" ? "auto" : "none",
    cursor: it ? "grab" : undefined,
    userSelect: "none",
  };
  const onDown = (e: RPointerEvent<HTMLDivElement>) => {
    if (!it || it.tool !== "select") return;
    e.stopPropagation();
    it.onSelect(layer.id);
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { px: e.clientX, py: e.clientY, x: layer.x, y: layer.y };
  };
  const onMove = (e: RPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || !it) return;
    const nx = Math.min(size.w, Math.max(0, d.x + (e.clientX - d.px) / it.scale));
    const ny = Math.min(size.h, Math.max(0, d.y + (e.clientY - d.py) / it.scale));
    it.onMove(layer.id, nx, ny);
  };
  return (
    <div style={style} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={() => (drag.current = null)} onPointerCancel={() => (drag.current = null)}>
      {layer.type === "text" ? (
        <div
          className={layer.font === "heading" ? "font-kit-heading" : "font-kit-body"}
          style={{ color: paletteVar(layer.color), fontSize: TEXT_PX[layer.size], lineHeight: 1.15, fontWeight: layer.font === "heading" ? 600 : 500, whiteSpace: "pre-wrap", textAlign: "center", maxWidth: size.w * 0.8, minWidth: 40 }}
        >
          {layer.text || " "}
        </div>
      ) : layer.type === "sticker" ? (
        <StickerView kind={layer.kind} label={layer.label} kit={kit} dna={dna} />
      ) : (
        <img src={layer.src} alt="" draggable={false} style={{ width: layer.width, display: "block", borderRadius: 24 }} />
      )}
      {selected ? <div data-export-hide="" style={{ position: "absolute", inset: -14, border: "5px dashed #38bdf8", borderRadius: 18, pointerEvents: "none" }} /> : null}
    </div>
  );
}

/** Superficie de diseño a tamaño real (1080 px de ancho). Se escala por fuera con CSS. */
export const SlideSurface = forwardRef<HTMLDivElement, Props>(function SlideSurface({ post, slideIndex, kit, dna, interaction }, ref) {
  const size = DIMENSIONS[post.ratio];
  const extras = post.extras[slideIndex] ?? { layers: [], strokes: [] };
  const [live, setLive] = useState<[number, number][] | null>(null);
  const surface = useRef<HTMLDivElement | null>(null);

  const toDesign = (e: RPointerEvent): [number, number] => {
    const r = (surface.current as HTMLDivElement).getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * size.w, ((e.clientY - r.top) / r.height) * size.h];
  };
  const drawing = interaction?.tool === "draw";
  const down = (e: RPointerEvent<HTMLDivElement>) => {
    if (!drawing) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setLive([toDesign(e)]);
  };
  const move = (e: RPointerEvent<HTMLDivElement>) => {
    if (live) setLive((pts) => (pts ? [...pts, toDesign(e)] : pts));
  };
  const up = () => {
    if (live && interaction && live.length > 1) interaction.onStroke({ id: uid(), color: interaction.penColor, width: interaction.penWidth, points: live });
    setLive(null);
  };

  return (
    <div
      ref={(n) => {
        surface.current = n;
        if (typeof ref === "function") ref(n);
        else if (ref) ref.current = n;
      }}
      style={{ ...kitVars(kit), width: size.w, height: size.h, position: "relative", overflow: "hidden", transformOrigin: "top left", transform: interaction ? `scale(${interaction.scale})` : undefined }}
      className="bg-kit-bg"
      onPointerDown={() => interaction?.onSelect(null)}
    >
      <BaseSlide post={post} index={slideIndex} kit={kit} dna={dna} size={size} />
      <svg viewBox={`0 0 ${size.w} ${size.h}`} width={size.w} height={size.h} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {extras.strokes.map((s) => (
          <path key={s.id} d={pathOf(s.points)} fill="none" stroke={paletteVar(s.color)} strokeWidth={s.width} strokeLinecap="round" strokeLinejoin="round" />
        ))}
        {live && interaction ? <path d={pathOf(live)} fill="none" stroke={paletteVar(interaction.penColor)} strokeWidth={interaction.penWidth} strokeLinecap="round" strokeLinejoin="round" /> : null}
      </svg>
      {extras.layers.map((l) => (
        <LayerNode key={l.id} layer={l} kit={kit} dna={dna} size={size} it={interaction} />
      ))}
      {drawing ? <div style={{ position: "absolute", inset: 0, cursor: "crosshair", touchAction: "none" }} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} /> : null}
    </div>
  );
});

/** Miniatura estática a ancho `width` px (grilla, tira de slides, modal). */
export function Thumb({ post, slideIndex = 0, kit, dna, width }: { post: Post; slideIndex?: number; kit: BrandKit; dna: ClinicalDNA; width: number }) {
  const size = DIMENSIONS[post.ratio];
  const s = width / size.w;
  return (
    <div style={{ width, height: size.h * s, overflow: "hidden", position: "relative" }}>
      <div style={{ width: size.w, height: size.h, transform: `scale(${s})`, transformOrigin: "top left", pointerEvents: "none" }}>
        <SlideSurface post={post} slideIndex={slideIndex} kit={kit} dna={dna} />
      </div>
    </div>
  );
}
