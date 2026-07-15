import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/Toast";
import {
  fetchCursosAdmin,
  setInscricoesAtiva,
  setVisivelSite,
  isVisivel,
  podeAlternarInscricoes,
  nomeCurto,
  fmtDiaMes,
  PERIODOS_LABEL,
  STATUS_META,
  statusDe,
  type CursoRow,
} from "@/lib/cursos";

export default function AdminCursos() {
  const { toast } = useToast();
  const [cursos, setCursos] = useState<CursoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<Record<string, boolean>>({});
  const [busca, setBusca] = useState("");

  useEffect(() => {
    fetchCursosAdmin().then((data) => {
      setCursos(data);
      setLoading(false);
    });
  }, []);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return cursos;
    return cursos.filter((c) => c.titulo.toLowerCase().includes(termo));
  }, [cursos, busca]);

  const toggleInsc = async (c: CursoRow) => {
    if (!podeAlternarInscricoes(c)) return;
    const novo = !c.inscricoes_ativa;
    setPending((p) => ({ ...p, [c.id]: true }));
    setCursos((cs) =>
      cs.map((x) => (x.id === c.id ? { ...x, inscricoes_ativa: novo } : x))
    );
    try {
      await setInscricoesAtiva(c.id, novo);
      toast(
        novo
          ? `Inscrições abertas: ${c.titulo}`
          : `Inscrições fechadas: ${c.titulo}`
      );
    } catch (err) {
      setCursos((cs) =>
        cs.map((x) => (x.id === c.id ? { ...x, inscricoes_ativa: !novo } : x))
      );
      toast("Erro ao atualizar inscrições");
      console.error(err);
    } finally {
      setPending((p) => ({ ...p, [c.id]: false }));
    }
  };

  const toggleVis = async (c: CursoRow) => {
    const novo = !isVisivel(c);
    setPending((p) => ({ ...p, [c.id]: true }));
    setCursos((cs) =>
      cs.map((x) => (x.id === c.id ? { ...x, visivel_site: novo } : x))
    );
    try {
      await setVisivelSite(c.id, novo);
      toast(novo ? "Curso visível no site" : "Curso oculto do site");
    } catch (err) {
      setCursos((cs) =>
        cs.map((x) => (x.id === c.id ? { ...x, visivel_site: !novo } : x))
      );
      toast("Erro ao atualizar visibilidade (a coluna visivel_site existe?)");
      console.error(err);
    } finally {
      setPending((p) => ({ ...p, [c.id]: false }));
    }
  };

  const cols =
    "grid-cols-[1.8fr_1fr_1.2fr_0.8fr_0.7fr_110px_110px]";

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="m-0 font-display text-[28px] font-black">Cursos</h1>
        <div className="flex items-center gap-2 rounded-full bg-verde/10 px-4 py-2 text-[13px] font-bold text-verde-dark">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-verde" />
          Sincronizado com o SGE - CMU
        </div>
      </div>
      <p className="m-0 mb-5 max-w-[640px] text-[14.5px] leading-[1.55] text-ink-2">
        Os cursos são gerenciados no Sistema de Gestão de Educacional (SGE - CMU) e aparecem automaticamente no
        site (mesmas regras públicas: sem percursos e sem planejados). Aqui você
        controla apenas <b>o que fica visível</b> e se as{" "}
        <b>inscrições estão abertas</b>.
      </p>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <input
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar curso pelo nome…"
          aria-label="Buscar curso pelo nome"
          className="w-full max-w-md rounded-xl border-[1.5px] border-black/[.12] bg-white px-4 py-3 text-[14.5px] text-ink outline-none transition-colors placeholder:text-ink-2/70 focus:border-azul"
        />
        {!loading && (
          <p className="m-0 text-[14px] font-bold text-ink-2">
            {busca.trim()
              ? `${filtrados.length} de ${cursos.length} ${cursos.length === 1 ? "curso" : "cursos"}`
              : `${cursos.length} ${cursos.length === 1 ? "curso" : "cursos"}`}
          </p>
        )}
      </div>

      {loading ? (
        <p className="text-ink-2">Carregando…</p>
      ) : cursos.length === 0 ? (
        <p className="text-ink-2">Nenhum curso encontrado.</p>
      ) : filtrados.length === 0 ? (
        <p className="text-ink-2">
          Nenhum curso encontrado para “{busca.trim()}”.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-[18px] bg-white">
          <div className="min-w-[920px]">
            <div
              className={`grid ${cols} gap-3 bg-site-bg px-[22px] py-3.5 text-xs font-extrabold uppercase tracking-[.04em] text-ink-2`}
            >
              <div>Curso</div>
              <div>Professor</div>
              <div>Parceiro</div>
              <div>Período</div>
              <div>Vagas</div>
              <div>Inscrições</div>
              <div>Visível no site</div>
            </div>
            {filtrados.map((c) => {
              const insc = c.inscricoes_ativa;
              const vis = isVisivel(c);
              const busy = pending[c.id];
              const podeInsc = podeAlternarInscricoes(c);
              const st = statusDe(c);
              const meta = STATUS_META[st];
              const motivoInsc = !c.inscricoes_inicio || !c.inscricoes_fim
                ? "Período de inscrição não configurado"
                : "Período de inscrição encerrado";
              return (
                <div
                  key={c.id}
                  className={`grid ${cols} items-center gap-3 border-t border-black/[.05] px-[22px] py-4`}
                >
                  <div>
                    <div className="text-[14.5px] font-bold">{c.titulo}</div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-[3px] text-[11px] font-bold text-white ${meta.className}`}
                      >
                        {meta.label}
                      </span>
                      <span className="text-[12.5px] text-ink-3">
                        {fmtDiaMes(c.inicio)} – {fmtDiaMes(c.fim)}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm text-ink-mid">
                    {c.parceiro_id ? "—" : nomeCurto(c.professor)}
                  </div>
                  <div className="text-sm text-ink-mid">
                    {c.parceiro_id
                      ? c.parceiros?.nome ?? "Parceiro"
                      : "—"}
                  </div>
                  <div className="text-sm text-ink-mid">
                    {PERIODOS_LABEL[c.periodo]}
                  </div>
                  <div className="text-sm text-ink-mid">
                    {c.vagas ?? 0}
                  </div>
                  <div title={podeInsc ? undefined : motivoInsc}>
                    <Toggle
                      on={insc}
                      color="bg-verde"
                      disabled={busy || !podeInsc}
                      onClick={() => toggleInsc(c)}
                    />
                  </div>
                  <div>
                    <Toggle
                      on={vis}
                      color="bg-azul"
                      disabled={busy}
                      onClick={() => toggleVis(c)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function Toggle({
  on,
  color,
  disabled,
  onClick,
}: {
  on: boolean;
  color: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={on}
      className={[
        "relative h-[26px] w-[46px] rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        on ? color : "bg-black/[.18]",
      ].join(" ")}
    >
      <span
        className="absolute top-[3px] h-5 w-5 rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,.25)] transition-[left]"
        style={{ left: on ? "23px" : "3px" }}
      />
    </button>
  );
}
