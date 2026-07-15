import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";

const NAV = [
  { to: "/", label: "Início", end: true },
  { to: "/sobre", label: "Sobre nós" },
  { to: "/projetos", label: "Projetos" },
  { to: "/cursos", label: "Cursos" },
  { to: "/eventos", label: "Eventos" },
  { to: "/parceiros", label: "Parceiros" },
  { to: "/editais", label: "Editais" },
  { to: "/transparencia", label: "Transparência" },
  { to: "/contato", label: "Contato" },
];

function navClass({ isActive }: { isActive: boolean }) {
  return [
    "rounded-full px-[13px] py-2 text-sm whitespace-nowrap transition-colors",
    isActive
      ? "font-extrabold text-azul bg-azul/10"
      : "font-semibold text-ink-mid hover:bg-azul/[.08]",
  ].join(" ");
}

export default function PublicLayout() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-black/[.07] bg-white/[.94] backdrop-blur-[10px]">
        <div className="mx-auto flex h-[72px] max-w-container items-center gap-6 px-6">
          <Link to="/" className="flex flex-none items-center gap-2.5">
            <img
              src="/logo-cmu.png"
              alt="Clube das Mães Unidas"
              className="h-11 w-11 object-contain"
            />
            <span className="font-display text-[15px] font-black leading-[1.1] text-ink">
              Clube das
              <br />
              Mães Unidas
            </span>
          </Link>

          {/* Nav desktop */}
          <nav className="hidden flex-1 flex-wrap justify-center gap-0.5 lg:flex">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end} className={navClass}>
                {n.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex flex-1 items-center justify-end gap-2 lg:flex-none lg:flex-initial">
            <Link
              to="/doar"
              className="flex-none rounded-full bg-laranja px-[22px] py-2.5 font-display text-sm font-extrabold text-white shadow-[0_3px_10px_rgba(238,118,35,.35)] transition-colors hover:bg-laranja-hover hover:text-white"
            >
              Doe aqui ♥
            </Link>
            {/* Hamburger */}
            <button
              type="button"
              aria-label="Menu"
              onClick={() => setOpen((v) => !v)}
              className="flex h-11 w-11 items-center justify-center rounded-full text-ink hover:bg-black/[.05] lg:hidden"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                {open ? (
                  <>
                    <line x1="6" y1="6" x2="18" y2="18" />
                    <line x1="6" y1="18" x2="18" y2="6" />
                  </>
                ) : (
                  <>
                    <line x1="3" y1="7" x2="21" y2="7" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="17" x2="21" y2="17" />
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Nav mobile */}
        {open && (
          <nav className="border-t border-black/[.07] bg-white px-4 py-3 lg:hidden">
            <div className="mx-auto flex max-w-container flex-col gap-1">
              {NAV.map((n) => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  end={n.end}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    [
                      "rounded-xl px-4 py-3 text-[15px]",
                      isActive
                        ? "bg-azul/10 font-extrabold text-azul"
                        : "font-semibold text-ink-mid",
                    ].join(" ")
                  }
                >
                  {n.label}
                </NavLink>
              ))}
            </div>
          </nav>
        )}
      </header>

      {/* Conteúdo */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="mt-auto bg-dark text-white">
        <div className="mx-auto grid max-w-container grid-cols-1 gap-10 px-6 pb-8 pt-[52px] md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <img
              src="/logo-dark-theme.png"
              alt="Clube das Mães Unidas"
              className="mb-4 h-16 object-contain"
            />
            <div className="text-sm leading-[1.7] text-white/70">
              R. Roseiral, 77 – Jd. Interlagos
              <br />
              86035-330 – Londrina/PR
              <br />
              Telefone: (43) 3325-6488
            </div>
          </div>
          <div>
            <div className="mb-3.5 font-display text-[15px] font-extrabold">
              Acesso rápido
            </div>
            <div className="grid gap-[9px] text-sm">
              {[
                ["/sobre", "Sobre nós"],
                ["/projetos", "Projetos"],
                ["/cursos", "Cursos"],
                ["/transparencia", "Transparência"],
              ].map(([to, label]) => (
                <Link
                  key={to}
                  to={to}
                  className="text-white/70 hover:text-white"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-3.5 font-display text-[15px] font-extrabold">
              Siga nossas redes
            </div>
            <div className="flex gap-2.5">
              <a
                href="https://facebook.com/clubedasmaesunidas"
                target="_blank"
                rel="noreferrer"
                className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-azul text-sm font-extrabold text-white hover:text-white"
              >
                f
              </a>
              <a
                href="https://instagram.com/clubedasmaesunidas"
                target="_blank"
                rel="noreferrer"
                className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-vermelho text-sm font-extrabold text-white hover:text-white"
              >
                ig
              </a>
              <a
                href="https://wa.me/554333256488?text=Ol%C3%A1!%20Vim%20pelo%20site%20do%20Clube%20das%20M%C3%A3es%20Unidas."
                target="_blank"
                rel="noreferrer"
                aria-label="WhatsApp"
                className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-verde text-sm font-extrabold text-white hover:text-white"
              >
                wa
              </a>
            </div>
          </div>
        </div>
        <div className="border-t border-white/[.12]">
          <div className="mx-auto flex max-w-container flex-wrap items-center justify-between gap-2 px-6 py-[18px] text-[13px] text-white/55">
            <span>© 2026 Clube das Mães Unidas</span>
            <span>
              Desenvolvido por{" "}
              <a
                href="https://microfocus.dev.br/"
                target="_blank"
                rel="noreferrer"
                className="text-white/55 underline decoration-white/25 underline-offset-2 transition-colors hover:text-white hover:decoration-white/50"
              >
                Micro Focus
              </a>
            </span>
            <span>Termos de uso · Política de Privacidade</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
