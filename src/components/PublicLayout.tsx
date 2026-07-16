import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";

const WHATSAPP_URL =
  "https://wa.me/554333256488?text=Ol%C3%A1!%20Vim%20pelo%20site%20do%20Clube%20das%20M%C3%A3es%20Unidas.";

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
              className="flex-none animate-cta-pulse rounded-full bg-laranja px-[22px] py-2.5 font-display text-sm font-extrabold text-white shadow-[0_3px_10px_rgba(238,118,35,.35)] transition-colors hover:bg-laranja-hover hover:text-white"
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
                aria-label="Facebook"
                className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-azul text-white hover:text-white"
              >
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className="h-[18px] w-[18px] fill-current"
                >
                  <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
                </svg>
              </a>
              <a
                href="https://instagram.com/clubedasmaesunidas"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-vermelho text-white hover:text-white"
              >
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className="h-[18px] w-[18px] fill-current"
                >
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </a>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noreferrer"
                aria-label="WhatsApp"
                className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-verde text-white hover:text-white"
              >
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className="h-[18px] w-[18px] fill-current"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
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

      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noreferrer"
        aria-label="Dúvidas? Fale conosco"
        className="group fixed bottom-6 right-6 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_6px_20px_rgba(37,211,102,.45)] transition-transform hover:scale-105 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366]"
      >
        <span className="pointer-events-none absolute right-full top-1/2 mr-3 -translate-y-1/2 whitespace-nowrap rounded-lg bg-dark px-3 py-2 text-[13px] font-semibold text-white opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
          Dúvidas? Fale conosco
        </span>
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="h-7 w-7 fill-current"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </a>
    </div>
  );
}
