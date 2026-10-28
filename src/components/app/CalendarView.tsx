import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Studio } from "../../lib/store";
import { FORMAT_BY_ID } from "../../data/formats";
import { todayISO } from "../../lib/planner";
import { Card, PageTitle } from "./ui";

const DOW = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const iso = (y: number, m: number, d: number) => `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

export function CalendarView({ studio, onOpen }: { studio: Studio; onOpen: (id: string) => void }) {
  const posts = studio.state.posts;
  const now = new Date();
  const [ym, setYm] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const first = (new Date(ym.y, ym.m, 1).getDay() + 6) % 7;
  const days = new Date(ym.y, ym.m + 1, 0).getDate();
  const cells = Array.from({ length: Math.ceil((first + days) / 7) * 7 }, (_, i) => i - first + 1);
  const move = (d: number) => setYm((c) => { const n = new Date(c.y, c.m + d, 1); return { y: n.getFullYear(), m: n.getMonth() }; });
  const today = todayISO();
  const unscheduled = posts.filter((p) => !p.scheduledAt && p.status !== "publicado");
  return (
    <div className="fade-up">
      <PageTitle title="Calendario" subtitle="Programa tus publicaciones y ve la semana de un vistazo." />
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <button aria-label="Mes anterior" onClick={() => move(-1)} className="grid h-9 w-9 place-items-center rounded-full border border-slate-200"><ChevronLeft size={16} /></button>
          <h2 className="text-lg font-extrabold capitalize">{new Date(ym.y, ym.m, 1).toLocaleDateString("es-CL", { month: "long", year: "numeric" })}</h2>
          <button aria-label="Mes siguiente" onClick={() => move(1)} className="grid h-9 w-9 place-items-center rounded-full border border-slate-200"><ChevronRight size={16} /></button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-slate-500">{DOW.map((d) => <div key={d}>{d}</div>)}</div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {cells.map((d, i) => {
            const valid = d >= 1 && d <= days;
            const key = valid ? iso(ym.y, ym.m, d) : "";
            const items = valid ? posts.filter((p) => p.scheduledAt === key) : [];
            return (
              <div key={i} className={`min-h-20 rounded-2xl border p-1.5 text-xs ${valid ? "border-slate-200" : "border-transparent"} ${key === today ? "bg-soft" : "bg-white"}`}>
                {valid && <span className={`font-bold ${key === today ? "text-brand" : "text-slate-600"}`}>{d}</span>}
                {items.map((p) => (
                  <button key={p.id} onClick={() => onOpen(p.id)} className={`mt-1 block w-full truncate rounded-lg px-1.5 py-1 text-left text-[10px] font-bold ${p.status === "publicado" ? "bg-emerald-100 text-emerald-800" : "bg-brand text-white"}`}>{p.topic || FORMAT_BY_ID[p.format].title}</button>
                ))}
              </div>
            );
          })}
        </div>
      </Card>
      {unscheduled.length > 0 && <p className="mt-4 text-sm text-slate-500">{unscheduled.length} post(s) sin fecha: ábrelos desde «Mis posts» para programarlos.</p>}
    </div>
  );
}
