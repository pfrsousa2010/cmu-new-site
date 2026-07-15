import { useEffect, useState } from "react";
import { useToast } from "@/components/Toast";
import {
  fetchCursosAdmin,
  setInscricoesAtiva,
  setVisivelSite,
  isVisivel,
  fmtDiaMes,
  PERIODOS_LABEL,
  type CursoRow,
} from "@/lib/cursos";

export default function AdminCursos() {
  const { toast } = useToast();
  const [cursos, setCursos] = useState<CursoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchCursosAdmin().then((data) => {
      setCursos(data);
      setLoading(false);
    });
  }, []);

  const toggleInsc = async (c: CursoRow) => {
    const novo = !c.inscricoes_ativa;
    setPending((p) => ({ ...p, [c.id]: true }));
    setCursos((cs) => cs.map((x) => (x.id === c.id ? { ...x, inscricoes_ativa: novo } : x)));
    try {
      await setInscricoesAtiva(c.id, novo);
      toast(novo ? `Inscrições abertas: ${c.titulo}` : `Inscrições fechadas: ${c.titulo}`);
    } catch (err) {
      setCursos((cs) => cs.map((x) => (x.id === c.id ? { ...x, inscricoes_ativa: !novo } : x)));
      toast("Erro ao atualizar inscrições");
      console.error(err);
    } finally {
      setPending((p) => ({ ...p, [c.id]: false }));
    }
  };

  const toggleVis = async (c: CursoRow) => {
    const novo = !isVisivel(c);
    setPending((p) => ({ ...p, [c.id]: true }));
    setCursos((cs) => cs.map((x) => (x.id === c.id ? { ...x, visivel_site: novo } : x)));
    try {
      await setVisivelSite(c.id, novo);
      toast(novo ? "Curso visível no site" : "Curso oculto do site");
    } catch (err) {
      setCursos((cs) => cs.map((x) => (x.id === c.id ? { ...x, visivel_site: !novo } : x)));
      toast("Erro ao atualizar visibilidade (a coluna visivel_site existe?)");
      console.error(err);
    } finally {
      setPending((p) => ({ ...p, [c.id]: false }));
    }
  };

  const cols = "grid-cols-[2fr_1.2fr_1fr_1fr_110px_110px]";

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="m-0 font-display text-[28px] font-black">Cursos</h1>
        <div className="flex items-center gap-2 rounded-full bg-verde/10 px-4 py-2 text-[13px] font-bold text-verde-dark">
          <span className="inline-block h-2 w-2 rounded-full bg-verde" />
          Sincronizado com Supabase
        </div>
      </div>
      <p className="m-0 mb-6 max-w-[640px] text-[14.5px] leading-[1.55] text-ink-2">
        Os cursos são gerenciados no sistema de gestão (Supabase) e aparecem
        automaticamente no site. Aqui você controla apenas <b>o que fica visível</b>{" "}
        e se as <b>inscrições estão abertas</b>.
      </p>

      {loading ? (
        <p className="text-ink-2">Carregando…</p>
      ) : cursos.length === 0 ? (
        <p className="text-ink-2">Nenhum curso encontrado.</p>
      ) : (
        <div className="overflow-x-auto rounded-[18px] bg-white">
          <div className="min-w-[760px]">
            <div
              className={`grid ${cols} gap-3 bg-site-bg px-[22px] py-3.5 text-xs font-extrabold uppercase tracking-[.04em] text-ink-2`}
            >
              <div>Curso</div>
              <div>Professor</div>
              <div>Período</div>
              <div>Vagas</div>
              <div>Inscrições</div>
              <div>Visível no site</div>
            </div>
            {cursos.map((c) => {
              const insc = c.inscricoes_ativa;
              const vis = isVisivel(c);
              const busy = pending[c.id];
              return (
                <div
                  key={c.id}
                  className={`grid ${cols} items-center gap-3 border-t border-black/[.05] px-[22px] py-4`}
                >
                  <div>
                    <div className="text-[14.5px] font-bold">{c.titulo}</div>
                    <div className="text-[12.5px] text-ink-3">
                      {fmtDiaMes(c.inicio)} – {fmtDiaMes(c.fim)}
                    </div>
                  </div>
                  <div className="text-sm text-ink-mid">{c.professor}</div>
                  <div className="text-sm text-ink-mid">
                    {PERIODOS_LABEL[c.periodo]}
                  </div>
                  <div className="text-sm text-ink-mid">
                    {c.qtd_alunos_iniciaram ?? 0}/{c.vagas ?? 0}
                  </div>
                  <div>
                    <Toggle on={insc} color="bg-verde" disabled={busy} onClick={() => toggleInsc(c)} />
                  </div>
                  <div>
                    <Toggle on={vis} color="bg-azul" disabled={busy} onClick={() => toggleVis(c)} />
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
        "relative h-[26px] w-[46px] rounded-full transition-colors disabled:opacity-60",
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
