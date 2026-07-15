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

/** Toast pill escuro, centrado no rodapé, ~2.6s. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toast = useCallback((m: string) => {
    setMsg(m);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(""), 2600);
  }, []);

  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      {msg && (
        <div
          role="status"
          className="fixed bottom-7 left-1/2 z-[200] -translate-x-1/2 rounded-full bg-dark px-6 py-3 text-sm font-bold text-white shadow-toast"
        >
          {msg}
        </div>
      )}
    </Ctx.Provider>
  );
}
