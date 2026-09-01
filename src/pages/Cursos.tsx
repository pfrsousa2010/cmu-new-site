import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  fetchCursos,
  statusDe,
  isVisivel,
  isAtivoNoSite,
  vagasRestantes,
  limiteInscricoes,
  emListaEspera,
  abreviarUnidade,
  nomeCurto,
  fmtDataCurta,
  fmtDataHora,
  formatDiasCurto,
  PERIODOS_LABEL,
  PERIODO_CLASSES,
  STATUS_META,
  type CursoRow,
  type Periodo,
  type StatusCurso,
} from "@/lib/cursos";
import { CURSO_FALLBACK } from "@/lib/refImages";
import LoadingLogo from "@/components/LoadingLogo";
import InscricaoModal from "@/components/InscricaoModal";

type Filtro = "todos" | Exclude<StatusCurso, "finalizado">;

/** Abaixo disto o card passa a chamar atenção para as vagas que restam. */
const POUCAS_VAGAS = 10;

/** Valor do filtro de unidade quando nenhuma está selecionada. */
const TODAS_UNIDADES = "todas";

/** Valor do filtro de turno quando nenhum está selecionado. */
const TODOS_PERIODOS = "todos";

/** Ordem de exibição do turno — cronológica, não alfabética. */
const PERIODOS_ORDEM: Periodo[] = ["manha", "tarde", "noite"];

const FILTROS: { key: Filtro; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "inscricoes", label: "Inscrições abertas" },
  { key: "andamento", label: "Em andamento" },
  { key: "planejado", label: "Em breve" },
];

