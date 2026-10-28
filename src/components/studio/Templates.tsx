import type { CSSProperties, ReactNode } from "react";
import { Bookmark, CalendarCheck, Play } from "lucide-react";
import type { BrandKit, ClinicalDNA, Dimensions, Post, StickerKind } from "../../types/studio";
import { readableOn } from "../../lib/color";
import { initials } from "./kitStyle";
import { FORMAT_BY_ID } from "../../data/formats";

interface Ctx {
  post: Post;
  index: number;
  kit: BrandKit;
  dna: ClinicalDNA;
  size: Dimensions;
}

const PAD = 88;
const f = (size: Dimensions): number => (size.h <= 1080 ? 0.82 : 1);
const col: CSSProperties = { display: "flex", flexDirection: "column" };

/** `bg` es el fondo de la lámina: el monograma se invierte si el acento no se distingue de él. */
function Header({ dna, kit, fg, bg }: { dna: ClinicalDNA; kit: BrandKit; fg: string; bg?: string }) {
  const inverted = bg !== undefined;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20, color: fg }}>
      <div className="font-kit-heading" style={{ width: 72, height: 72, borderRadius: 999, background: inverted ? fg : kit.palette.accent, color: inverted ? bg : readableOn(kit.palette.accent, kit.palette), display: "grid", placeItems: "center", fontSize: 30, fontWeight: 700 }}>
        {initials(dna.name)}
      </div>
      <div className="font-kit-body" style={{ lineHeight: 1.2 }}>
        <div style={{ fontSize: 30, fontWeight: 600 }}>{dna.name}</div>
        <div style={{ fontSize: 24, opacity: 0.75 }}>{dna.handle}</div>
      </div>
    </div>
  );
}

function Chip({ children, bg, fg }: { children: ReactNode; bg: string; fg: string }) {
  return (
    <span className="font-kit-body" style={{ alignSelf: "flex-start", background: bg, color: fg, fontSize: 26, fontWeight: 700, letterSpacing: 4, textTransform: "uppercase", padding: "10px 26px", borderRadius: 999 }}>
      {children}
    </span>
  );
}

export function StickerView({ kind, label, kit, dna }: { kind: StickerKind; label: string; kit: BrandKit; dna: ClinicalDNA }) {
  const p = kit.palette;
  const on = readableOn(p.accent, p);
  if (kind === "monograma") {
    return (
      <div className="font-kit-heading" style={{ width: 150, height: 150, borderRadius: 999, background: p.accent, color: on, display: "grid", placeItems: "center", fontSize: 64, fontWeight: 700 }}>
        {initials(dna.name)}
      </div>
    );
  }
  const pill: CSSProperties = { display: "flex", alignItems: "center", gap: 18, whiteSpace: "nowrap", borderRadius: 999, fontSize: 38, fontWeight: 600, padding: "22px 42px" };
  if (kind === "cupos") {
    return (
      <div className="font-kit-body" style={{ ...pill, background: p.surface, color: p.primary, border: `3px solid ${p.accent}` }}>
        <span style={{ width: 20, height: 20, borderRadius: 999, background: p.accent }} />
        {label || "Nuevos cupos"}
      </div>
    );
  }
  return (
    <div className="font-kit-body" style={{ ...pill, background: p.accent, color: on }}>
      <CalendarCheck size={42} strokeWidth={2.2} />
      {label || "Agenda en mi bio"}
    </div>
  );
}

function Mito({ post, kit, dna, size }: Ctx) {
  const k = f(size);
  const p = kit.palette;
  return (
    <div className="bg-kit-bg text-kit-ink" style={{ ...col, height: "100%", padding: PAD, justifyContent: "space-between" }}>
      <Header dna={dna} kit={kit} fg={p.primary} />
      <div style={{ ...col, gap: 30 * k }}>
        <Chip bg={p.surface} fg={p.accent}>Mito</Chip>
        <div className="font-kit-heading" style={{ fontSize: 70 * k, lineHeight: 1.12, fontWeight: 600 }}>{post.fields.mito}</div>
        <div style={{ height: 6, width: 140, background: p.accent, borderRadius: 6 }} />
        <Chip bg={p.accent} fg={readableOn(p.accent, p)}>Realidad</Chip>
        <div className="font-kit-body" style={{ fontSize: 40 * k, lineHeight: 1.4 }}>{post.fields.realidad}</div>
      </div>
      <div className="font-kit-body" style={{ fontSize: 24, opacity: 0.6 }}>{dna.title} · {dna.approach}</div>
    </div>
  );
}

