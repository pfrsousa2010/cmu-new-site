import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Modal from "@/components/Modal";
import { useToast } from "@/components/Toast";
import {
  fetchArquivosAdmin,
  publicarArquivo,
  removerArquivo,
  setArquivoVisivel,
  setArquivoEncerrado,
  isArquivoVisivel,
  ehCategoriaEdital,
  urlArquivo,
  fmtTamanho,
  fmtDataPublicacao,
  tipoArquivo,
  CATEGORIA_LABEL,
  SUBCAT_TRANSP,
  type ArquivoRow,
  type CategoriaArquivo,
  type SubcatTransparencia,
} from "@/lib/arquivos";

const ABAS: { key: "todos" | CategoriaArquivo; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "compra", label: "Editais de compra" },
  { key: "servicos", label: "Prestação de serviços" },
  { key: "seletivo", label: "Processo seletivo" },
  { key: "transparencia", label: "Transparência" },
];

const CATS_UPLOAD: { key: CategoriaArquivo; label: string }[] = [
  { key: "compra", label: "Edital de compra" },
  { key: "servicos", label: "Prest. de serviços" },
  { key: "seletivo", label: "Proc. seletivo" },
  { key: "transparencia", label: "Transparência" },
];

const inputCls =
  "w-full rounded-[11px] border-[1.5px] border-black/[.13] px-[14px] py-3 text-[15px] outline-none transition-colors focus:border-azul";

const MAX_ARQUIVO_BYTES = 20 * 1024 * 1024;

const EXTENSOES_OK = new Set([
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "png",
  "jpg",
  "jpeg",
  "webp",
  "gif",
]);

function arquivoPermitido(file: File): string | null {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const tipoOk =
    file.type.startsWith("image/") ||
    file.type === "application/pdf" ||
    file.type.includes("word") ||
    file.type.includes("sheet") ||
    file.type.includes("excel") ||
    EXTENSOES_OK.has(ext);
  if (!tipoOk) return "Use PDF, DOC, XLS ou imagem.";
  if (file.size > MAX_ARQUIVO_BYTES) return "Arquivo ultrapassa 20 MB.";
  return null;
}

