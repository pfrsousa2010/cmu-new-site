import { useEffect, useMemo, useRef, useState } from "react";
import Modal from "@/components/Modal";
import { useToast } from "@/components/Toast";
import { CURSO_FALLBACK } from "@/lib/refImages";
import {
  fetchCursosAdmin,
  setInscricoesAtiva,
  setVisivelSite,
  setCursoImagem,
  removerCursoImagem,
  validarImagemCurso,
  isVisivel,
  podeAlternarInscricoes,
  nomeCurto,
  fmtDiaMes,
  PERIODOS_LABEL,
  STATUS_META,
  statusDe,
  type CursoRow,
} from "@/lib/cursos";
import {
  unsplashConfigured,
  buscarFotosUnsplash,
  baixarFotoUnsplash,
  type UnsplashFoto,
} from "@/lib/unsplash";

type AbaImagem = "anexar" | "buscar";

export default function AdminCursos() {
  const { toast } = useToast();
  const [cursos, setCursos] = useState<CursoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<Record<string, boolean>>({});
  const [busca, setBusca] = useState("");

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

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return cursos;
    return cursos.filter((c) => c.titulo.toLowerCase().includes(termo));
  }, [cursos, busca]);

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
    setTermoUnsplash(c.titulo.split(/\s+/).slice(0, 3).join(" "));
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
    if (!confirm(`Remover a imagem de "${c.titulo}"?`)) return;
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
    "grid-cols-[88px_1.8fr_1fr_1.1fr_0.7fr_0.55fr_100px_100px]";

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
        controla <b>imagem do card</b>, <b>visibilidade</b> e{" "}
        <b>inscrições</b>. Sem imagem, o site usa a logo CMU.
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
          <div className="min-w-[1050px]">
            <div
              className={`grid ${cols} gap-3 bg-site-bg px-[22px] py-3.5 text-xs font-extrabold uppercase tracking-[.04em] text-ink-2`}
            >
              <div>Imagem</div>
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
              const temImg = Boolean(c.imagem_url);
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
                          onClick={() => removerImagem(c)}
                          className="rounded px-1.5 py-0.5 text-[11px] font-bold text-vermelho hover:bg-vermelho/[.08] disabled:opacity-50"
                        >
                          Remover
                        </button>
                      )}
                    </div>
                  </div>
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
