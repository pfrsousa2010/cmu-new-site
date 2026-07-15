import { useEffect, useState } from "react";
import {
  fetchEventos,
  diaMesDe,
  capaEvento,
  type EventoRow,
} from "@/lib/eventos";

// Ciclo de cores por evento (verde/azul/laranja/vermelho), como no design.
const CORES = [
  { cor: "text-verde", bg: "bg-verde/[.12]" },
  { cor: "text-azul", bg: "bg-azul/[.12]" },
  { cor: "text-laranja", bg: "bg-laranja/[.12]" },
  { cor: "text-vermelho", bg: "bg-vermelho/[.12]" },
];

export default function Eventos() {
  const [eventos, setEventos] = useState<EventoRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEventos().then((data) => {
      setEventos(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="mx-auto max-w-container px-6 pb-20 pt-14">
      <h1 className="mb-3 font-display text-[42px] font-black">
        Agenda de eventos
      </h1>
      <p className="m-0 mb-9 text-[17px] text-ink-2">
        Próximos eventos, oficinas e datas importantes.
      </p>

      {loading ? (
        <p className="text-ink-2">Carregando eventos…</p>
      ) : eventos.length === 0 ? (
        <p className="text-ink-2">Nenhum evento na agenda no momento.</p>
      ) : (
        <div className="grid gap-[18px]">
          {eventos.map((e, i) => {
            const { dia, mes } = diaMesDe(e.data);
            const c = CORES[i % CORES.length];
            const capa = capaEvento(e);
            return (
              <div
                key={e.id}
                className="flex flex-col items-start gap-[22px] rounded-[18px] border border-black/[.07] bg-white px-6 py-5 transition-shadow hover:shadow-card-hover sm:flex-row sm:items-center"
              >
                <div
                  className={`flex-none rounded-2xl px-0 py-2.5 text-center ${c.bg} w-[70px]`}
                >
                  <div className={`font-display text-[26px] font-black ${c.cor}`}>
                    {dia}
                  </div>
                  <div
                    className={`text-xs font-bold uppercase ${c.cor}`}
                  >
                    {mes}
                  </div>
                </div>
                {capa && (
                  <img
                    src={capa}
                    alt={e.titulo}
                    className="h-[74px] w-[110px] flex-none rounded-xl object-cover"
                  />
                )}
                <div className="flex-1">
                  <div className="font-display text-lg font-extrabold">
                    {e.titulo}
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
    </div>
  );
}