export default function AdminArquivos() {
  const { toast } = useToast();
  const [params, setParams] = useSearchParams();
  const [arquivos, setArquivos] = useState<ArquivoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [aba, setAba] = useState<"todos" | CategoriaArquivo>("todos");
  const [subFiltro, setSubFiltro] = useState<"todos" | SubcatTransparencia>("todos");
  const [busca, setBusca] = useState("");
  const [pending, setPending] = useState<Record<string, boolean>>({});

  const [modalOpen, setModalOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [nome, setNome] = useState("");
  const [cat, setCat] = useState<CategoriaArquivo>("compra");
  const [subcat, setSubcat] = useState<SubcatTransparencia>("institucionais");
  const [salvando, setSalvando] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const recarregar = async () => {
    setArquivos(await fetchArquivosAdmin());
    setLoading(false);
  };

  useEffect(() => {
    recarregar();
  }, []);

  useEffect(() => {
    if (params.get("novo") === "1") {
      abrirUpload();
      params.delete("novo");
      setParams(params, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const abrirUpload = () => {
    setFile(null);
    setNome("");
    setCat("compra");
    setSubcat("institucionais");
    setDragOver(false);
    setModalOpen(true);
  };

  const escolherArquivo = (f: File | null | undefined) => {
    if (!f) return;
    const erro = arquivoPermitido(f);
    if (erro) {
      toast(erro);
      return;
    }
    setFile(f);
    setNome((n) => n || f.name.replace(/\.[^.]+$/, ""));
  };

  const aoSoltarArquivo = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (salvando) return;
    escolherArquivo(e.dataTransfer.files?.[0]);
  };

  const publicar = async () => {
    if (!file) {
      toast("Escolha um arquivo primeiro");
      return;
    }
    setSalvando(true);
    try {
      await publicarArquivo({
        nome: nome.trim(),
        categoria: cat,
        subcategoria: subcat,
        file,
      });
      await recarregar();
      setModalOpen(false);
      toast("Arquivo publicado no site");
    } catch (err) {
      toast("Erro ao publicar arquivo");
      console.error(err);
    } finally {
      setSalvando(false);
    }
  };

  const toggleVis = async (a: ArquivoRow) => {
    const novo = !isArquivoVisivel(a);
    setPending((p) => ({ ...p, [a.id]: true }));
    setArquivos((list) =>
      list.map((x) => (x.id === a.id ? { ...x, visivel_site: novo } : x))
    );
    try {
      await setArquivoVisivel(a.id, novo);
      toast(novo ? "Arquivo visível no site" : "Arquivo oculto do site");
    } catch (err) {
      setArquivos((list) =>
        list.map((x) => (x.id === a.id ? { ...x, visivel_site: !novo } : x))
      );
      toast("Erro ao atualizar visibilidade (a coluna visivel_site existe?)");
      console.error(err);
    } finally {
      setPending((p) => ({ ...p, [a.id]: false }));
    }
  };

  const toggleEncerrado = async (a: ArquivoRow) => {
    const novo = !(a.encerrado === true);
    setPending((p) => ({ ...p, [a.id]: true }));
    setArquivos((list) =>
      list.map((x) => (x.id === a.id ? { ...x, encerrado: novo } : x))
    );
    try {
      await setArquivoEncerrado(a.id, novo);
      toast(novo ? "Edital marcado como encerrado" : "Edital marcado como aberto");
    } catch (err) {
      setArquivos((list) =>
        list.map((x) => (x.id === a.id ? { ...x, encerrado: !novo } : x))
      );
      toast("Erro ao atualizar status do edital");
      console.error(err);
    } finally {
      setPending((p) => ({ ...p, [a.id]: false }));
    }
  };

  const remover = async (a: ArquivoRow) => {
    if (!confirm(`Remover "${a.nome}"?`)) return;
    try {
      await removerArquivo(a);
      await recarregar();
      toast("Arquivo removido");
    } catch (err) {
      toast("Erro ao remover arquivo");
      console.error(err);
    }
  };

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return arquivos.filter((a) => {
      if (aba !== "todos" && a.categoria !== aba) return false;
      if (aba === "transparencia" && subFiltro !== "todos") {
        const sub = a.subcategoria ?? "institucionais";
        if (sub !== subFiltro) return false;
      }
      if (termo && !a.nome.toLowerCase().includes(termo)) return false;
      return true;
    });
  }, [arquivos, aba, subFiltro, busca]);

  const labelSubcat = (key: SubcatTransparencia | null | undefined) =>
    SUBCAT_TRANSP.find((s) => s.key === (key ?? "institucionais"))?.label ??
    "Institucionais";

  const corSubcat = (key: SubcatTransparencia | null | undefined) =>
    SUBCAT_TRANSP.find((s) => s.key === (key ?? "institucionais"))?.cor ??
    "bg-azul";

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="mb-1 font-display text-[28px] font-black">
            Editais e arquivos
          </h1>
          <p className="m-0 text-[14.5px] text-ink-2">
            Publique ou remova editais, documentos de transparência e outros
            arquivos. Use o toggle para controlar o que aparece no site.
          </p>
        </div>
        <button
          onClick={abrirUpload}
          className="rounded-full bg-vermelho px-[22px] py-3 font-display text-[14.5px] font-extrabold text-white shadow-[0_3px_10px_rgba(209,58,65,.3)] transition-colors hover:bg-vermelho-hover"
        >
          + Publicar arquivo
        </button>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {ABAS.map((a) => {
          const active = aba === a.key;
          return (
            <button
              key={a.key}
              onClick={() => {
                setAba(a.key);
                setSubFiltro("todos");
              }}
              className={[
                "rounded-full border-[1.5px] px-[18px] py-[9px] text-[13.5px] font-bold transition-colors",
                active
                  ? "border-dark bg-dark text-white"
                  : "border-black/[.12] bg-white text-ink-mid hover:border-dark",
              ].join(" ")}
            >
              {a.label}
            </button>
          );
        })}
      </div>

      {aba === "transparencia" && (
        <div className="mb-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSubFiltro("todos")}
            className={[
              "rounded-full border-[1.5px] px-[15px] py-2 text-[13px] font-bold transition-colors",
              subFiltro === "todos"
                ? "border-azul bg-azul text-white"
                : "border-black/[.12] bg-white text-ink-mid hover:border-azul",
            ].join(" ")}
          >
            Todas as subcategorias
          </button>
          {SUBCAT_TRANSP.map((s) => {
            const active = subFiltro === s.key;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => setSubFiltro(s.key)}
                className={[
                  "rounded-full border-[1.5px] px-[15px] py-2 text-[13px] font-bold transition-colors",
                  active
                    ? "border-azul bg-azul text-white"
                    : "border-black/[.12] bg-white text-ink-mid hover:border-azul",
                ].join(" ")}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      )}

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <input
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar arquivo pelo nome…"
          aria-label="Buscar arquivo pelo nome"
          className="w-full max-w-md rounded-xl border-[1.5px] border-black/[.12] bg-white px-4 py-3 text-[14.5px] text-ink outline-none transition-colors placeholder:text-ink-2/70 focus:border-azul"
        />
        {!loading && (
          <p className="m-0 text-[14px] font-bold text-ink-2">
            {busca.trim() || aba !== "todos" || subFiltro !== "todos"
              ? `${filtrados.length} de ${arquivos.length} ${arquivos.length === 1 ? "arquivo" : "arquivos"}`
              : `${arquivos.length} ${arquivos.length === 1 ? "arquivo" : "arquivos"}`}
          </p>
        )}
      </div>

      {loading ? (
        <p className="text-ink-2">Carregando…</p>
      ) : arquivos.length === 0 ? (
        <p className="text-ink-2">Nenhum arquivo cadastrado.</p>
      ) : filtrados.length === 0 ? (
        <p className="text-ink-2">
          {busca.trim()
            ? `Nenhum arquivo encontrado para “${busca.trim()}”.`
            : "Nenhum arquivo nesta categoria."}
        </p>
      ) : (
        <div className="grid gap-2.5">
          {filtrados.map((ar) => {
            const vis = isArquivoVisivel(ar);
            const busy = pending[ar.id];
            const edital = ehCategoriaEdital(ar.categoria);
            const encerrado = ar.encerrado === true;
            return (
              <div
                key={ar.id}
                className="flex flex-wrap items-center gap-4 rounded-[14px] bg-white px-5 py-[15px]"
              >
                <div className="flex h-10 w-10 flex-none items-center justify-center rounded-[10px] bg-vermelho/10 text-[10.5px] font-extrabold text-vermelho">
                  {tipoArquivo(ar.mime, ar.nome)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-[14.5px] font-bold">{ar.nome}</div>
                    {ar.categoria === "transparencia" && (
                      <span
                        className={`rounded-full px-2.5 py-[3px] text-[11px] font-bold text-white ${corSubcat(ar.subcategoria)}`}
                      >
                        {labelSubcat(ar.subcategoria)}
                      </span>
                    )}
                  </div>
                  <div className="mt-px text-[12.5px] text-ink-2">
                    {CATEGORIA_LABEL[ar.categoria]} ·{" "}
                    {fmtDataPublicacao(ar.publicado_em)} ·{" "}
                    {fmtTamanho(ar.tamanho_bytes)}
                  </div>
                </div>
                {edital && (
                  <div className="flex flex-none items-center gap-1 rounded-full border border-black/[.1] bg-site-bg p-0.5">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => encerrado && toggleEncerrado(ar)}
                      className={[
                        "rounded-full px-3 py-[5px] text-[11px] font-bold transition-colors disabled:opacity-50",
                        !encerrado
                          ? "bg-verde text-white"
                          : "text-ink-2 hover:text-ink",
                      ].join(" ")}
                    >
                      Aberto
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => !encerrado && toggleEncerrado(ar)}
                      className={[
                        "rounded-full px-3 py-[5px] text-[11px] font-bold transition-colors disabled:opacity-50",
                        encerrado
                          ? "bg-ink-mid text-white"
                          : "text-ink-2 hover:text-ink",
                      ].join(" ")}
                    >
                      Encerrado
                    </button>
                  </div>
                )}
                <div className="flex flex-none flex-col items-center gap-1">
                  <span className="text-[11px] font-bold text-ink-2">
                    Visível no site
                  </span>
                  <Toggle
                    on={vis}
                    color="bg-azul"
                    disabled={busy}
                    onClick={() => toggleVis(ar)}
                  />
                </div>
                <a
                  href={urlArquivo(ar)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-none rounded-lg px-[11px] py-[7px] text-[13px] font-bold text-azul hover:bg-azul/[.08]"
                >
                  Baixar
                </a>
                <button
                  onClick={() => remover(ar)}
                  className="flex-none rounded-lg px-[11px] py-[7px] text-[13px] font-bold text-vermelho hover:bg-vermelho/[.08]"
                >
                  Remover
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal upload */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} width={560}>
        <h2 className="mb-[22px] font-display text-[22px] font-black">
          Publicar arquivo
        </h2>
        <div className="grid gap-3.5">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            onDragEnter={(e) => {
              e.preventDefault();
              if (!salvando) setDragOver(true);
            }}
            onDragOver={(e) => e.preventDefault()}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setDragOver(false);
              }
            }}
            onDrop={aoSoltarArquivo}
            className={[
              "rounded-[14px] border-2 border-dashed p-[34px] text-center transition-colors",
              dragOver
                ? "border-azul bg-azul/[.06]"
                : file
                  ? "border-verde bg-verde/[.07]"
                  : "border-black/[.18] hover:border-azul",
            ].join(" ")}
          >
            <div className="mb-1.5 text-[28px]">{file ? "✓" : "⬆"}</div>
            <div className="text-[14.5px] font-bold text-ink-mid">
              {file
                ? `${file.name} selecionado`
                : dragOver
                  ? "Solte o arquivo aqui"
                  : "Arraste um arquivo ou clique para escolher"}
            </div>
            <div className="mt-1 text-[12.5px] text-ink-3">
              PDF, DOC, XLS ou imagem · até 20 MB
            </div>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,image/*"
            hidden
            onChange={(e) => {
              escolherArquivo(e.target.files?.[0]);
              e.target.value = "";
            }}
          />

          <div>
            <div className="mb-1.5 text-[13px] font-bold">Nome de exibição</div>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex.: Edital de compra 03/2026"
              className={inputCls}
            />
          </div>

          <div>
            <div className="mb-1.5 text-[13px] font-bold">Categoria</div>
            <div className="flex flex-wrap gap-2">
              {CATS_UPLOAD.map((c) => {
                const active = cat === c.key;
                return (
                  <button
                    key={c.key}
                    onClick={() => setCat(c.key)}
                    className={[
                      "rounded-full border-[1.5px] px-[15px] py-2 text-[13px] font-bold transition-colors",
                      active
                        ? "border-vermelho bg-vermelho text-white"
                        : "border-black/[.12] bg-white text-ink-mid hover:border-vermelho",
                    ].join(" ")}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          {cat === "transparencia" && (
            <div>
              <div className="mb-1.5 text-[13px] font-bold">
                Grupo na Transparência
              </div>
              <div className="flex flex-wrap gap-2">
                {SUBCAT_TRANSP.map((s) => {
                  const active = subcat === s.key;
                  return (
                    <button
                      key={s.key}
                      onClick={() => setSubcat(s.key)}
                      className={[
                        "rounded-full border-[1.5px] px-[15px] py-2 text-[13px] font-bold transition-colors",
                        active
                          ? "border-azul bg-azul text-white"
                          : "border-black/[.12] bg-white text-ink-mid hover:border-azul",
                      ].join(" ")}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-2 flex justify-end gap-3">
            <button
              onClick={() => setModalOpen(false)}
              className="rounded-full border-[1.5px] border-black/[.13] px-6 py-3 text-sm font-bold transition-colors hover:border-ink-2"
            >
              Cancelar
            </button>
            <button
              onClick={publicar}
              disabled={salvando}
              className="rounded-full bg-vermelho px-7 py-3 font-display text-sm font-extrabold text-white transition-colors hover:bg-vermelho-hover disabled:opacity-60"
            >
              {salvando ? "Publicando…" : "Publicar"}
            </button>
          </div>
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
