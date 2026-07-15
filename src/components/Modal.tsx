import { useEffect, type ReactNode } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** largura máxima em px (default 620) */
  width?: number;
  /** Classes extras no painel interno */
  className?: string;
}

/** Overlay clicável fecha; clique interno não propaga. Esc fecha. */
export default function Modal({
  open,
  onClose,
  children,
  width = 620,
  className = "",
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

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(20,25,30,.5)] p-6"
      onClick={onClose}
    >
      <div
        className={[
          "max-h-[90vh] w-full rounded-modal bg-white shadow-modal",
          className || "overflow-auto p-8",
        ].join(" ")}
        style={{ maxWidth: width }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