export default function Cursos() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [cursos, setCursos] = useState<CursoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [unidade, setUnidade] = useState(TODAS_UNIDADES);
  const [periodo, setPeriodo] = useState<string>(TODOS_PERIODOS);
  const [busca, setBusca] = useState(() => searchParams.get("busca") ?? "");
  const [cursoInscricaoId, setCursoInscricaoId] = useState<string | null>(null);

  useEffect(() => {
    setBusca(searchParams.get("busca") ?? "");
  }, [searchParams]);

  useEffect(() => {
    let ativo = true;
    fetchCursos().then((data) => {
      if (!ativo) return;
      setCursos(data.filter(isVisivel).filter(isAtivoNoSite));
      setLoading(false);
    });
    return () => {
      ativo = false;
    };
  }, []);

  const atualizarBusca = (valor: string) => {
    setBusca(valor);
    const next = new URLSearchParams(searchParams);
    if (valor.trim()) next.set("busca", valor);
    else next.delete("busca");
    setSearchParams(next, { replace: true });
  };

  /**
   * Só as unidades que têm curso na lista — filtrar por uma unidade vazia
   * nunca ajuda, e a lista de `unidades` do SGE tem entradas fora de uso.
   */
  const unidades = useMemo(() => {
    const nomes = new Set<string>();
    for (const c of cursos) {
      const nome = abreviarUnidade(c.unidades?.nome);
      if (nome) nomes.add(nome);
    }
    return [...nomes].sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [cursos]);

  /** Só os turnos que têm curso, na ordem manhã -> tarde -> noite. */
  const periodos = useMemo(() => {
    const presentes = new Set(cursos.map((c) => c.periodo));
    return PERIODOS_ORDEM.filter((p) => presentes.has(p));
  }, [cursos]);

  // A opção escolhida pode sumir da lista quando os cursos recarregam.
  useEffect(() => {
    if (unidade !== TODAS_UNIDADES && !unidades.includes(unidade)) {
      setUnidade(TODAS_UNIDADES);
    }
  }, [unidades, unidade]);

  useEffect(() => {
    if (periodo !== TODOS_PERIODOS && !periodos.includes(periodo as Periodo)) {
      setPeriodo(TODOS_PERIODOS);
    }
  }, [periodos, periodo]);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return cursos.filter((c) => {
      if (filtro !== "todos" && statusDe(c) !== filtro) return false;
      if (
        unidade !== TODAS_UNIDADES &&
        abreviarUnidade(c.unidades?.nome) !== unidade
      ) {
        return false;
      }
      if (periodo !== TODOS_PERIODOS && c.periodo !== periodo) return false;
      if (termo && !c.titulo.toLowerCase().includes(termo)) return false;
      return true;
    });
  }, [cursos, filtro, unidade, periodo, busca]);

  const temFiltro =
    filtro !== "todos" ||
    unidade !== TODAS_UNIDADES ||
    periodo !== TODOS_PERIODOS ||
    busca.trim() !== "";

  const limparFiltros = () => {
    setFiltro("todos");
    setUnidade(TODAS_UNIDADES);
    setPeriodo(TODOS_PERIODOS);
    atualizarBusca("");
  };

  return (
    <div className="mx-auto max-w-container px-6 pb-20 pt-14">
      <div className="mb-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="mb-3 font-display text-[42px] font-black">Cursos</h1>
          <p className="m-0 max-w-[560px] text-base leading-[1.6] text-ink-2">
            Cursos gratuitos de qualificação profissional. Veja os que estão com
            inscrição aberta e inscreva-se aqui mesmo, pelo site.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTROS.map((f) => {
            const active = filtro === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setFiltro(f.key)}
                className={[
                  "rounded-full border-[1.5px] px-[18px] py-[9px] text-[13.5px] font-bold transition-colors",
                  active
                    ? "border-azul bg-azul text-white"
                    : "border-black/[.12] bg-white text-ink-mid hover:border-azul",
                ].join(" ")}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <input
          id="busca-curso"
          type="search"
          value={busca}
          onChange={(e) => atualizarBusca(e.target.value)}
          placeholder="Buscar curso pelo nome…"
          aria-label="Buscar curso pelo nome"
          className="w-full max-w-md rounded-xl border-[1.5px] border-black/[.12] bg-white px-4 py-[13px] text-[15px] text-ink outline-none transition-colors placeholder:text-ink-2/70 focus:border-azul"
        />
        {periodos.length > 1 && (
          <select
            id="filtro-periodo"
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            aria-label="Filtrar por período"
            className={[
              "w-full max-w-md rounded-xl border-[1.5px] border-black/[.12] px-4 py-[13px] text-[15px] font-semibold outline-none transition-colors focus:border-azul sm:w-auto",
              // Colorir o próprio filtro reforça o código de cor dos cards.
              periodo === TODOS_PERIODOS
                ? "bg-white font-normal text-ink"
                : PERIODO_CLASSES[periodo as Periodo],
            ].join(" ")}
          >
            <option value={TODOS_PERIODOS}>🕐 Todos os períodos</option>
            {periodos.map((p) => (
              <option key={p} value={p}>
                🕐 {PERIODOS_LABEL[p]}
              </option>
            ))}
          </select>
        )}
        {unidades.length > 1 && (
          <select
            id="filtro-unidade"
            value={unidade}
            onChange={(e) => setUnidade(e.target.value)}
            aria-label="Filtrar por unidade"
            className="w-full max-w-md rounded-xl border-[1.5px] border-black/[.12] bg-white px-4 py-[13px] text-[15px] text-ink outline-none transition-colors focus:border-azul sm:w-auto"
          >
            <option value={TODAS_UNIDADES}>📍 Todas as unidades</option>
            {unidades.map((u) => (
              <option key={u} value={u}>
                📍 {u}
              </option>
            ))}
          </select>
        )}
      </div>

      {loading ? (
        <LoadingLogo label="Carregando cursos…" />
      ) : filtrados.length === 0 ? (
        <div className="mt-8">
          <p className="m-0 text-ink-2">
            {busca.trim()
              ? `Nenhum curso encontrado para “${busca.trim()}”.`
              : temFiltro
                ? "Nenhum curso com os filtros escolhidos."
                : "Nenhum curso disponível no momento."}
          </p>
          {temFiltro && (
            <button
              type="button"
              onClick={limparFiltros}
              className="mt-4 rounded-full border-[1.5px] border-black/[.12] bg-white px-5 py-2.5 text-[13.5px] font-bold text-ink-mid transition-colors hover:border-azul hover:text-azul"
            >
              Limpar filtros
            </button>
          )}
        </div>
      ) : (
        <div className="mt-7 grid grid-cols-1 gap-[22px] sm:grid-cols-2 lg:grid-cols-3">
          {filtrados.map((c) => (
            <CursoCard
              key={c.id}
              curso={c}
              onInscrever={() => setCursoInscricaoId(c.id)}
            />
          ))}
        </div>
      )}

      <InscricaoModal
        cursoId={cursoInscricaoId}
        onClose={() => setCursoInscricaoId(null)}
      />
    </div>
  );
}

