import { useEffect, useMemo, useState } from "react";
import {
  fetchCursos,
  statusDe,
  isVisivel,
  isAtivoNoSite,
  vagasRestantes,
  nomeCurto,
  fmtDataCurta,
  fmtDataHora,
  DIAS_LABEL,
  PERIODOS_LABEL,
  STATUS_META,
  type CursoRow,
  type StatusCurso,
} from "@/lib/cursos";
import { CURSO_FALLBACKS } from "@/lib/refImages";
import LoadingLogo from "@/components/LoadingLogo";
import InscricaoModal from "@/components/InscricaoModal";

type Filtro = "todos" | Exclude<StatusCurso, "finalizado">;

const FILTROS: { key: Filtro; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "inscricoes", label: "Inscrições abertas" },
  { key: "andamento", label: "Em andamento" },
  { key: "planejado", label: "Em breve" },
];

export default function Cursos() {
  const [cursos, setCursos] = useState<CursoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [busca, setBusca] = useState("");
  const [cursoInscricaoId, setCursoInscricaoId] = useState<string | null>(null);

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

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return cursos.filter((c) => {
      if (filtro !== "todos" && statusDe(c) !== filtro) return false;
      if (termo && !c.titulo.toLowerCase().includes(termo)) return false;
      return true;
    });
  }, [cursos, filtro, busca]);

  return (
    <div className="mx-auto max-w-container px-6 pb-20 pt-14">
      <div className="mb-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="mb-3 font-display text-[42px] font-black">Cursos</h1>
          <p className="m-0 max-w-[560px] text-base leading-[1.6] text-ink-2">
            Cursos gratuitos de qualificação profissional. Dados sincronizados em
            tempo real com nosso sistema de gestão.
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

      <div className="mt-6 flex justify-center">
        <input
          id="busca-curso"
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar curso pelo nome…"
          aria-label="Buscar curso pelo nome"
          className="w-full max-w-md rounded-xl border-[1.5px] border-black/[.12] bg-white px-4 py-[13px] text-[15px] text-ink outline-none transition-colors placeholder:text-ink-2/70 focus:border-azul"
        />
      </div>

      {loading ? (
        <LoadingLogo label="Carregando cursos…" />
      ) : filtrados.length === 0 ? (
        <p className="mt-8 text-ink-2">
          {busca.trim()
            ? `Nenhum curso encontrado para “${busca.trim()}”.`
            : `Nenhum curso ${filtro !== "todos" ? "nesta categoria" : "disponível"} no momento.`}
        </p>
      ) : (
        <div className="mt-7 grid grid-cols-1 gap-[22px] sm:grid-cols-2 lg:grid-cols-3">
          {filtrados.map((c, i) => (
            <CursoCard
              key={c.id}
              curso={c}
              idx={i}
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
  idx,
  onInscrever,
}: {
  curso: CursoRow;
  idx: number;
  onInscrever: () => void;
}) {
  const st = statusDe(curso);
  const meta = STATUS_META[st];
  const restantes = vagasRestantes(curso);
  const total = curso.vagas ?? 0;
  const img =
    curso.imagem_url || CURSO_FALLBACKS[idx % CURSO_FALLBACKS.length];
  const dias = curso.dia_semana
    .map((d) => DIAS_LABEL[d] ?? d)
    .join(" · ");
  const carga =
    curso.carga_horaria_total ?? curso.carga_horaria ?? null;

  return (
    <div className="flex flex-col overflow-hidden rounded-card border border-black/[.07] bg-white transition-shadow hover:shadow-card-hover-lg">
      <div className="relative">
        <img
          src={img}
          alt={curso.titulo}
          className="block h-[160px] w-full object-cover"
        />
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
          <Chip>🕐 {PERIODOS_LABEL[curso.periodo]}</Chip>
          {carga ? <Chip>⏱ {carga}h</Chip> : null}
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
              <div className="text-[12.5px] font-bold text-ink-mid">
                {restantes} de {total} disponíveis
              </div>
              <button
                type="button"
                onClick={onInscrever}
                className="mt-3.5 w-full rounded-xl bg-verde px-3 py-[11px] text-center font-display text-[14.5px] font-extrabold text-white transition-colors hover:bg-verde-hover"
              >
                Inscreva-se
              </button>
            </>
          ) : (
            <div className="text-[12.5px] font-bold text-ink-mid">
              {total} {total === 1 ? "vaga" : "vagas"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-lg bg-site-bg px-2.5 py-1 text-[12.5px] font-semibold text-ink-mid">
      {children}
    </span>
  );
}
