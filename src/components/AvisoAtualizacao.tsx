import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { observarAtualizacao } from "@/lib/pwa";

/**
 * Barra no topo do painel quando o service worker novo já baixou e espera.
 * Quem está no deploy atual não vê nada — não há worker em espera.
 * Sem "dispensar": esconder o aviso deixaria a pessoa na versão velha.
 */
export default function AvisoAtualizacao() {
  const { pathname } = useLocation();
  const [aplicar, setAplicar] = useState<(() => void) | null>(null);

  useEffect(() => {
    if (!pathname.startsWith("/admin")) {
      setAplicar(null);
      return;
    }
    return observarAtualizacao((fn) => setAplicar(() => fn));
  }, [pathname]);

  if (!aplicar) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-0 top-0 z-[90] flex flex-wrap items-center justify-center gap-x-3 gap-y-2 bg-dark px-4 py-2.5 pt-[max(0.625rem,env(safe-area-inset-top))] text-white shadow-card"
    >
      <p className="m-0 text-sm font-semibold">Há uma versão nova do painel.</p>
      <button
        type="button"
        onClick={aplicar}
        className="shrink-0 rounded-lg bg-laranja px-3 py-1.5 font-display text-sm font-extrabold text-white transition-colors hover:bg-laranja-hover"
      >
        Atualizar
      </button>
    </div>
  );
}
