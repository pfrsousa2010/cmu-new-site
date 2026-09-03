import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { nomeCurto } from "@/lib/cursos";
import { estaInstalado } from "@/lib/pwa";
import BotaoInstalar from "@/components/BotaoInstalar";

const MENU = [
  { to: "/admin", label: "Visão geral", icone: "⌂", end: true },
  { to: "/admin/eventos", label: "Eventos e fotos", icone: "📅" },
  { to: "/admin/arquivos", label: "Editais e arquivos", icone: "📄" },
  { to: "/admin/cursos", label: "Cursos (SGE)", icone: "🎓" },
  { to: "/admin/hero", label: "Fotos da página inicial", icone: "🖼" },
  { to: "/admin/parceiros", label: "Logos dos parceiros", icone: "🤝" },
  { to: "/admin/depoimentos", label: "Depoimentos", icone: "💬" },
];

function iniciais(nome?: string | null, email?: string | null) {
  const base = (nome || email || "").trim();
  if (!base) return "AD";
  const partes = base.split(/\s+/).filter(Boolean);
  if (partes.length >= 2) {
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
  }
  return base.slice(0, 2).toUpperCase();
}

export default function AdminLayout() {
  const { session, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const email = profile?.email ?? session?.user.email;
  const nome = profile?.nome?.trim() || email;
  // Lido no render, sem estado: o modo de exibição é decidido quando a
  // janela abre e não muda enquanto o painel está aberto.
  const emApp = estaInstalado();

  const sair = async () => {
    await signOut();
    navigate("/admin/login", { replace: true });
  };

  const itemCls = ({ isActive }: { isActive: boolean }) =>
    [
      "flex items-center gap-[11px] rounded-[11px] px-3.5 py-[11px] text-sm transition-colors",
      isActive
        ? "bg-white/[.12] font-extrabold text-white"
        : "font-semibold text-white/65 hover:bg-white/[.08]",
    ].join(" ");

  return (
    <div className="flex min-h-screen bg-admin-bg">
      {/* Sidebar */}
      <aside
        className={[
          "fixed inset-y-0 left-0 z-40 flex w-[240px] flex-none flex-col bg-dark text-white transition-transform md:sticky md:top-0 md:h-screen md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="flex items-center gap-2.5 border-b border-white/10 px-5 py-[22px]">
          <img
            src="/logo-cmu.png"
            alt=""
            className="h-9 w-9 rounded-[9px] bg-white p-[3px] object-contain"
          />
          <div className="font-display text-[13px] font-extrabold leading-[1.2]">
            Clube das Mães
            <br />
            Unidas · <span className="text-laranja">Admin</span>
          </div>
        </div>
        <nav className="grid gap-1 p-3">
          {MENU.map((m) => (
            <NavLink
              key={m.to}
              to={m.to}
              end={m.end}
              onClick={() => setOpen(false)}
              className={itemCls}
            >
              <span className="text-base">{m.icone}</span>
              {m.label}
            </NavLink>
          ))}
        </nav>
        {/* `empty:p-0` porque no app instalado os dois itens somem: sem isso
            sobraria uma faixa de 24px acima do bloco do usuário. O `mt-auto`
            continua empurrando o rodapé para baixo mesmo colapsado. */}
        <div className="mt-auto grid gap-1 p-3 empty:p-0">
          <BotaoInstalar aoNavegar={() => setOpen(false)} />

          {/* Instalado, o painel é um app à parte: "Voltar ao site" jogaria
              para fora do escopo e o Chrome abriria uma barra de navegador
              por cima. Fora do app, o link continua sendo a saída de quem
              entrou no painel sem querer. */}
          {!emApp && (
            <NavLink
              to="/"
              onClick={() => setOpen(false)}
              className="flex items-center gap-[11px] rounded-[11px] px-3.5 py-[11px] text-sm font-semibold text-white/65 transition-colors hover:bg-white/[.08]"
            >
              <span aria-hidden="true" className="text-base">
                ←
              </span>
              Voltar ao site
            </NavLink>
          )}
        </div>
        <div className="flex items-center gap-2.5 border-t border-white/10 px-5 py-[18px]">
          <div className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-verde text-[13px] font-extrabold">
            {iniciais(profile?.nome, email)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-bold" title={email}>
              {nome ? nomeCurto(nome) : ""}
            </div>
            <button
              onClick={sair}
              className="text-[11.5px] text-white/50 hover:text-white"
            >
              Sair
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay mobile */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Conteúdo */}
      <div className="min-w-0 flex-1">
        {/* Topbar mobile — fixa no topo para o menu ficar sempre ao alcance nas
            listas longas. z-20 de propósito: abaixo do overlay (z-30) e da
            sidebar (z-40), senão apareceria por cima do escurecido. */}
        <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-black/[.06] bg-white px-4 py-3 md:hidden">
          <button
            aria-label="Menu"
            onClick={() => setOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-black/[.05]"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="3" y1="7" x2="21" y2="7" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="17" x2="21" y2="17" />
            </svg>
          </button>
          <span className="font-display font-extrabold">Admin</span>
        </div>

        <div className="p-6 md:p-9">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
