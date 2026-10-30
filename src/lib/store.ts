import { useCallback, useEffect, useMemo, useState } from "react";
import type { ClinicalDNA, Dimensions, Fields, FormatId, KitId, Layer, Pillar, Post, PostStatus, RatioId, SlideExtras, Stroke } from "../types/studio";
import { FORMAT_BY_ID, FORMATS, fillVariant } from "../data/formats";
import { KIT_BY_ID, recommendKit } from "../data/kits";
import { invalidateApproval, moveTo } from "./workflow";
import type { EthicsReport } from "./ethics";
export type { Pillar, PostStatus };

export const DIMENSIONS: Record<RatioId, Dimensions> = {
  story: { w: 1080, h: 1920 },
  "feed-square": { w: 1080, h: 1080 },
  "feed-portrait": { w: 1080, h: 1350 },
};
export const RATIO_LABEL: Record<RatioId, string> = { story: "Story 9:16", "feed-square": "Feed 1:1", "feed-portrait": "Feed 4:5" };

export const DEFAULT_DNA: ClinicalDNA = {
  name: "Ps. Camila Rojas",
  handle: "@ps.camilarojas",
  title: "Psicóloga clínica",
  approach: "TCC",
  target_population: "Adultos y adolescentes",
  recurring_concern: "ansiedad y sobrepensamiento",
  tone: "calido",
};

interface StudioState {
  dna: ClinicalDNA;
  kit_id: KitId;
  posts: Post[];
  activeId: string;
  slide: number;
  /** Semana del plan (cambia las ideas al pedir «otra semana»). */
  planRound: number;
}

const KEY = "connect-studio-final-v1";
/** Clave del prototipo anterior: si existe, se hereda para no perder lo que ya estaba guardado. */
const LEGACY_KEY = "connect-studio-v1";
let seq = 0;
export const uid = (): string => `${Date.now().toString(36)}${(seq++).toString(36)}${Math.random().toString(36).slice(2, 6)}`;

const emptyExtras = (n: number): SlideExtras[] => Array.from({ length: n }, () => ({ layers: [], strokes: [] }));
export const defaultRatio = (f: FormatId): RatioId => FORMAT_BY_ID[f].ratio ?? (f === "guion-reel" ? "story" : f === "frase-validacion" || f === "mito-realidad" ? "feed-square" : "feed-portrait");

export function makePost(format: FormatId, kit_id: KitId, fields: Fields, ratio: RatioId = defaultRatio(format)): Post {
  return { id: uid(), format, ratio, kit_id, fields, extras: emptyExtras(FORMAT_BY_ID[format].slides) };
}

export function nextVariant(format: FormatId, posts: Post[], concern: string): Fields {
  const bank = FORMAT_BY_ID[format].variants;
  const used = posts.filter((p) => p.format === format).length;
  return fillVariant(bank[used % bank.length]!, concern);
}

function seed(dna: ClinicalDNA, kit_id: KitId): Post[] {
  const order: [FormatId, number][] = [["frase-validacion", 0], ["mito-realidad", 0], ["carrusel-psicoeducativo", 0], ["guion-reel", 0], ["carrusel-psicoeducativo", 2], ["frase-validacion", 1]];
  return order.map(([f, v]) => makePost(f, kit_id, fillVariant(FORMAT_BY_ID[f].variants[v]!, dna.recurring_concern)));
}

function initial(): StudioState {
  const kit_id = recommendKit(DEFAULT_DNA.approach).kit_id;
  const posts = seed(DEFAULT_DNA, kit_id);
  return { dna: DEFAULT_DNA, kit_id, posts, activeId: posts[0]!.id, slide: 0, planRound: 0 };
}

function load(): StudioState {
  try {
    const raw = localStorage.getItem(KEY) ?? localStorage.getItem(LEGACY_KEY);
    if (raw) {
      const s = JSON.parse(raw) as StudioState;
      if (s.posts?.length && s.posts.some((p) => p.id === s.activeId) && KIT_BY_ID[s.kit_id]) return { ...s, planRound: s.planRound ?? 0 };
    }
  } catch {
    /* almacenamiento no disponible o JSON corrupto: se parte desde la demo */
  }
  return initial();
}

