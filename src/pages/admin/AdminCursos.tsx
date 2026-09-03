import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Modal from "@/components/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useToast } from "@/components/Toast";
import { CURSO_FALLBACK } from "@/lib/refImages";
import {
  fetchCursosAdmin,
  setVisivelSite,
  setCursoImagem,
  removerCursoImagem,
  validarImagemCurso,
  isVisivel,
  semImagem,
  nomeCurto,
  nomeUnidadeCurto,
  limiteInscricoes,
  fmtDiaMes,
  PERIODOS_LABEL,
  STATUS_META,
  statusDe,
  type CursoRow,
  type StatusCurso,
} from "@/lib/cursos";
import {
  unsplashConfigured,
  buscarFotosUnsplash,
  baixarFotoUnsplash,
  type UnsplashFoto,
} from "@/lib/unsplash";

type AbaImagem = "anexar" | "buscar";

/** Mesmos status da página pública de cursos (finalizados nem chegam aqui). */
type Filtro = "todos" | Exclude<StatusCurso, "finalizado">;

const FILTROS: { key: Filtro; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "inscricoes", label: "Inscrições abertas" },
  { key: "andamento", label: "Em andamento" },
  { key: "planejado", label: "Em breve" },
];

export default function AdminCursos() {
  const { toast } = useToast();
  const [params, setParams] = useSearchParams();
  const [cursos, setCursos] = useState<CursoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<Record<string, boolean>>({});
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  /** Recorte independente do status: cruza com qualquer um dos filtros acima. */
  const [soSemFoto, setSoSemFoto] = useState(false);
  const [confirmarRemocao, setConfirmarRemocao] = useState<CursoRow | null>(
    null
  );

  const [cursoImagem, setCursoImagemState] = useState<CursoRow | null>(null);
  const [abaImagem, setAbaImagem] = useState<AbaImagem>("anexar");
  const [dragOver, setDragOver] = useState(false);
  const [enviandoImagem, setEnviandoImagem] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [termoUnsplash, setTermoUnsplash] = useState("");
  const [fotosUnsplash, setFotosUnsplash] = useState<UnsplashFoto[]>([]);
  const [buscandoUnsplash, setBuscandoUnsplash] = useState(false);
  const temUnsplash = unsplashConfigured();

  useEffect(() => {
    fetchCursosAdmin().then((data) => {
      setCursos(data);
      setLoading(false);
    });
  }, []);

  // Entrada pelo card "Cursos sem foto" da visão geral. O parâmetro é
  // consumido e apagado: daqui em diante quem manda é o botão da tela.
  useEffect(() => {
    if (params.get("semFoto") === "1") {
      setSoSemFoto(true);
      params.delete("semFoto");
      setParams(params, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Base dos chips de status: já recortada por "só sem foto", quando ligado. */
  const base = useMemo(
    () => (soSemFoto ? cursos.filter(semImagem) : cursos),
    [cursos, soSemFoto]
  );

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return base.filter((c) => {
      if (filtro !== "todos" && statusDe(c) !== filtro) return false;
      if (termo && !c.titulo.toLowerCase().includes(termo)) return false;
      return true;
    });
  }, [base, busca, filtro]);

  /** Quantos cursos cada filtro traria, para mostrar no próprio botão. */
  const contagens = useMemo(() => {
    const acc: Record<Filtro, number> = {
      todos: base.length,
      inscricoes: 0,
      andamento: 0,
      planejado: 0,
    };
    for (const c of base) {
      const st = statusDe(c);
      if (st !== "finalizado") acc[st] += 1;
    }
    return acc;
  }, [base]);

  /**
   * Pendências dentro do status escolhido — é o número que o botão realmente
   * traz ao ser ligado, e não o total geral. Cada chip mostra o que ele dá.
   */
  const semFotoNoFiltro = useMemo(
    () =>
      cursos.filter(
        (c) => semImagem(c) && (filtro === "todos" || statusDe(c) === filtro)
      ).length,
    [cursos, filtro]
  );

  /**
   * O botão aparece enquanto faltar foto em qualquer curso, mesmo que o status
   * selecionado no momento esteja completo — sumir ali daria a entender que
   * não há mais nada a fazer.
   */
  const temPendencia = useMemo(() => cursos.some(semImagem), [cursos]);

  const fecharModalImagem = () => {
    setCursoImagemState(null);
    setDragOver(false);
    setFotosUnsplash([]);
    setTermoUnsplash("");
    setAbaImagem("anexar");
  };

  const abrirModalImagem = (c: CursoRow) => {
    setCursoImagemState(c);
    setAbaImagem("anexar");
    // Título inteiro: cortar em três palavras deixava "Doces á Base" no lugar
    // de "Doces á Base de Chocolate" e a busca perdia justamente o assunto.
    // Só normaliza os espaços, que vêm irregulares do SGE.
    setTermoUnsplash(c.titulo.trim().replace(/\s+/g, " "));
    setFotosUnsplash([]);
  };

  const aplicarImagem = async (file: File) => {
    if (!cursoImagem) return;
    const erro = validarImagemCurso(file);
    if (erro) {
      toast(erro);
      return;
    }
    setEnviandoImagem(true);
    setPending((p) => ({ ...p, [cursoImagem.id]: true }));
    try {
      const url = await setCursoImagem(
        cursoImagem.id,
        file,
        cursoImagem.imagem_url
      );
      setCursos((cs) =>
        cs.map((x) => (x.id === cursoImagem.id ? { ...x, imagem_url: url } : x))
      );
      toast("Imagem do curso atualizada");
      fecharModalImagem();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao enviar imagem");
      console.error(err);
    } finally {
      setEnviandoImagem(false);
      setPending((p) => ({ ...p, [cursoImagem.id]: false }));
    }
  };

  const aoSoltarArquivo = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (enviandoImagem) return;
    const f = e.dataTransfer.files?.[0];
    if (f) void aplicarImagem(f);
  };

  const buscarUnsplash = async () => {
    if (!temUnsplash) return;
    const termo = termoUnsplash.trim();
    if (!termo) {
      toast("Digite um termo para buscar");
      return;
    }
    setBuscandoUnsplash(true);
    try {
      const { fotos } = await buscarFotosUnsplash(termo);
      setFotosUnsplash(fotos);
      if (!fotos.length) toast("Nenhuma foto encontrada");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro na busca Unsplash");
      console.error(err);
    } finally {
      setBuscandoUnsplash(false);
    }
  };

  const escolherUnsplash = async (foto: UnsplashFoto) => {
    if (!cursoImagem || enviandoImagem) return;
    setEnviandoImagem(true);
    setPending((p) => ({ ...p, [cursoImagem.id]: true }));
    try {
      const file = await baixarFotoUnsplash(
        foto.downloadLocation,
        `unsplash-${foto.id}`
      );
      const url = await setCursoImagem(
        cursoImagem.id,
        file,
        cursoImagem.imagem_url,
        { maxBytes: 8 * 1024 * 1024 }
      );
      setCursos((cs) =>
        cs.map((x) => (x.id === cursoImagem.id ? { ...x, imagem_url: url } : x))
      );
      toast("Imagem do Unsplash aplicada");
      fecharModalImagem();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao baixar foto");
      console.error(err);
    } finally {
      setEnviandoImagem(false);
      setPending((p) => ({ ...p, [cursoImagem.id]: false }));
    }
  };

  const removerImagem = async (c: CursoRow) => {
    if (!c.imagem_url) return;
    setConfirmarRemocao(null);
    setPending((p) => ({ ...p, [c.id]: true }));
    try {
      await removerCursoImagem(c);
      setCursos((cs) =>
        cs.map((x) => (x.id === c.id ? { ...x, imagem_url: null } : x))
      );
      toast("Imagem removida");
    } catch (err) {
      toast("Erro ao remover imagem");
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
    "grid-cols-[88px_2.4fr_1.2fr_1fr_120px]";

  return (
    <div>
      <div className="mb-2 flex items-start justify-between gap-3 sm:items-center">
        <h1 className="m-0 min-w-0 flex-1 font-display text-[28px] font-black">
          Cursos
        </h1>
        <div className="flex flex-none items-center gap-2 rounded-full bg-verde/10 px-3 py-2 text-[12.5px] font-bold text-verde-dark sm:px-4 sm:text-[13px]">
          <span className="relative flex h-2.5 w-2.5 items-center justify-center">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-verde opacity-60" />
            <span className="relative inline-block h-2.5 w-2.5 rounded-full bg-verde shadow-[0_0_0_3px_rgba(98,179,46,.25)]" />
          </span>
          <span className="sm:hidden">SGE</span>
          <span className="hidden sm:inline">Sincronizado com o SGE - CMU</span>
        </div>
      </div>
      <p className="m-0 mb-5 max-w-[640px] text-[14.5px] leading-[1.55] text-ink-2">
        Os cursos são gerenciados no Sistema de Gestão de Educacional (SGE - CMU) e aparecem automaticamente no
        site (sem percursos e sem planejados). Aqui você
        controla <b>imagem do card</b> e <b>visibilidade</b>. As inscrições
        abrem e fecham pelo período configurado no próprio SGE. Sem imagem, o
        site usa a logo CMU.
      </p>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
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
            {filtrados.length === cursos.length
              ? `${cursos.length} ${cursos.length === 1 ? "curso" : "cursos"}`
              : `${filtrados.length} de ${cursos.length} ${cursos.length === 1 ? "curso" : "cursos"}`}
          </p>
        )}
      </div>

      {!loading && (
        <div className="mb-5 flex flex-wrap gap-2">
          {FILTROS.map((f) => {
            const ativo = filtro === f.key;
            return (
              <button
                key={f.key}
                type="button"
                aria-pressed={ativo}
                onClick={() => setFiltro(f.key)}
                className={[
                  "rounded-full border-[1.5px] px-[16px] py-2 text-[13px] font-bold transition-colors",
                  ativo
                    ? "border-azul bg-azul text-white"
                    : "border-black/[.12] bg-white text-ink-mid hover:border-azul",
                ].join(" ")}
              >
                {f.label}
                <span className={ativo ? "text-white/70" : "text-ink-3"}>
                  {" "}
                  ({contagens[f.key]})
                </span>
              </button>
            );
          })}

          {/* Separado dos demais por ser outro eixo: cruza com o status
              escolhido, em vez de substituí-lo. Some quando não há pendência. */}
          {temPendencia && (
            <>
              <span
                aria-hidden="true"
                className="mx-1 hidden w-px self-stretch bg-black/[.10] sm:block"
              />
              <button
                type="button"
                aria-pressed={soSemFoto}
                onClick={() => setSoSemFoto((v) => !v)}
                className={[
                  "rounded-full border-[1.5px] px-[16px] py-2 text-[13px] font-bold transition-colors",
                  // Laranja da marca só no contorno e no fundo: em texto ele
                  // fica em 2,9:1, abaixo do mínimo legível.
                  soSemFoto
                    ? "border-laranja-dark bg-laranja-dark text-white"
                    : "border-laranja/40 bg-laranja/[.08] text-laranja-dark hover:border-laranja",
                ].join(" ")}
              >
                Sem foto
                {/* Sem a opacidade dos chips vizinhos: sobre laranja ela
                    derrubaria o número para 3,1:1. */}
                <span className={soSemFoto ? "text-white" : "text-laranja-dark"}>
                  {" "}
                  ({semFotoNoFiltro})
                </span>
              </button>
            </>
          )}
        </div>
      )}

      {loading ? (
        <p className="text-ink-2">Carregando…</p>
      ) : cursos.length === 0 ? (
        <p className="text-ink-2">Nenhum curso encontrado.</p>
      ) : filtrados.length === 0 ? (
        <p className="text-ink-2">
          {busca.trim()
            ? `Nenhum curso encontrado para “${busca.trim()}”${filtro !== "todos" || soSemFoto ? " com esses filtros" : ""}.`
            : soSemFoto
              ? "Nenhum curso sem foto nesta categoria — tudo com imagem por aqui."
              : "Nenhum curso nesta categoria no momento."}
        </p>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="grid gap-3 lg:hidden">
            {filtrados.map((c) => {
              const vis = isVisivel(c);
              const busy = pending[c.id];
              const st = statusDe(c);
              const meta = STATUS_META[st];
              const temImg = !semImagem(c);
              const professor = c.professor?.trim()
                ? nomeCurto(c.professor)
                : null;
              const parceiro = c.parceiro_id
                ? (c.parceiros?.nome ?? "Parceiro")
                : null;

              return (
                <div
                  key={c.id}
                  className="rounded-2xl border border-black/[.06] bg-white p-4 shadow-sm"
                >
                  <div className="flex gap-3.5">
                    <div className="flex flex-none flex-col items-start gap-1.5">
                      <div
                        className={[
                          "flex h-[72px] w-[96px] items-center justify-center overflow-hidden rounded-[10px]",
                          temImg ? "bg-site-bg" : "bg-dark",
                        ].join(" ")}
                      >
                        <img
                          src={temImg ? c.imagem_url! : CURSO_FALLBACK}
                          alt=""
                          className={
                            temImg
                              ? "h-full w-full object-cover"
                              : "h-8 w-8 object-contain"
                          }
                        />
                      </div>
                      <div className="flex w-full gap-1">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => abrirModalImagem(c)}
                          className="flex-1 rounded-md border border-azul/20 bg-azul/[.06] px-1.5 py-1 text-center text-[11px] font-bold text-azul disabled:opacity-50"
                        >
                          {temImg ? "Trocar" : "Definir"}
                        </button>
                        {temImg && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => setConfirmarRemocao(c)}
                            className="flex-1 rounded-md border border-vermelho/20 bg-vermelho/[.06] px-1.5 py-1 text-center text-[11px] font-bold text-vermelho disabled:opacity-50"
                          >
                            Remover
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="text-[15px] font-bold leading-snug">
                        {c.titulo}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-[3px] text-[11px] font-bold text-white ${meta.className}`}
                        >
                          {meta.label}
                        </span>
                        <span className="text-[12.5px] text-ink-3">
                          {fmtDiaMes(c.inicio)} – {fmtDiaMes(c.fim)}
                        </span>
                      </div>
                      <div className="mt-2 space-y-0.5 text-[13px] text-ink-2">
                        {professor && <div>Prof.: {professor}</div>}
                        {parceiro && <div>Parceiro: {parceiro}</div>}
                        {c.unidades?.nome && (
                          <div>Unidade: {c.unidades.nome}</div>
                        )}
                        <div>
                          {PERIODOS_LABEL[c.periodo]} ·{" "}
                          {limiteInscricoes(c) != null
                            ? `${limiteInscricoes(c)} vagas de inscrição`
                            : `${c.vagas ?? 0} vagas na turma`}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3.5 grid gap-2 border-t border-black/[.06] pt-3.5">
                    <div className="flex items-center justify-between gap-3 rounded-[10px] bg-subtle/80 px-3.5 py-2.5">
                      <span className="text-[12.5px] font-bold text-ink-2">
                        Visível no site
                      </span>
                      <Toggle
                        on={vis}
                        color="bg-azul"
                        disabled={busy}
                        onClick={() => toggleVis(c)}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-[18px] bg-white lg:block">
            <div className="min-w-[1050px]">
              <div
                className={`grid ${cols} gap-3 bg-site-bg px-[22px] py-3.5 text-xs font-extrabold uppercase tracking-[.04em] text-ink-2`}
              >
                <div>Imagem</div>
                <div>Curso</div>
                <div>Parceiro</div>
                <div>Unidade</div>
                <div>Visível no site</div>
              </div>
              {filtrados.map((c) => {
                const vis = isVisivel(c);
                const busy = pending[c.id];
                const st = statusDe(c);
                const meta = STATUS_META[st];
                const temImg = !semImagem(c);
                return (
                  <div
                    key={c.id}
                    className={`grid ${cols} items-center gap-3 border-t border-black/[.05] px-[22px] py-4`}
                  >
                    <div className="flex flex-col items-start gap-1.5">
                      <div
                        className={[
                          "flex h-11 w-[72px] items-center justify-center overflow-hidden rounded-lg",
                          temImg ? "bg-site-bg" : "bg-dark",
                        ].join(" ")}
                      >
                        <img
                          src={temImg ? c.imagem_url! : CURSO_FALLBACK}
                          alt=""
                          className={
                            temImg
                              ? "h-full w-full object-cover"
                              : "h-7 w-7 object-contain"
                          }
                        />
                      </div>
                      <div className="flex flex-wrap gap-1">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => abrirModalImagem(c)}
                          className="rounded px-1.5 py-0.5 text-[11px] font-bold text-azul hover:bg-azul/[.08] disabled:opacity-50"
                        >
                          {temImg ? "Trocar" : "Definir"}
                        </button>
                        {temImg && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => setConfirmarRemocao(c)}
                            className="rounded px-1.5 py-0.5 text-[11px] font-bold text-vermelho hover:bg-vermelho/[.08] disabled:opacity-50"
                          >
                            Remover
                          </button>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-[14.5px] font-bold">{c.titulo}</div>
                      {c.professor?.trim() && (
                        <div className="mt-0.5 text-[12.5px] text-ink-2">
                          Prof. {nomeCurto(c.professor)}
                        </div>
                      )}
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-[3px] text-[11px] font-bold text-white ${meta.className}`}
                        >
                          {meta.label}
                        </span>
                        <span className="rounded-full bg-subtle px-2.5 py-[3px] text-[11px] font-bold text-ink-mid">
                          {PERIODOS_LABEL[c.periodo]}
                        </span>
                        <span className="text-[12.5px] text-ink-3">
                          {fmtDiaMes(c.inicio)} – {fmtDiaMes(c.fim)}
                        </span>
                      </div>
                    </div>
                    <div className="text-sm text-ink-mid">
                      {c.parceiro_id
                        ? (c.parceiros?.nome ?? "Parceiro")
                        : "—"}
                    </div>
                    <div
                      className="text-sm text-ink-mid"
                      title={c.unidades?.nome ?? undefined}
                    >
                      {nomeUnidadeCurto(c.unidades?.nome)}
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
        </>
      )}

      <Modal
        open={Boolean(cursoImagem)}
        onClose={fecharModalImagem}
        width={640}
      >
        <h2 className="mb-1 font-display text-[22px] font-black">
          Imagem do curso
        </h2>
        <p className="m-0 mb-4 text-[13.5px] text-ink-2">
          {cursoImagem?.titulo} — aparece no card público de Cursos.
        </p>

        <div className="mb-4 flex gap-2">
          {(
            [
              { key: "anexar", label: "Anexar" },
              { key: "buscar", label: "Buscar na internet" },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setAbaImagem(t.key)}
              className={[
                "rounded-full border-[1.5px] px-4 py-2 text-[13px] font-bold transition-colors",
                abaImagem === t.key
                  ? "border-azul bg-azul text-white"
                  : "border-black/[.12] bg-white text-ink-mid hover:border-azul",
              ].join(" ")}
            >
              {t.label}
            </button>
          ))}
        </div>

        {abaImagem === "anexar" ? (
          <div>
            <button
              type="button"
              disabled={enviandoImagem}
              onClick={() => fileRef.current?.click()}
              onDragEnter={(e) => {
                e.preventDefault();
                if (!enviandoImagem) setDragOver(true);
              }}
              onDragOver={(e) => e.preventDefault()}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setDragOver(false);
                }
              }}
              onDrop={aoSoltarArquivo}
              className={[
                "w-full rounded-[14px] border-2 border-dashed p-8 text-center transition-colors disabled:opacity-60",
                dragOver
                  ? "border-azul bg-azul/[.06]"
                  : "border-black/[.18] hover:border-azul",
              ].join(" ")}
            >
              <div className="mb-1.5 text-[28px]">⬆</div>
              <div className="text-[14.5px] font-bold text-ink-mid">
                {enviandoImagem
                  ? "Enviando…"
                  : dragOver
                    ? "Solte a imagem aqui"
                    : "Arraste uma imagem ou clique para escolher"}
              </div>
              <div className="mt-1 text-[12.5px] text-ink-3">
                JPG, PNG, WEBP · até 2 MB
              </div>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (f) void aplicarImagem(f);
              }}
            />
          </div>
        ) : !temUnsplash ? (
          <div className="rounded-[12px] bg-site-bg px-4 py-5 text-[14px] leading-[1.5] text-ink-2">
            Configure a chave <code className="text-[13px]">VITE_UNSPLASH_ACCESS_KEY</code> no
            arquivo <code className="text-[13px]">.env</code> para buscar fotos
            gratuitas no Unsplash. O upload local continua disponível na aba
            Anexar.
          </div>
        ) : (
          <div>
            <div className="mb-3 flex gap-2">
              <input
                type="search"
                value={termoUnsplash}
                onChange={(e) => setTermoUnsplash(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void buscarUnsplash();
                }}
                placeholder="Ex.: cabeleireiro, costura, informática…"
                className="min-w-0 flex-1 rounded-[11px] border-[1.5px] border-black/[.13] px-[14px] py-2.5 text-[14.5px] outline-none focus:border-azul"
              />
              <button
                type="button"
                disabled={buscandoUnsplash || enviandoImagem}
                onClick={() => void buscarUnsplash()}
                className="rounded-full bg-azul px-5 py-2.5 text-[13.5px] font-bold text-white transition-colors hover:bg-azul-hover disabled:opacity-60"
              >
                {buscandoUnsplash ? "Buscando…" : "Buscar"}
              </button>
            </div>
            {enviandoImagem && (
              <p className="mb-3 text-[13px] font-semibold text-azul">
                Baixando e salvando a imagem…
              </p>
            )}
            <div className="grid max-h-[360px] grid-cols-2 gap-2.5 overflow-y-auto sm:grid-cols-3">
              {fotosUnsplash.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  disabled={enviandoImagem}
                  onClick={() => void escolherUnsplash(f)}
                  className="group overflow-hidden rounded-[12px] border border-black/[.08] text-left transition-shadow hover:shadow-card-hover disabled:opacity-60"
                >
                  <img
                    src={f.thumb}
                    alt={f.alt}
                    className="block h-[90px] w-full object-cover"
                  />
                  <div className="px-2 py-1.5 text-[10.5px] leading-snug text-ink-3">
                    Foto de{" "}
                    <a
                      href={`${f.photographerUrl}?utm_source=cmu_site&utm_medium=referral`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="font-bold text-azul hover:underline"
                    >
                      {f.photographer}
                    </a>{" "}
                    /{" "}
                    <a
                      href="https://unsplash.com/?utm_source=cmu_site&utm_medium=referral"
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="font-bold text-azul hover:underline"
                    >
                      Unsplash
                    </a>
                  </div>
                </button>
              ))}
            </div>
            {!fotosUnsplash.length && !buscandoUnsplash && (
              <p className="m-0 mt-2 text-[13px] text-ink-3">
                Busque por um tema relacionado ao curso e clique na foto desejada.
              </p>
            )}
          </div>
        )}

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={fecharModalImagem}
            className="rounded-full border-[1.5px] border-black/[.13] px-6 py-2.5 text-sm font-bold transition-colors hover:border-ink-2"
          >
            Fechar
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirmarRemocao)}
        titulo="Remover a imagem do curso?"
        descricao={
          confirmarRemocao
            ? `"${confirmarRemocao.titulo}" volta a usar a logo do CMU no card do site.`
            : undefined
        }
        onConfirm={() => confirmarRemocao && void removerImagem(confirmarRemocao)}
        onClose={() => setConfirmarRemocao(null)}
      />
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
