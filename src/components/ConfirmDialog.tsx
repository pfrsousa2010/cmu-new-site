import Modal from "@/components/Modal";

interface ConfirmDialogProps {
  open: boolean;
  titulo: string;
  descricao?: string;
  /** Rótulo do botão que confirma. */
  confirmLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
}

/**
 * Confirmação de ação destrutiva.
 *
 * Substitui o `window.confirm` nativo, que alguns navegadores e webviews
 * suprimem — quando isso acontece o confirm devolve `false` e a ação
 * simplesmente não executa, sem nenhum aviso ao usuário.
 */
export default function ConfirmDialog({
  open,
  titulo,
  descricao,
  confirmLabel = "Remover",
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} width={440}>
      <h2 className="m-0 font-display text-[20px] font-black leading-snug text-ink">
        {titulo}
      </h2>
      {descricao && (
        <p className="mt-2 text-[14.5px] leading-[1.55] text-ink-2">
          {descricao}
        </p>
      )}
      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border-[1.5px] border-black/[.12] bg-white px-6 py-2.5 font-display text-sm font-extrabold text-ink transition-colors hover:border-azul hover:text-azul"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="rounded-full bg-vermelho px-6 py-2.5 font-display text-sm font-extrabold text-white transition-colors hover:bg-vermelho-hover"
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
