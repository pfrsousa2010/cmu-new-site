import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";

interface ToastCtx {
  toast: (msg: string) => void;
}

const Ctx = createContext<ToastCtx>({ toast: () => {} });

export function useToast() {
  return useContext(Ctx);
}

/** Confirmação curta: some rápido para não atrapalhar. */
const MS_MINIMO = 2600;
/** Teto para o aviso mais longo não ficar plantado na tela. */
const MS_MAXIMO = 9000;
/** ~55ms por caractere, folgado para leitura sem pressa. */
const MS_POR_CARACTERE = 55;

function duracao(msg: string): number {
  return Math.min(MS_MAXIMO, Math.max(MS_MINIMO, msg.length * MS_POR_CARACTERE));
}

/**
 * Toast escuro, centrado no rodapé. O tempo acompanha o tamanho da mensagem:
 * há avisos de duas frases (limite do Unsplash, por exemplo) que ninguém
 * termina de ler em 2,6s.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toast = useCallback((m: string) => {
    setMsg(m);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(""), duracao(m));
  }, []);

  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      {msg && (
        <div
          role="status"
          // `rounded-[22px]` em vez de `rounded-full`: numa linha dá o mesmo
          // desenho (a pílula tem 44px de altura), mas quando o texto quebra
          // o `full` viraria uma cápsula deformada.
          //
          // Centralizado por `inset-x-4 mx-auto`, e não por `left-1/2` com
          // translate: ali o espaço disponível é só da metade da tela para a
          // direita, e no celular uma mensagem longa era espremida em 188px.
          className="fixed inset-x-4 bottom-7 z-[200] mx-auto w-fit max-w-[420px] rounded-[22px] bg-dark px-6 py-3 text-center text-sm font-bold leading-[1.5] text-white shadow-toast"
        >
          {msg}
        </div>
      )}
    </Ctx.Provider>
  );
}
