import { useEffect, type ReactNode } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** largura máxima em px (default 620) */
  width?: number;
  /** Classes extras no painel interno */
  className?: string;
  /** Cabeçalho fixo (não rola com o conteúdo). */
  header?: ReactNode;
  /** Rodapé fixo (não rola com o conteúdo). */
  footer?: ReactNode;
}

/** Overlay clicável fecha; clique interno não propaga. Esc fecha. */
export default function Modal({
  open,
  onClose,
  children,
  width = 620,
  className = "",
  header,
  footer,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const estruturado = header != null || footer != null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(20,25,30,.5)] p-6"
      onClick={onClose}
    >
      <div
        className={[
          "flex max-h-[90vh] w-full flex-col rounded-modal bg-white shadow-modal",
          estruturado
            ? "overflow-hidden"
            : className || "overflow-auto p-8",
          estruturado && className ? className : "",
        ]
          .filter(Boolean)
          .join(" ")}
        style={{ maxWidth: width }}
        onClick={(e) => e.stopPropagation()}
      >
        {estruturado ? (
          <>
            {header != null && (
              <div className="flex-none px-8 pb-3 pt-8">{header}</div>
            )}
            <div
              className={[
                "min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-8",
                header != null ? "pt-1" : "pt-8",
                footer != null ? "pb-5" : "pb-8",
              ].join(" ")}
            >
              {children}
            </div>
            {footer != null && (
              <div className="flex-none border-t border-black/[.06] bg-white px-8 py-4">
                {footer}
              </div>
            )}
          </>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