export function useStudio() {
  const [state, setState] = useState<StudioState>(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* cuota llena (p. ej. fotos grandes): se sigue en memoria */
    }
  }, [state]);

  const active = useMemo(() => state.posts.find((p) => p.id === state.activeId) ?? state.posts[0]!, [state.posts, state.activeId]);

  const patchPost = useCallback((id: string, fn: (p: Post) => Post) => setState((s) => ({ ...s, posts: s.posts.map((p) => (p.id === id ? fn(p) : p)) })), []);
  const patchExtras = useCallback(
    (fn: (e: SlideExtras) => SlideExtras) => setState((s) => ({ ...s, posts: s.posts.map((p) => (p.id === s.activeId ? { ...p, extras: p.extras.map((e, i) => (i === s.slide ? fn(e) : e)) } : p)) })),
    [],
  );

  return {
    state,
    active,
    setDna: (dna: ClinicalDNA) => setState((s) => ({ ...s, dna })),
    /** Cambia el kit global y re-viste el post activo. */
    setKit: (kit_id: KitId) => setState((s) => ({ ...s, kit_id, posts: s.posts.map((p) => (p.id === s.activeId ? { ...p, kit_id } : p)) })),
    unifyKit: () => setState((s) => ({ ...s, posts: s.posts.map((p) => ({ ...p, kit_id: s.kit_id })) })),
    select: (id: string) => setState((s) => ({ ...s, activeId: id, slide: 0 })),
    setSlide: (slide: number) => setState((s) => ({ ...s, slide })),
    create: (format: FormatId, fields?: Fields, meta?: Partial<Pick<Post, "topic" | "pillar" | "planId" | "status" | "scheduledAt" | "caption">>) =>
      setState((s) => {
        const post = { ...makePost(format, s.kit_id, fields ?? nextVariant(format, s.posts, s.dna.recurring_concern)), ...meta };
        return { ...s, posts: [post, ...s.posts], activeId: post.id, slide: 0 };
      }),
    patchActive: (patch: Partial<Pick<Post, "caption" | "status" | "scheduledAt" | "approvedAt">>) =>
      patchPost(active.id, (p) => {
        const next = { ...p, ...patch };
        return "caption" in patch && patch.caption !== p.caption ? invalidateApproval(next) : next;
      }),
    /** Cambia de estado respetando el flujo de aprobación. Devuelve el motivo si no se pudo. */
    moveStatus: (id: string, to: PostStatus, report: EthicsReport): string | null => {
      const target = state.posts.find((p) => p.id === id);
      if (!target) return "No se encontró la pieza.";
      const res = moveTo(target, to, report);
      if (res.gate.ok) patchPost(id, () => res.post);
      return res.gate.ok ? null : res.gate.reason ?? "No permitido.";
    },
    nextRound: () => setState((s) => ({ ...s, planRound: s.planRound + 1 })),
    duplicate: () => setState((s) => {
      const copy: Post = { ...structuredClone(active), id: uid() };
      return { ...s, posts: [copy, ...s.posts], activeId: copy.id, slide: 0 };
    }),
    remove: (id: string) =>
      setState((s) => {
        if (s.posts.length <= 1) return s;
        const posts = s.posts.filter((p) => p.id !== id);
        return { ...s, posts, activeId: s.activeId === id ? posts[0]!.id : s.activeId, slide: 0 };
      }),
    move: (id: string, dir: -1 | 1) =>
      setState((s) => {
        const i = s.posts.findIndex((p) => p.id === id);
        const j = i + dir;
        if (i < 0 || j < 0 || j >= s.posts.length) return s;
        const posts = [...s.posts];
        [posts[i], posts[j]] = [posts[j]!, posts[i]!];
        return { ...s, posts };
      }),
    setRatio: (ratio: RatioId) => patchPost(active.id, (p) => ({ ...p, ratio })),
    setFields: (fields: Fields) => patchPost(active.id, (p) => invalidateApproval({ ...p, fields })),
    addLayer: (layer: Layer) => patchExtras((e) => ({ ...e, layers: [...e.layers, layer] })),
    updateLayer: (id: string, patch: Partial<Layer>) => patchExtras((e) => ({ ...e, layers: e.layers.map((l) => (l.id === id ? ({ ...l, ...patch } as Layer) : l)) })),
    removeLayer: (id: string) => patchExtras((e) => ({ ...e, layers: e.layers.filter((l) => l.id !== id) })),
    addStroke: (stroke: Stroke) => patchExtras((e) => ({ ...e, strokes: [...e.strokes, stroke] })),
    undoStroke: () => patchExtras((e) => ({ ...e, strokes: e.strokes.slice(0, -1) })),
    clearStrokes: () => patchExtras((e) => ({ ...e, strokes: [] })),
    reset: () => setState(initial()),
  };
}

export type Studio = ReturnType<typeof useStudio>;
export const FORMAT_LIST = FORMATS;