function Carrusel({ post, index, kit, dna, size }: Ctx) {
  const k = f(size);
  const p = kit.palette;
  const total = 5;
  const dots = (fg: string) => (
    <div style={{ display: "flex", gap: 12 }}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} style={{ width: i === index ? 40 : 14, height: 14, borderRadius: 14, background: fg, opacity: i === index ? 1 : 0.35 }} />
      ))}
    </div>
  );
  if (index === 0) {
    return (
      <div className="bg-kit-ink" style={{ ...col, height: "100%", padding: PAD, justifyContent: "space-between", color: p.background }}>
        <Header dna={dna} kit={kit} fg={p.background} bg={p.primary} />
        <div className="font-kit-heading" style={{ fontSize: 92 * k, lineHeight: 1.08, fontWeight: 600 }}>{post.fields.titulo}</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {dots(p.background)}
          <span className="font-kit-body" style={{ fontSize: 30, fontWeight: 600 }}>Desliza →</span>
        </div>
      </div>
    );
  }
  if (index < 4) {
    const step = post.fields[`paso${index}`] ?? "";
    return (
      <div className="bg-kit-bg text-kit-ink" style={{ ...col, height: "100%", padding: PAD, justifyContent: "space-between" }}>
        <Header dna={dna} kit={kit} fg={p.primary} />
        <div style={{ ...col, gap: 10 * k }}>
          <div className="font-kit-heading" style={{ fontSize: 260 * k, lineHeight: 1, color: p.accent, fontWeight: 700 }}>{index}</div>
          <div className="font-kit-heading" style={{ fontSize: 64 * k, lineHeight: 1.18, fontWeight: 600 }}>{step}</div>
        </div>
        {dots(p.primary)}
      </div>
    );
  }
  return (
    <div className="bg-kit-surface text-kit-ink" style={{ ...col, height: "100%", padding: PAD, justifyContent: "space-between" }}>
      <Header dna={dna} kit={kit} fg={p.primary} />
      <div style={{ ...col, gap: 40 * k }}>
        <div className="font-kit-heading" style={{ fontSize: 76 * k, lineHeight: 1.12, fontWeight: 600 }}>{post.fields.cierre}</div>
        <div className="font-kit-body" style={{ alignSelf: "flex-start", display: "flex", gap: 16, alignItems: "center", background: p.accent, color: readableOn(p.accent, p), fontSize: 36, fontWeight: 600, padding: "20px 38px", borderRadius: 999 }}>
          <Bookmark size={38} /> Guárdalo para después
        </div>
      </div>
      {dots(p.primary)}
    </div>
  );
}

function Frase({ post, kit, dna, size }: Ctx) {
  const k = f(size);
  const p = kit.palette;
  return (
    <div className="bg-kit-bg text-kit-ink" style={{ ...col, height: "100%", padding: PAD, justifyContent: "space-between" }}>
      <Header dna={dna} kit={kit} fg={p.primary} />
      <div style={{ ...col, gap: 30 * k }}>
        <div className="font-kit-heading" style={{ fontSize: 280 * k, lineHeight: 0.6, height: 120 * k, color: p.accent, fontWeight: 700 }}>“</div>
        <div className="font-kit-heading" style={{ fontSize: 84 * k, lineHeight: 1.14, fontWeight: 600 }}>{post.fields.frase}</div>
        {post.fields.apoyo ? <div className="font-kit-body" style={{ fontSize: 38 * k, color: p.accent, fontWeight: 600 }}>{post.fields.apoyo}</div> : null}
      </div>
      <div className="font-kit-body" style={{ fontSize: 24, opacity: 0.6 }}>Guárdalo · Compártelo con quien lo necesite</div>
    </div>
  );
}

