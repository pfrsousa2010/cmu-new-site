import { useEffect, useMemo, useState } from "react";
import {
  fetchCursos,
  statusDe,
  isVisivel,
  vagasRestantes,
  fmtDataCurta,
  DIAS_LABEL,
  PERIODOS_LABEL,
  STATUS_META,
  type CursoRow,
  type StatusCurso,
} from "@/lib/cursos";
import { CURSO_FALLBACKS } from "@/lib/refImages";

type Filtro = "todos" | StatusCurso;

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

  useEffect(() => {
    fetchCursos().then((data) => {
      setCursos(data.filter(isVisivel));
      setLoading(false);
    });
  }, []);

  const filtrados = useMemo(
    () =>
      cursos.filter((c) => filtro === "todos" || statusDe(c) === filtro),
    [cursos, filtro]
  );

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

      {loading ? (
        <p className="mt-8 text-ink-2">Carregando cursos…</p>
      ) : filtrados.length === 0 ? (
        <p className="mt-8 text-ink-2">
          Nenhum curso {filtro !== "todos" ? "nesta categoria" : "disponível"} no
          momento.
        </p>
      ) : (
        <div className="mt-7 grid grid-cols-1 gap-[22px] sm:grid-cols-2 lg:grid-cols-3">
          {filtrados.map((c, i) => (
            <CursoCard key={c.id} curso={c} idx={i} />
          ))}
        </div>
      )}
    </div>
  );
}

function CursoCard({ curso, idx }: { curso: CursoRow; idx: number }) {
  const st = statusDe(curso);
  const meta = STATUS_META[st];
  const restantes = vagasRestantes(curso);
  const total = curso.vagas ?? 0;
  const iniciaram = curso.qtd_alunos_iniciaram ?? 0;
  const pct = total > 0 ? Math.round((iniciaram / total) * 100) : 0;
  const img =
    curso.imagem_url || CURSO_FALLBACKS[idx % CURSO_FALLBACKS.length];
  const dias = curso.dia_semana.map((d) => DIAS_LABEL[d] ?? d).join(" · ");

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
        <div className="text-[13.5px] text-ink-2">Prof. {curso.professor}</div>
        <div className="flex flex-wrap gap-1.5">
          <Chip>📅 {dias}</Chip>
          <Chip>🕐 {PERIODOS_LABEL[curso.periodo]}</Chip>
          {curso.carga_horaria ? <Chip>⏱ {curso.carga_horaria}h</Chip> : null}
        </div>
        <div className="text-[13px] text-ink-2">
          De {fmtDataCurta(curso.inicio)} a {fmtDataCurta(curso.fim)}
        </div>
        <div className="mt-auto">
          <div className="mb-1.5 flex justify-between text-[12.5px] font-bold text-ink-mid">
            <span>Vagas</span>
            <span>
              {restantes} de {total} disponíveis
            </span>
          </div>
          <div className="h-[7px] overflow-hidden rounded-full bg-subtle">
            <div
              className={`h-full rounded-full ${meta.className}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          {st === "inscricoes" && (
            <button className="mt-3.5 w-full rounded-xl bg-verde px-3 py-[11px] text-center font-display text-[14.5px] font-extrabold text-white transition-colors hover:bg-verde-hover">
              Inscreva-se
            </button>
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
