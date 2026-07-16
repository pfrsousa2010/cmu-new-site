import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export default function Login() {
  const { session, isAdmin, loading, signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-admin-bg text-ink-2">
        Carregando…
      </div>
    );
  }

  if (session && isAdmin) return <Navigate to="/admin" replace />;

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setCarregando(true);
    const { error } = await signIn(email.trim(), senha);
    setCarregando(false);
    if (error) {
      const msg = error.toLowerCase();
      if (msg.includes("restrito") || msg.includes("permissão")) {
        setErro(error);
      } else {
        setErro("E-mail ou senha inválidos.");
      }
      return;
    }
    navigate("/admin", { replace: true });
  };

  const inputCls =
    "w-full rounded-xl border-[1.5px] border-black/[.13] px-[14px] py-3 text-[15px] outline-none transition-colors focus:border-azul";

  return (
    <div className="flex min-h-screen items-center justify-center bg-admin-bg px-6">
      <div className="w-full max-w-[400px]">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <img
            src="/logo-cmu.png"
            alt="Clube das Mães Unidas"
            className="h-16 w-16 object-contain"
          />
          <div className="font-display text-xl font-black leading-tight">
            Clube das Mães Unidas
            <span className="text-laranja"> · Admin</span>
          </div>
          <p className="m-0 max-w-[280px] text-[14px] leading-snug text-ink-2">
            Área restrita da administração do site
          </p>
        </div>

        <form
          onSubmit={entrar}
          className="grid gap-3.5 rounded-modal bg-white p-8 shadow-card"
        >
          <div className="font-display text-lg font-extrabold">Entrar</div>
          <div>
            <div className="mb-1.5 text-[13px] font-bold">E-mail</div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputCls}
              placeholder="voce@exemplo.com"
            />
          </div>
          <div>
            <div className="mb-1.5 text-[13px] font-bold">Senha</div>
            <div className="relative">
              <input
                type={mostrarSenha ? "text" : "password"}
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className={`${inputCls} pr-12`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setMostrarSenha((v) => !v)}
                aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-ink-3 transition-colors hover:text-ink"
              >
                {mostrarSenha ? (
                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    className="h-5 w-5 fill-none stroke-current"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    className="h-5 w-5 fill-none stroke-current"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          {erro && <div className="text-sm font-semibold text-vermelho">{erro}</div>}
          <button
            type="submit"
            disabled={carregando}
            className="mt-1 rounded-xl bg-azul px-3 py-[13px] text-center font-display text-base font-extrabold text-white transition-colors hover:bg-azul-hover disabled:opacity-60"
          >
            {carregando ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
