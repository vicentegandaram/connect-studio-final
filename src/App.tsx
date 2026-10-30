import { useState } from "react";
import { CalendarDays, FileText, Home, Palette as PaletteIcon, Plus, ShieldCheck } from "lucide-react";
import { useStudio } from "./lib/store";
import { BrandView } from "./components/app/BrandView";
import { CalendarView } from "./components/app/CalendarView";
import { CreateView, type CreateStep } from "./components/app/CreateView";
import { HomeView } from "./components/app/HomeView";
import { PostsView } from "./components/app/PostsView";
import { ApprovalView, pendingCount } from "./components/app/ApprovalView";

type View = "inicio" | "calendario" | "crear" | "aprobacion" | "posts" | "brand";

const NAV: { id: Exclude<View, "crear">; label: string; icon: typeof Home }[] = [
  { id: "inicio", label: "Inicio", icon: Home },
  { id: "calendario", label: "Calendario", icon: CalendarDays },
  { id: "aprobacion", label: "Aprobación", icon: ShieldCheck },
  { id: "posts", label: "Mis posts", icon: FileText },
  { id: "brand", label: "Brand DNA", icon: PaletteIcon },
];

export default function App() {
  const studio = useStudio();
  const [view, setView] = useState<View>("inicio");
  const [step, setStep] = useState<CreateStep>("pick");
  const edit = (id?: string) => { if (id) studio.select(id); setStep("edit"); setView("crear"); };
  const create = () => { setStep("pick"); setView("crear"); };

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-slate-200 bg-white p-4 md:flex">
        <p className="mb-6 px-2 text-2xl font-extrabold tracking-tight">Connect<span className="text-brand">·</span>Studio</p>
        <nav className="flex flex-col gap-1" aria-label="Principal">
          {NAV.slice(0, 2).map((n) => <NavBtn key={n.id} {...n} badge={n.id === "aprobacion" ? pendingCount(studio.state.posts) : 0} active={view === n.id} onClick={() => setView(n.id)} />)}
          <button onClick={create} className={`my-2 flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/25 ${view === "crear" ? "bg-blue-800" : "bg-brand hover:bg-blue-700"}`}><Plus size={18} />Crear publicación</button>
          {NAV.slice(2).map((n) => <NavBtn key={n.id} {...n} badge={n.id === "aprobacion" ? pendingCount(studio.state.posts) : 0} active={view === n.id} onClick={() => setView(n.id)} />)}
        </nav>
        <p className="mt-auto px-2 text-[11px] text-slate-400">Demo · tus datos se guardan solo en este navegador. No uses información real de pacientes.</p>
      </aside>

      <main className="min-w-0 flex-1 p-4 pb-24 md:p-8">
        <div className="mx-auto max-w-6xl">
          {view === "inicio" && <HomeView studio={studio} onOpen={() => edit()} onPackage={() => setView("aprobacion")} />}
          {view === "aprobacion" && <ApprovalView studio={studio} onEdit={edit} />}
          {view === "calendario" && <CalendarView studio={studio} onOpen={edit} />}
          {view === "crear" && <CreateView studio={studio} step={step} setStep={setStep} />}
          {view === "posts" && <PostsView studio={studio} onOpen={edit} />}
          {view === "brand" && <BrandView studio={studio} />}
        </div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-around border-t border-slate-200 bg-white/95 p-2 backdrop-blur md:hidden" aria-label="Principal móvil">
        {NAV.slice(0, 2).map((n) => <MobBtn key={n.id} {...n} badge={0} active={view === n.id} onClick={() => setView(n.id)} />)}
        <button onClick={create} aria-label="Crear publicación" className="grid h-12 w-12 -translate-y-3 place-items-center rounded-full bg-brand text-white shadow-lg"><Plus /></button>
        {NAV.slice(2).map((n) => <MobBtn key={n.id} {...n} badge={0} active={view === n.id} onClick={() => setView(n.id)} />)}
      </nav>
    </div>
  );
}

type NB = { label: string; icon: typeof Home; active: boolean; badge: number; onClick: () => void };
const NavBtn = ({ label, icon: Icon, active, badge, onClick }: NB) => (
  <button onClick={onClick} className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold ${active ? "bg-soft text-brand" : "text-slate-600 hover:bg-slate-50"}`}><Icon size={18} />{label}{badge > 0 && <span className="ml-auto rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-slate-950">{badge}</span>}</button>
);
const MobBtn = ({ label, icon: Icon, active, onClick }: NB) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-0.5 px-2 text-[10px] font-semibold ${active ? "text-brand" : "text-slate-500"}`}><Icon size={20} />{label}</button>
);
