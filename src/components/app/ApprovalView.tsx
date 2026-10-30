import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ClipboardCopy, Clock, Pencil, ShieldCheck, Undo2, XCircle } from "lucide-react";
import type { Post } from "../../types/studio";
import type { Studio } from "../../lib/store";
import { FORMAT_BY_ID } from "../../data/formats";
import { hasBlocking, reviewPost, type EthicsReport } from "../../lib/ethics";
import { Btn, Card, Chip, FitThumb, PageTitle } from "./ui";

const fmt = (iso?: string) => (iso ? new Date(`${iso}T12:00:00`).toLocaleDateString("es-CL", { weekday: "short", day: "numeric", month: "short" }) : "sin fecha");

export const pendingCount = (posts: Post[]): number => posts.filter((p) => (p.status ?? "borrador") === "borrador").length;

/** Vista del psicólogo: revisa y aprueba lo que preparó el equipo. Es el control humano del servicio. */
export function ApprovalView({ studio, onEdit }: { studio: Studio; onEdit: (id: string) => void }) {
  const { posts } = studio.state;
  const [minutes, setMinutes] = useState(25);
  const reviews = useMemo(() => new Map(posts.map((p) => [p.id, reviewPost(p)] as const)), [posts]);
  const drafts = posts.filter((p) => (p.status ?? "borrador") === "borrador");
  const approved = posts.filter((p) => p.status === "aprobado");
  const clean = drafts.filter((p) => reviews.get(p.id)!.issues.length === 0);
  const count = (s: Post["status"]) => posts.filter((p) => (p.status ?? "borrador") === s).length;
  const warnings = posts.reduce((n, p) => n + reviews.get(p.id)!.issues.filter((i) => i.severity === "warning").length, 0);
  const hours = Math.round(((posts.length * minutes) / 60) * 10) / 10;
  const report = [
    "Reporte de contenido · Connect",
    `Piezas preparadas: ${posts.length} (borrador ${count("borrador")}, aprobadas ${count("aprobado")}, programadas ${count("programado")}, publicadas ${count("publicado")})`,
    `Avisos éticos sin resolver: ${warnings}`,
    `Tiempo estimado que te ahorramos: ${hours} h (supuesto: ${minutes} min por pieza; es una estimación, no una medición)`,
  ].join("\n");

  const approve = (p: Post) => { const why = studio.moveStatus(p.id, "aprobado", reviews.get(p.id)!); if (why) alert(why); };
  const approveClean = () => clean.forEach((p) => studio.moveStatus(p.id, "aprobado", reviews.get(p.id)!));
  const revoke = (p: Post) => studio.moveStatus(p.id, "borrador", reviews.get(p.id)!);

  return (
    <div className="fade-up">
      <PageTitle title="Aprobación" subtitle="Nada se programa ni se publica sin tu visto bueno. Revisa cada pieza, o aprueba de una vez las que no tienen observaciones." />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <Card className="flex flex-wrap items-center justify-between gap-3 !p-4">
            <p className="text-sm"><b>{drafts.length}</b> por revisar · <b>{approved.length}</b> aprobadas · <b>{clean.length}</b> sin observaciones</p>
            <Btn disabled={clean.length === 0} onClick={approveClean}><CheckCircle2 size={16} />Aprobar las {clean.length} sin observaciones</Btn>
          </Card>
          {drafts.length === 0 && <p className="rounded-3xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">No hay piezas por revisar. Arma un paquete desde Inicio.</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            {drafts.map((p) => <DraftCard key={p.id} p={p} r={reviews.get(p.id)!} studio={studio} onApprove={() => approve(p)} onEdit={() => onEdit(p.id)} />)}
          </div>
          {approved.length > 0 && (
            <Card>
              <h2 className="mb-3 text-sm font-extrabold">Aprobadas ({approved.length})</h2>
              <ul className="space-y-1.5">
                {approved.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-2 rounded-2xl bg-slate-50 px-3 py-2 text-sm">
                    <span className="min-w-0 truncate"><b>{FORMAT_BY_ID[p.format].title}</b> <span className="text-slate-500">· {p.topic ?? ""} · {fmt(p.scheduledAt)}</span></span>
                    <button onClick={() => revoke(p)} className="flex shrink-0 items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900"><Undo2 size={13} />Quitar</button>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
        <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
          <Card>
            <h2 className="mb-2 flex items-center gap-2 text-sm font-extrabold"><ShieldCheck size={16} className="text-emerald-600" />Reporte</h2>
            <pre className="mb-3 whitespace-pre-wrap text-xs leading-relaxed text-slate-600">{report}</pre>
            <label className="mb-1 flex items-center justify-between text-xs font-bold text-slate-600"><span className="flex items-center gap-1"><Clock size={12} />Minutos que te toma una pieza</span><input type="number" min={5} max={120} value={minutes} onChange={(e) => setMinutes(Math.min(120, Math.max(5, Number(e.target.value) || 25)))} className="w-16 rounded-xl border border-slate-200 px-2 py-1 text-right text-sm" /></label>
            <p className="mb-3 text-[11px] text-slate-500">Ajústalo a tu realidad. Otras plataformas prometen «20 horas al mes»; aquí la cifra sale de tu propio supuesto.</p>
            <Btn variant="soft" className="w-full" onClick={() => void navigator.clipboard.writeText(report)}><ClipboardCopy size={15} />Copiar reporte</Btn>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function DraftCard({ p, r, studio, onApprove, onEdit }: { p: Post; r: EthicsReport; studio: Studio; onApprove: () => void; onEdit: () => void }) {
  const blocked = hasBlocking(r);
  return (
    <div className={`rounded-3xl border bg-white p-3 ${blocked ? "border-rose-300" : "border-slate-200"}`}>
      <FitThumb post={p} studio={studio} />
      <div className="mt-3 flex items-center justify-between gap-2">
        <Chip color="#64748b">{fmt(p.scheduledAt)}</Chip>
        {r.issues.length === 0 ? <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700"><CheckCircle2 size={13} />Sin observaciones</span> : blocked ? <span className="flex items-center gap-1 text-[11px] font-bold text-rose-600"><XCircle size={13} />No se puede aprobar</span> : <span className="flex items-center gap-1 text-[11px] font-bold text-amber-700"><AlertTriangle size={13} />{r.issues.length} aviso(s)</span>}
      </div>
      <p className="mt-1 line-clamp-2 text-xs font-semibold">{p.topic || FORMAT_BY_ID[p.format].title}</p>
      {r.issues.slice(0, 2).map((i, n) => <p key={n} className={`mt-1 rounded-xl px-2 py-1 text-[11px] ${i.severity === "error" ? "bg-rose-50 text-rose-800" : "bg-amber-50 text-amber-900"}`}>«{i.excerpt}»: {i.message}</p>)}
      <div className="mt-2 grid grid-cols-2 gap-1.5">
        <button onClick={onEdit} className="flex items-center justify-center gap-1.5 rounded-xl bg-soft py-2 text-xs font-bold text-brand"><Pencil size={13} />Editar</button>
        <button disabled={blocked} onClick={onApprove} className="flex items-center justify-center gap-1.5 rounded-xl bg-brand py-2 text-xs font-bold text-white disabled:bg-slate-300"><CheckCircle2 size={13} />Aprobar</button>
      </div>
    </div>
  );
}