function Disponibilidad({ post, kit, dna, size }: Ctx) {
  const k = f(size);
  const p = kit.palette;
  const fg = readableOn(p.accent, p);
  return (
    <div className="bg-kit-accent" style={{ ...col, height: "100%", padding: PAD, justifyContent: "space-between", color: fg }}>
      <Header dna={dna} kit={kit} fg={fg} bg={p.accent} />
      <div style={{ ...col, gap: 34 * k }}>
        <div style={{ display: "flex", gap: 16 }}>
          {post.fields.cupos ? <Chip bg={fg} fg={p.accent}>{post.fields.cupos}</Chip> : null}
          {post.fields.mes ? <Chip bg="transparent" fg={fg}>{post.fields.mes}</Chip> : null}
        </div>
        <div className="font-kit-heading" style={{ fontSize: 82 * k, lineHeight: 1.1, fontWeight: 600 }}>{post.fields.titulo}</div>
        <div className="font-kit-body" style={{ fontSize: 38 * k, lineHeight: 1.4 }}>{post.fields.detalle}</div>
      </div>
      <div className="font-kit-body" style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 18, background: fg, color: p.accent, fontSize: 38, fontWeight: 700, padding: "22px 42px", borderRadius: 999 }}>
        <CalendarCheck size={42} /> Agenda en mi bio
      </div>
    </div>
  );
}

function GuionCover({ post, kit, dna, size }: Ctx) {
  const k = f(size);
  const p = kit.palette;
  return (
    <div className="bg-kit-ink" style={{ ...col, height: "100%", padding: PAD, justifyContent: "space-between", color: p.background }}>
      <Header dna={dna} kit={kit} fg={p.background} bg={p.primary} />
      <div style={{ ...col, gap: 40 }}>
        <Chip bg={p.surface} fg={p.primary}>Reel</Chip>
        <div className="font-kit-heading" style={{ fontSize: 96 * k, lineHeight: 1.1, fontWeight: 600 }}>{post.fields.gancho}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <span style={{ width: 96, height: 96, borderRadius: 999, background: p.surface, color: p.primary, display: "grid", placeItems: "center" }}>
          <Play size={44} fill="currentColor" />
        </span>
        <span className="font-kit-body" style={{ fontSize: 30, opacity: 0.85 }}>Mira hasta el final</span>
      </div>
    </div>
  );
}

