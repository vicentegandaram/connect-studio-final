import { CalendarDays, CheckCircle2, Copy, Pencil, Trash2 } from "lucide-react";
import type { Studio } from "../../lib/store";
import { FORMAT_BY_ID } from "../../data/formats";
import { FeedHarmonizer } from "../studio/RightPanel";
import { reviewPost } from "../../lib/ethics";
import { Card, Chip, FitThumb, PageTitle, STATUS_COLOR } from "./ui";

export function PostsView({ studio, onOpen }: { studio: Studio; onOpen: (id: string) => void }) {
  const { posts } = studio.state;
  return (
    <div className="fade-up">
      <PageTitle title="Mis posts" subtitle="Tus publicaciones guardadas en este navegador y cómo se verán juntas en tu perfil." />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid grid-cols-2 items-start gap-4 md:grid-cols-3">
          {posts.map((p) => {
            const status = p.status ?? "borrador";
            return (
              <div key={p.id} className="rounded-3xl border border-slate-200 bg-white p-3">
                <FitThumb post={p} studio={studio} />
                <div className="mt-3 flex items-center justify-between">
                  <Chip color={STATUS_COLOR[status]}>{status}</Chip>
                  <span className="flex items-center gap-1 text-[11px] text-slate-500">{p.scheduledAt && <><CalendarDays size={12} />{p.scheduledAt}</>}</span>
                </div>
                <p className="mt-1 line-clamp-2 text-xs font-semibold">{p.topic || FORMAT_BY_ID[p.format].title}</p>
                <div className="mt-2 flex gap-1.5">
                  <button title="Editar" aria-label="Editar" onClick={() => onOpen(p.id)} className="grid h-9 flex-1 place-items-center rounded-xl bg-soft text-brand"><Pencil size={15} /></button>
                  <button title="Duplicar" aria-label="Duplicar" onClick={() => { studio.select(p.id); studio.duplicate(); }} className="grid h-9 flex-1 place-items-center rounded-xl border border-slate-200"><Copy size={15} /></button>
                  <button title="Marcar publicado" aria-label="Marcar publicado" onClick={() => { const why = studio.moveStatus(p.id, "publicado", reviewPost(p)); if (why) alert(why); }} className="grid h-9 flex-1 place-items-center rounded-xl border border-slate-200 text-emerald-700"><CheckCircle2 size={15} /></button>
                  <button title="Borrar" aria-label="Borrar" disabled={posts.length <= 1} onClick={() => confirm("¿Borrar este post?") && studio.remove(p.id)} className="grid h-9 flex-1 place-items-center rounded-xl border border-slate-200 text-rose-600 disabled:opacity-30"><Trash2 size={15} /></button>
                </div>
              </div>
            );
          })}
        </div>
        <Card className="xl:sticky xl:top-6 xl:self-start"><FeedHarmonizer studio={studio} /></Card>
      </div>
    </div>
  );
}
