import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchAtividades, isAtivoNoSite, isVisivel, statusDe } from "@/lib/cursos";
import { SLUG_TIPO, type TipoAtividade } from "@/lib/atividades";

/**
 * Página Atividades: a porta de entrada para cursos, eventos e oficinas do SGE.
 *
 * Substitui a antiga página Cursos no menu (o endereço `/cursos` redireciona para
 * `/atividades/cursos`). A página `/eventos` do site é outra coisa — agenda e fotos do
 * admin do site — e não passa por aqui.
 */
const OPCOES: Array<{
  tipo: TipoAtividade;
  titulo: string;
  texto: string;
  bar: string;
  cor: string;
}> = [
  {
    tipo: "curso",
    titulo: "Cursos",
    texto: "Qualificação profissional gratuita, com várias semanas de aula.",
    bar: "bg-azul",
    cor: "text-azul",
  },
  {
    tipo: "evento",
    titulo: "Eventos",
    texto: "Palestras, ações comunitárias e encontros abertos à comunidade.",
    bar: "bg-laranja",
    cor: "text-laranja",
  },
  {
    tipo: "oficina",
    titulo: "Oficinas",
    texto: "Práticas de curta duração para aprender algo novo em poucos encontros.",
    bar: "bg-verde",
    cor: "text-verde",
  },
];

type Contagem = { total: number; abertas: number };

export default function Atividades() {
  const [contagens, setContagens] = useState<Partial<Record<TipoAtividade, Contagem>>>({});

  useEffect(() => {
    let ativo = true;
    for (const { tipo } of OPCOES) {
      fetchAtividades(tipo).then((lista) => {
        if (!ativo) return;
        const visiveis = lista.filter(isVisivel).filter(isAtivoNoSite);
        setContagens((prev) => ({
          ...prev,
          [tipo]: {
            total: visiveis.length,
            abertas: visiveis.filter((c) => statusDe(c) === "inscricoes").length,
          },
        }));
      });
    }
    return () => {
      ativo = false;
    };
  }, []);

  return (
    <div className="mx-auto max-w-container px-6 pb-20 pt-14">
      <h1 className="mb-3 font-display text-[42px] font-black">Atividades</h1>
      <p className="m-0 mb-10 max-w-[640px] text-[17px] leading-[1.65] text-ink-2">
        Tudo gratuito. Escolha o tipo de atividade para ver as turmas e se inscrever pelo site.
      </p>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {OPCOES.map((o) => {
          const c = contagens[o.tipo];
          return (
            <Link
              key={o.tipo}
              to={`/atividades/${SLUG_TIPO[o.tipo]}`}
              className="group overflow-hidden rounded-modal border border-black/[.07] bg-white transition-shadow hover:shadow-card-hover-lg"
            >
              <div className={`h-2 ${o.bar}`} />
              <div className="flex h-full flex-col p-6 lg:p-8">
                <h2 className={`m-0 mb-3 font-display text-2xl font-extrabold ${o.cor}`}>
                  {o.titulo}
                </h2>
                <p className="m-0 text-[15px] leading-[1.65] text-ink-2">{o.texto}</p>
                <p className="mb-0 mt-5 text-[13.5px] font-bold text-ink-mid">
                  {c == null
                    ? "Carregando…"
                    : c.abertas > 0
                      ? `${c.abertas} com inscrição aberta`
                      : c.total > 0
                        ? `${c.total} ${c.total === 1 ? "turma" : "turmas"} em breve ou em andamento`
                        : "Nenhuma no momento"}
                </p>
                <span className="mt-4 font-display text-[14.5px] font-extrabold text-azul transition-colors group-hover:text-laranja">
                  Ver {o.titulo.toLowerCase()} →
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