/** Formatos de una sola pieza: se dibujan según `layout` con los campos del formato en orden. */
function Generic({ post, kit, dna, size }: Ctx) {
  const k = f(size);
  const p = kit.palette;
  const def = FORMAT_BY_ID[post.format];
  const v = (key?: string): string => (key ? post.fields[key] ?? "" : "");
  const [a, b, c] = def.fields.map((fd) => v(fd.key));
  const shell = (bg: string, fg: string, body: ReactNode, foot?: ReactNode) => (
    <div style={{ ...col, height: "100%", padding: PAD, justifyContent: "space-between", background: bg, color: fg }}>
      <Header dna={dna} kit={kit} fg={bg === p.accent ? fg : p.primary} bg={bg === p.accent ? p.accent : undefined} />
      <div style={{ ...col, gap: 34 * k }}>{body}</div>
      {foot ?? <div className="font-kit-body" style={{ fontSize: 24, opacity: 0.6 }}>{dna.title} · {dna.approach}</div>}
    </div>
  );
  const head = (t: string, size = 80) => <div className="font-kit-heading" style={{ fontSize: size * k, lineHeight: 1.12, fontWeight: 600 }}>{t}</div>;
  const body = (t: string, size = 40) => <div className="font-kit-body" style={{ fontSize: size * k, lineHeight: 1.4 }}>{t}</div>;

  switch (def.layout) {
    case "quote":
      return shell(p.surface, p.primary, (
        <>
          <div className="font-kit-heading" style={{ fontSize: 280 * k, lineHeight: 0.6, height: 120 * k, color: p.accent, fontWeight: 700 }}>“</div>
          {head(a, 84)}
          {b ? <div className="font-kit-body" style={{ fontSize: 34 * k, color: p.accent, fontWeight: 600 }}>— {b}</div> : null}
        </>
      ));
    case "stat":
      return shell(p.background, p.primary, (
        <>
          {b ? <Chip bg={p.surface} fg={p.accent}>{b}</Chip> : null}
          <div className="font-kit-heading" style={{ fontSize: 250 * k, lineHeight: 1, color: p.accent, fontWeight: 700 }}>{a}</div>
          {body(c)}
        </>
      ));
    case "list":
      return shell(p.background, p.primary, (
        <>
          {head(a, 70)}
          <div style={{ ...col, gap: 26 * k }}>
            {def.fields.slice(1).map((fd, i) => v(fd.key) ? (
              <div key={fd.key} style={{ display: "flex", alignItems: "center", gap: 24 }}>
                <span className="font-kit-heading" style={{ flexShrink: 0, width: 64, height: 64, borderRadius: 999, background: p.accent, color: readableOn(p.accent, p), display: "grid", placeItems: "center", fontSize: 32, fontWeight: 700 }}>{i + 1}</span>
                <span className="font-kit-body" style={{ fontSize: 40 * k, lineHeight: 1.25 }}>{v(fd.key)}</span>
              </div>
            ) : null)}
          </div>
        </>
      ));
    case "faq":
      return shell(p.surface, p.primary, (
        <>
          {a ? <Chip bg={p.accent} fg={readableOn(p.accent, p)}>{a}</Chip> : null}
          {[[def.fields[1], def.fields[2]], [def.fields[3], def.fields[4]]].map(([q, an], i) => (
            <div key={i} style={{ ...col, gap: 12 * k }}>
              {head(v(q?.key), 54)}
              {body(v(an?.key), 36)}
            </div>
          ))}
        </>
      ));
    case "pair": {
      const on = readableOn(p.accent, p);
      return (
        <div style={{ ...col, height: "100%", padding: PAD, justifyContent: "space-between", background: p.background, color: p.primary }}>
          <Header dna={dna} kit={kit} fg={p.primary} />
          <div style={{ ...col, gap: 28 * k }}>
            <div style={{ ...col, gap: 14 * k, background: p.surface, borderRadius: 28, padding: 40 * k }}>
              <Chip bg={p.background} fg={p.primary}>Antes</Chip>
              {head(a, 56)}
            </div>
            <div style={{ ...col, gap: 14 * k, background: p.accent, color: on, borderRadius: 28, padding: 40 * k }}>
              <Chip bg={on} fg={p.accent}>Después</Chip>
              {head(b ?? "", 56)}
            </div>
          </div>
          <div className="font-kit-body" style={{ fontSize: 24, opacity: 0.6 }}>{dna.title} · {dna.approach}</div>
        </div>
      );
    }
    default: {
      const chip = v(def.chip);
      const cta = v(def.cta);
      const titleKey = def.fields.find((fd) => fd.key === "titulo" || fd.key === "dato")?.key;
      const rest = def.fields.filter((fd) => fd.key !== def.chip && fd.key !== def.cta && fd.key !== titleKey);
      return shell(p.background, p.primary, (
        <>
          {chip ? <Chip bg={p.accent} fg={readableOn(p.accent, p)}>{chip}</Chip> : null}
          {head(v(titleKey), 78)}
          {rest.map((fd) => <div key={fd.key}>{body(v(fd.key))}</div>)}
          {cta ? <div className="font-kit-body" style={{ alignSelf: "flex-start", background: p.accent, color: readableOn(p.accent, p), fontSize: 38, fontWeight: 700, padding: "22px 42px", borderRadius: 999 }}>{cta}</div> : null}
        </>
      ));
    }
  }
}

export function BaseSlide(ctx: Ctx) {
  switch (ctx.post.format) {
    case "mito-realidad":
      return <Mito {...ctx} />;
    case "carrusel-psicoeducativo":
      return <Carrusel {...ctx} />;
    case "frase-validacion":
      return <Frase {...ctx} />;
    case "disponibilidad":
      return <Disponibilidad {...ctx} />;
    case "guion-reel":
      return <GuionCover {...ctx} />;
    default:
      return <Generic {...ctx} />;
  }
}
