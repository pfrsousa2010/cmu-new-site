import { useEffect, useRef, useState } from "react";
import Modal from "@/components/Modal";
import LoadingLogo from "@/components/LoadingLogo";
import {
  carregarImagem,
  detectarConteudo,
  type Recorte,
} from "@/lib/parceiros";

interface RecorteImagemProps {
  open: boolean;
  /** URL da imagem já publicada (carregada com crossOrigin para o canvas). */
  src: string | null;
  nome: string;
  onClose: () => void;
  onAplicar: (img: HTMLImageElement, recorte: Recorte) => Promise<void> | void;
}

type Arraste =
  | { tipo: "mover"; px: number; py: number; base: Recorte }
  | { tipo: "canto"; canto: Canto; px: number; py: number; base: Recorte };

type Canto = "no" | "ne" | "so" | "se";

/** Lado mínimo do recorte, em pixels da imagem original. */
const MIN_LADO = 24;

/**
 * Recorte manual de imagem. A área é guardada sempre em pixels da imagem
 * original; a tela só aplica uma escala para desenhar. Assim o recorte não
 * perde precisão quando a modal muda de tamanho.
 */
export default function RecorteImagem({
  open,
  src,
  nome,
  onClose,
  onAplicar,
}: RecorteImagemProps) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [aplicando, setAplicando] = useState(false);
  const [area, setArea] = useState<Recorte | null>(null);
  const [escala, setEscala] = useState(1);
  const [larguraPalco, setLarguraPalco] = useState(0);
  const arrasteRef = useRef<Arraste | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open || !src) {
      setImg(null);
      setArea(null);
      setErro("");
      return;
    }
    let ativo = true;
    setCarregando(true);
    setErro("");
    carregarImagem(src)
      .then((imagem) => {
        if (!ativo) return;
        setImg(imagem);
        // Abre já na sugestão automática: costuma ser o recorte desejado.
        setArea(
          detectarConteudo(imagem) ?? {
            x: 0,
            y: 0,
            w: imagem.naturalWidth,
            h: imagem.naturalHeight,
          }
        );
        setCarregando(false);
      })
      .catch((e) => {
        if (!ativo) return;
        setErro((e as Error).message);
        setCarregando(false);
      });
    return () => {
      ativo = false;
    };
  }, [open, src]);

  /**
   * Tamanho de exibição: cabe na largura disponível E numa fração da altura da
   * janela. Sem o limite de altura, um logo quadrado ocupa um quadrado enorme e
   * empurra os botões para fora da tela.
   */
  useEffect(() => {
    if (!img) return;
    const medir = () => {
      const maxLargura = wrapRef.current?.clientWidth || img.naturalWidth;
      const maxAltura = Math.max(200, window.innerHeight * 0.44);
      const largura = Math.min(
        maxLargura,
        (maxAltura * img.naturalWidth) / img.naturalHeight
      );
      setLarguraPalco(largura);
      setEscala(largura / img.naturalWidth);
    };
    medir();
    window.addEventListener("resize", medir);
    return () => window.removeEventListener("resize", medir);
  }, [img]);

  const limitar = (r: Recorte): Recorte => {
    if (!img) return r;
    const w = Math.max(MIN_LADO, Math.min(r.w, img.naturalWidth));
    const h = Math.max(MIN_LADO, Math.min(r.h, img.naturalHeight));
    return {
      w,
      h,
      x: Math.max(0, Math.min(r.x, img.naturalWidth - w)),
      y: Math.max(0, Math.min(r.y, img.naturalHeight - h)),
    };
  };

  const iniciar = (e: React.PointerEvent, arraste: Arraste) => {
    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    arrasteRef.current = arraste;
  };

  const mover = (e: React.PointerEvent) => {
    const a = arrasteRef.current;
    if (!a || !img) return;
    const dx = (e.clientX - a.px) / escala;
    const dy = (e.clientY - a.py) / escala;

    if (a.tipo === "mover") {
      setArea(limitar({ ...a.base, x: a.base.x + dx, y: a.base.y + dy }));
      return;
    }

    // Cada canto move dois lados; os outros dois ficam ancorados.
    const b = a.base;
    let { x, y, w, h } = b;
    if (a.canto === "no") {
      x = b.x + dx;
      y = b.y + dy;
      w = b.w - dx;
      h = b.h - dy;
    } else if (a.canto === "ne") {
      y = b.y + dy;
      w = b.w + dx;
      h = b.h - dy;
    } else if (a.canto === "so") {
      x = b.x + dx;
      w = b.w - dx;
      h = b.h + dy;
    } else {
      w = b.w + dx;
      h = b.h + dy;
    }
    if (w < MIN_LADO) {
      if (a.canto === "no" || a.canto === "so") x = b.x + b.w - MIN_LADO;
      w = MIN_LADO;
    }
    if (h < MIN_LADO) {
      if (a.canto === "no" || a.canto === "ne") y = b.y + b.h - MIN_LADO;
      h = MIN_LADO;
    }
    setArea(limitar({ x, y, w, h }));
  };

  const soltar = () => {
    arrasteRef.current = null;
  };

  const aplicar = async () => {
    if (!img || !area) return;
    setAplicando(true);
    try {
      await onAplicar(img, area);
    } finally {
      setAplicando(false);
    }
  };

  const detectar = () => {
    if (!img) return;
    const r = detectarConteudo(img);
    if (r) setArea(r);
  };

  const cantos: { canto: Canto; classe: string }[] = [
    { canto: "no", classe: "-left-1.5 -top-1.5 cursor-nwse-resize" },
    { canto: "ne", classe: "-right-1.5 -top-1.5 cursor-nesw-resize" },
    { canto: "so", classe: "-bottom-1.5 -left-1.5 cursor-nesw-resize" },
    { canto: "se", classe: "-bottom-1.5 -right-1.5 cursor-nwse-resize" },
  ];

  return (
    // flex + overflow-hidden com a área do meio rolando: sem isso o conteúdo
    // passa dos 90vh do Modal e o rodapé fica fora da tela.
    <Modal
      open={open}
      onClose={onClose}
      width={720}
      className="flex flex-col overflow-hidden p-0"
    >
      <div className="shrink-0 border-b border-black/[.07] px-7 pb-4 pt-6">
        <h2 className="m-0 font-display text-[20px] font-extrabold text-ink">
          Recortar logo
        </h2>
        <p className="mt-1 text-[14px] text-ink-2">
          {nome} · arraste a área ou os cantos para escolher o que fica.
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-7 py-5">
        {carregando ? (
          <LoadingLogo label="Abrindo imagem…" className="py-8" />
        ) : erro ? (
          <p className="m-0 text-[14.5px] text-vermelho">{erro}</p>
        ) : img && area ? (
          <>
            {/* Fundo xadrez: mostra onde a logo é transparente. */}
            <div ref={wrapRef} className="flex justify-center">
            <div
              onPointerMove={mover}
              onPointerUp={soltar}
              onPointerCancel={soltar}
              className="relative touch-none select-none overflow-hidden rounded-xl bg-[repeating-linear-gradient(45deg,#f0ede8,#f0ede8_8px,#faf8f5_8px,#faf8f5_16px)]"
              style={{
                width: larguraPalco || undefined,
                height: larguraPalco
                  ? (larguraPalco * img.naturalHeight) / img.naturalWidth
                  : undefined,
              }}
            >
              <img
                src={img.src}
                alt=""
                draggable={false}
                className="pointer-events-none absolute inset-0 h-full w-full"
              />
              <div
                onPointerDown={(e) =>
                  iniciar(e, {
                    tipo: "mover",
                    px: e.clientX,
                    py: e.clientY,
                    base: area,
                  })
                }
                className="absolute cursor-move border-2 border-white shadow-[0_0_0_9999px_rgba(20,25,30,.5)]"
                style={{
                  left: area.x * escala,
                  top: area.y * escala,
                  width: area.w * escala,
                  height: area.h * escala,
                }}
              >
                {cantos.map(({ canto, classe }) => (
                  <span
                    key={canto}
                    onPointerDown={(e) =>
                      iniciar(e, {
                        tipo: "canto",
                        canto,
                        px: e.clientX,
                        py: e.clientY,
                        base: area,
                      })
                    }
                    className={`absolute h-3 w-3 rounded-sm border-2 border-azul bg-white ${classe}`}
                  />
                ))}
              </div>
            </div>
            </div>

            <p className="mt-3 text-center text-[13px] text-ink-2">
              Recorte: {Math.round(area.w)} × {Math.round(area.h)} px · original{" "}
              {img.naturalWidth} × {img.naturalHeight} px
            </p>
          </>
        ) : null}
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-3 border-t border-black/[.07] px-7 py-4">
        <button
          type="button"
          onClick={detectar}
          disabled={!img || aplicando}
          className="rounded-full border-[1.5px] border-black/[.12] bg-white px-5 py-2.5 font-display text-[13.5px] font-extrabold text-ink transition-colors hover:border-azul hover:text-azul disabled:opacity-40"
        >
          Detectar automático
        </button>
        <button
          type="button"
          onClick={onClose}
          disabled={aplicando}
          className="ml-auto rounded-full border-[1.5px] border-black/[.12] bg-white px-5 py-2.5 font-display text-[13.5px] font-extrabold text-ink transition-colors hover:border-azul hover:text-azul disabled:opacity-40"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={() => void aplicar()}
          disabled={!img || !area || aplicando}
          className="rounded-full bg-verde px-6 py-2.5 font-display text-[13.5px] font-extrabold text-white transition-colors hover:bg-verde-hover disabled:opacity-40"
        >
          {aplicando ? "Aplicando…" : "Aplicar recorte"}
        </button>
      </div>
    </Modal>
  );
}