function CursoCard({
  curso,
  onInscrever,
}: {
  curso: CursoRow;
  onInscrever: () => void;
}) {
  const st = statusDe(curso);
  const meta = STATUS_META[st];
  const limite = limiteInscricoes(curso);
  const restantes = vagasRestantes(curso);
  const listaEspera = emListaEspera(curso);
  const unidade = abreviarUnidade(curso.unidades?.nome);
  const temImagem = Boolean(curso.imagem_url);
  const img = curso.imagem_url || CURSO_FALLBACK;
  const dias = formatDiasCurto(curso.dia_semana);
  const carga =
    curso.carga_horaria_total ?? curso.carga_horaria ?? null;

  return (
    <div className="flex flex-col overflow-hidden rounded-card border border-black/[.07] bg-white transition-shadow hover:shadow-card-hover-lg">
      <div className="relative">
        <div
          className={
            temImagem
              ? "h-[160px] w-full"
              : "flex h-[160px] w-full items-center justify-center bg-dark"
          }
        >
          <img
            src={img}
            alt={curso.titulo}
            className={
              temImagem
                ? "block h-full w-full object-cover"
                : "block h-[88px] w-[88px] object-contain"
            }
          />
        </div>
        <span
          className={`absolute left-3 top-3 rounded-full px-3 py-[5px] text-xs font-bold text-white ${meta.className}`}
        >
          {meta.label}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2.5 px-[22px] pb-[22px] pt-5">
        <div className="font-display text-[19px] font-extrabold leading-[1.25]">
          {curso.titulo}
        </div>
        <div className="text-[13.5px] text-ink-2">
          {curso.parceiro_id
            ? `Em parceria com ${curso.parceiros?.nome ?? "parceiro"}`
            : `Prof. ${nomeCurto(curso.professor)}`}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Chip>📅 {dias}</Chip>
          <Chip className={PERIODO_CLASSES[curso.periodo]}>
            🕐 {PERIODOS_LABEL[curso.periodo]}
          </Chip>
          {carga ? <Chip>⏱ {carga}h</Chip> : null}
          {unidade ? <Chip>📍 {unidade}</Chip> : null}
        </div>
        <div className="text-[13px] text-ink-2">
          De {fmtDataCurta(curso.inicio)} a {fmtDataCurta(curso.fim)}
        </div>
        <div className="mt-auto">
          {st === "inscricoes" ? (
            <>
              {(curso.inscricoes_inicio || curso.inscricoes_fim) && (
                <div className="mb-1.5 text-[12.5px] leading-[1.45] text-ink-2">
                  Inscrições: {fmtDataHora(curso.inscricoes_inicio)}
                  {curso.inscricoes_fim
                    ? ` até ${fmtDataHora(curso.inscricoes_fim)}`
                    : ""}
                </div>
              )}
              {listaEspera ? (
                <div className="rounded-lg bg-laranja/[.1] px-2.5 py-1.5 text-[12.5px] font-bold leading-[1.4] text-laranja-hover">
                  Vagas esgotadas — novas inscrições entram na lista de espera
                </div>
              ) : limite != null && restantes != null ? (
                restantes < POUCAS_VAGAS ? (
                  <div className="rounded-lg bg-laranja/[.1] px-2.5 py-1.5 text-[12.5px] font-bold leading-[1.4] text-laranja-hover">
                    {restantes === 1
                      ? "Falta só 1 vaga!"
                      : `Faltam só ${restantes} vagas!`}
                  </div>
                ) : (
                  <div className="text-[12.5px] font-bold text-ink-mid">
                    Faltam {restantes} vagas
                  </div>
                )
              ) : (
                <div className="text-[12.5px] font-bold text-ink-mid">
                  Inscrições sem limite de vagas
                </div>
              )}
              <button
                type="button"
                onClick={onInscrever}
                className="mt-3.5 w-full rounded-xl bg-verde px-3 py-[11px] text-center font-display text-[14.5px] font-extrabold text-white transition-colors hover:bg-verde-hover"
              >
                {listaEspera ? "Entrar na lista de espera" : "Inscreva-se"}
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Chip({
  children,
  className = "bg-site-bg text-ink-mid",
}: {
  children: React.ReactNode;
  /** Cor de fundo + texto; o padrão é o chip neutro. */
  className?: string;
}) {
  return (
    <span
      className={`rounded-lg px-2.5 py-1 text-[12.5px] font-semibold ${className}`}
    >
      {children}
    </span>
  );
}
