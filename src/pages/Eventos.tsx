import { useEffect, useState } from "react";
import LoadingLogo from "@/components/LoadingLogo";
import Modal from "@/components/Modal";
import {
  fetchEventos,
  diaMesDe,
  fotosEvento,
  ehFuturo,
  type EventoRow,
} from "@/lib/eventos";

// Ciclo de cores por evento (verde/azul/laranja/vermelho), como no design.
const CORES = [
  { cor: "text-verde", bg: "bg-verde/[.12]" },
  { cor: "text-azul", bg: "bg-azul/[.12]" },
  { cor: "text-laranja", bg: "bg-laranja/[.12]" },
  { cor: "text-vermelho", bg: "bg-vermelho/[.12]" },
];

type GaleriaAberta = {
  titulo: string;
  fotos: string[];
  indice: number;
};

export default function Eventos() {
  const [eventos, setEventos] = useState<EventoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [galeria, setGaleria] = useState<GaleriaAberta | null>(null);

  useEffect(() => {
    fetchEventos().then((data) => {
      setEventos(data);
      setLoading(false);
    });
  }, []);

  const abrirGaleria = (e: EventoRow, indice = 0) => {
    const fotos = fotosEvento(e);
    if (!fotos.length) return;
    setGaleria({ titulo: e.titulo, fotos, indice });
  };

  const irFoto = (delta: number) => {
    setGaleria((g) => {
      if (!g || g.fotos.length <= 1) return g;
      const indice = (g.indice + delta + g.fotos.length) % g.fotos.length;
      return { ...g, indice };
    });
  };

  useEffect(() => {
    if (!galeria) return;
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "ArrowLeft") irFoto(-1);
      if (ev.key === "ArrowRight") irFoto(1);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [galeria]);

  return (
    <div className="mx-auto max-w-container px-6 pb-20 pt-14">
      <h1 className="mb-3 font-display text-[42px] font-black">
        Agenda de eventos
      </h1>
      <p className="m-0 mb-9 text-[17px] text-ink-2">
        Próximos eventos, oficinas e datas importantes.
      </p>

      {loading ? (
        <LoadingLogo label="Carregando eventos…" />
      ) : eventos.length === 0 ? (
        <p className="text-ink-2">Nenhum evento na agenda no momento.</p>
      ) : (
        <div className="grid gap-[18px]">
          {eventos.map((e, i) => {
            const { dia, mes } = diaMesDe(e.data);
            const c = CORES[i % CORES.length];
            const fotos = fotosEvento(e);
            const capa = fotos[0] ?? null;
            const passado = !ehFuturo(e.data);
            return (
              <div
                key={e.id}
                className="flex flex-col items-start gap-[22px] rounded-[18px] border border-black/[.07] bg-white px-6 py-5 transition-shadow hover:shadow-card-hover sm:flex-row sm:items-center"
              >
                <div
                  className={`relative flex-none rounded-2xl px-0 py-2.5 text-center ${c.bg} w-[70px]`}
                >
                  <div className={`font-display text-[26px] font-black ${c.cor}`}>
                    {dia}
                  </div>
                  <div className={`text-xs font-bold uppercase ${c.cor}`}>
                    {mes}
                  </div>
                </div>
                {capa && (
                  <button
                    type="button"
                    onClick={() => abrirGaleria(e)}
                    className="group relative flex-none overflow-hidden rounded-xl"
                    aria-label={
                      fotos.length > 1
                        ? `Ver ${fotos.length} fotos de ${e.titulo}`
                        : `Ver foto de ${e.titulo}`
                    }
                  >
                    <img
                      src={capa}
                      alt=""
                      className="block h-[74px] w-[110px] object-cover transition-transform group-hover:scale-[1.03]"
                    />
                    {fotos.length > 1 && (
                      <span className="absolute bottom-1.5 right-1.5 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        {fotos.length} fotos
                      </span>
                    )}
                  </button>
                )}
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="font-display text-lg font-extrabold">
                      {e.titulo}
                    </div>
                    {passado && (
                      <span className="rounded-full bg-ink-mid px-2.5 py-[3px] text-[11px] font-bold text-white">
                        Finalizado
                      </span>
                    )}
                  </div>
                  {e.descricao && (
                    <div className="mt-[3px] text-sm text-ink-2">
                      {e.descricao}
                    </div>
                  )}
                </div>
                {e.hora && (
                  <div className="flex-none text-[13px] font-bold text-azul">
                    {e.hora}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {galeria && (
        <Modal
          open
          onClose={() => setGaleria(null)}
          width={920}
          className="overflow-hidden p-0"
        >
          <div className="flex items-center justify-between border-b border-black/[.08] px-5 py-4">
            <div className="min-w-0 font-display text-lg font-extrabold">
              {galeria.titulo}
            </div>
            {galeria.fotos.length > 1 && (
              <span className="flex-none text-sm font-bold text-ink-2">
                {galeria.indice + 1} / {galeria.fotos.length}
              </span>
            )}
          </div>
          <div className="relative flex items-center justify-center bg-[#0f1419]">
            {galeria.fotos.length > 1 && (
              <button
                type="button"
                onClick={() => irFoto(-1)}
                aria-label="Foto anterior"
                className="absolute left-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-lg font-bold text-ink shadow-md transition-colors hover:bg-white"
              >
                ‹
              </button>
            )}
            <img
              src={galeria.fotos[galeria.indice]}
              alt={`${galeria.titulo} — foto ${galeria.indice + 1}`}
              className="max-h-[min(72vh,640px)] w-full object-contain"
            />
            {galeria.fotos.length > 1 && (
              <button
                type="button"
                onClick={() => irFoto(1)}
                aria-label="Próxima foto"
                className="absolute right-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-lg font-bold text-ink shadow-md transition-colors hover:bg-white"
              >
                ›
              </button>
            )}
          </div>
          {galeria.fotos.length > 1 && (
            <div className="flex gap-2 overflow-x-auto border-t border-black/[.08] px-5 py-3">
              {galeria.fotos.map((url, idx) => (
                <button
                  key={url}
                  type="button"
                  onClick={() =>
                    setGaleria((g) => (g ? { ...g, indice: idx } : g))
                  }
                  className={[
                    "h-14 w-20 flex-none overflow-hidden rounded-lg border-2 transition-colors",
                    idx === galeria.indice
                      ? "border-azul"
                      : "border-transparent opacity-70 hover:opacity-100",
                  ].join(" ")}
                >
                  <img src={url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
