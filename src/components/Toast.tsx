import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";

interface ToastCtx {
  /**
   * Com `aoClicar`, a pílula inteira vira botão — para o aviso que não é
   * confirmação do que já aconteceu, e sim convite para fazer algo.
   */
  toast: (msg: string, aoClicar?: () => void) => void;
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
  const [{ msg, aoClicar }, setAviso] = useState<{
    msg: string;
    aoClicar?: () => void;
  }>({ msg: "" });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fechar = useCallback(() => setAviso({ msg: "" }), []);

  const toast = useCallback((m: string, acao?: () => void) => {
    setAviso({ msg: m, aoClicar: acao });
    if (timer.current) clearTimeout(timer.current);
    // Convite fica o tempo máximo: ler é rápido, decidir e tocar não é.
    timer.current = setTimeout(() => setAviso({ msg: "" }), acao ? MS_MAXIMO : duracao(m));
  }, []);

  // A pílula é a mesma nos dois casos; só o elemento muda, para o toque
  // ter afordância de botão e chegar a quem navega por teclado.
  const pilula = [
    "w-full rounded-[22px] bg-dark px-6 py-3 text-center text-sm font-bold leading-[1.5] text-white shadow-toast",
    aoClicar ? "underline decoration-white/40 underline-offset-4" : "",
  ].join(" ");

  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      {msg && (
        <div
          role="status"
          // Centralizado por `inset-x-4 mx-auto`, e não por `left-1/2` com
          // translate: ali o espaço disponível é só da metade da tela para a
          // direita, e no celular uma mensagem longa era espremida em 188px.
          //
          // `rounded-[22px]` na pílula, em vez de `rounded-full`: numa linha
          // dá o mesmo desenho (ela tem 44px de altura), mas quando o texto
          // quebra o `full` viraria uma cápsula deformada.
          className="fixed inset-x-4 bottom-7 z-[200] mx-auto w-fit max-w-[420px]"
        >
          {aoClicar ? (
            <button
              type="button"
              onClick={() => {
                fechar();
                aoClicar();
              }}
              className={pilula}
            >
              {msg}
            </button>
          ) : (
            <div className={pilula}>{msg}</div>
          )}
        </div>
      )}
    </Ctx.Provider>
  );
}
