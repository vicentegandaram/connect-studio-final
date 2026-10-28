import { useEffect, useRef, useState } from "react";
import type { Post } from "../../types/studio";
import type { Studio } from "../../lib/store";
import { KIT_BY_ID } from "../../data/kits";
import { Thumb } from "../studio/SlideSurface";

export const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <section className={`rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_6px_24px_-14px_rgba(29,78,216,.25)] ${className}`}>{children}</section>
);

export const PageTitle = ({ title, subtitle }: { title: string; subtitle?: string }) => (
  <header className="fade-up mb-6">
    <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">{title}</h1>
    {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
  </header>
);

export const Btn = ({ variant = "primary", className = "", ...p }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "soft" | "ghost" }) => (
  <button
    {...p}
    className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${
      variant === "primary" ? "bg-brand text-white shadow-md shadow-blue-600/20 hover:bg-blue-700" : variant === "soft" ? "bg-soft text-brand hover:bg-blue-100" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
    } ${className}`}
  />
);

export const Chip = ({ children, color = "#1d4ed8" }: { children: React.ReactNode; color?: string }) => (
  <span className="inline-block rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ background: color + "1f", color }}>{children}</span>
);

export const inputCls = "w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-blue-200";

/** Miniatura que se ajusta al ancho de su contenedor (la lámina real se escala con CSS). */
export function FitThumb({ post, studio, slide = 0, className = "" }: { post: Post; studio: Studio; slide?: number; className?: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(Math.floor(el.clientWidth)));
    ro.observe(el);
    setW(Math.floor(el.clientWidth));
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={ref} className={`w-full overflow-hidden rounded-2xl ring-1 ring-slate-200 ${className}`}>
      {w > 0 ? <Thumb post={post} slideIndex={slide} kit={KIT_BY_ID[post.kit_id]} dna={studio.state.dna} width={w} /> : null}
    </div>
  );
}

export const STATUS_COLOR = { borrador: "#64748b", programado: "#b45309", publicado: "#15803d" } as const;
