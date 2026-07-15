import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchCursos, isVisivel, type CursoRow } from "@/lib/cursos";
import { fetchEventosAdmin, ehFuturo, type EventoRow } from "@/lib/eventos";
import { fetchArquivos, type ArquivoRow } from "@/lib/arquivos";

function tempoRelativo(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const dias = Math.floor((now - then) / (1000 * 60 * 60 * 24));
  if (dias <= 0) return "hoje";
  if (dias === 1) return "há 1 dia";
  if (dias < 7) return `há ${dias} dias`;
  const semanas = Math.floor(dias / 7);
  if (semanas === 1) return "há 1 semana";
  if (semanas < 5) return `há ${semanas} semanas`;
  const meses = Math.floor(dias / 30);
  return meses <= 1 ? "há 1 mês" : `há ${meses} meses`;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [cursos, setCursos] = useState<CursoRow[]>([]);
  const [eventos, setEventos] = useState<EventoRow[]>([]);
  const [arquivos, setArquivos] = useState<ArquivoRow[]>([]);

  useEffect(() => {
    fetchCursos().then(setCursos);
    fetchEventosAdmin().then(setEventos);
    fetchArquivos().then(setArquivos);
  }, []);

  const visiveis = cursos.filter(isVisivel).length;
  const abertas = cursos.filter((c) => c.inscricoes_ativa && !c.is_cancelado).length;
  const proximos = eventos.filter((e) => ehFuturo(e.data)).length;

  const stats = [
    {
      label: "Cursos visíveis no site",
      valor: visiveis,
      sub: `de ${cursos.length} no Supabase`,
      border: "border-t-verde",
    },
    {
      label: "Inscrições abertas",
      valor: abertas,
      sub: "cursos recebendo inscrições",
      border: "border-t-azul",
    },
    {
      label: "Próximos eventos",
      valor: proximos,
      sub: "na agenda pública",
      border: "border-t-laranja",
    },
    {
      label: "Arquivos publicados",
      valor: arquivos.length,
      sub: "editais e documentos",
      border: "border-t-vermelho",
    },
  ];

  // Atividade recente derivada dos itens mais recentes.
  const atividades = [
    ...arquivos.slice(0, 3).map((a) => ({
      texto: `${a.nome} publicado`,
      quando: tempoRelativo(a.publicado_em),
      cor: "bg-vermelho",
    })),
    ...eventos
      .filter((e) => e.created_at)
      .slice(0, 2)
      .map((e) => ({
        texto: `Evento "${e.titulo}" criado`,
        quando: tempoRelativo(e.created_at!),
        cor: "bg-azul",
      })),
  ].slice(0, 5);

  return (
    <div>
      <h1 className="mb-1 font-display text-[28px] font-black">
        Bom dia, admin 👋
      </h1>
      <p className="m-0 mb-7 text-[15px] text-ink-2">
        Aqui está o resumo do site.
      </p>

      <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className={`rounded-2xl border-t-4 ${s.border} bg-white px-[22px] py-5`}
          >
            <div className="text-[13px] font-bold text-ink-2">{s.label}</div>
            <div className="mt-1 font-display text-3xl font-black">{s.valor}</div>
            <div className="mt-0.5 text-[12.5px] text-ink-2">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-[18px] bg-white px-[26px] py-6">
          <div className="mb-3.5 font-display text-[17px] font-extrabold">
            Atividade recente
          </div>
          <div className="grid gap-0.5">
            {atividades.length === 0 ? (
              <div className="py-2 text-sm text-ink-2">Nenhuma atividade ainda.</div>
            ) : (
              atividades.map((a, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 border-b border-black/[.05] px-1 py-2.5 last:border-b-0"
                >
                  <div className={`h-2 w-2 flex-none rounded-full ${a.cor}`} />
                  <div className="flex-1 text-sm">{a.texto}</div>
                  <div className="flex-none text-[12.5px] text-ink-3">
                    {a.quando}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-[18px] bg-white px-[26px] py-6">
          <div className="mb-3.5 font-display text-[17px] font-extrabold">
            Ações rápidas
          </div>
          <div className="grid gap-2.5">
            <button
              onClick={() => navigate("/admin/eventos?novo=1")}
              className="rounded-xl bg-azul/[.08] px-4 py-[13px] text-left text-sm font-bold text-azul transition-colors hover:bg-azul/[.15]"
            >
              + Novo evento
            </button>
            <button
              onClick={() => navigate("/admin/arquivos?novo=1")}
              className="rounded-xl bg-vermelho/[.08] px-4 py-[13px] text-left text-sm font-bold text-vermelho transition-colors hover:bg-vermelho/[.15]"
            >
              + Publicar edital ou arquivo
            </button>
            <button
              onClick={() => navigate("/admin/cursos")}
              className="rounded-xl bg-verde/[.08] px-4 py-[13px] text-left text-sm font-bold text-verde-dark transition-colors hover:bg-verde/[.15]"
            >
              Ver cursos (Supabase)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
