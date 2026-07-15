import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Modal from "@/components/Modal";
import { useToast } from "@/components/Toast";
import {
  fetchArquivos,
  publicarArquivo,
  removerArquivo,
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

export default function AdminArquivos() {
  const { toast } = useToast();
  const [params, setParams] = useSearchParams();
  const [arquivos, setArquivos] = useState<ArquivoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [aba, setAba] = useState<"todos" | CategoriaArquivo>("todos");

  const [modalOpen, setModalOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [nome, setNome] = useState("");
  const [cat, setCat] = useState<CategoriaArquivo>("compra");
  const [subcat, setSubcat] = useState<SubcatTransparencia>("institucionais");
  const [salvando, setSalvando] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const recarregar = async () => {
    setArquivos(await fetchArquivos());
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
    setModalOpen(true);
  };

  const publicar = async () => {
    if (!file) {
      toast("Escolha um arquivo primeiro");
      return;
    }
    setSalvando(true);
    try {
      await publicarArquivo({ nome: nome.trim(), categoria: cat, subcategoria: subcat, file });
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

  const filtrados = arquivos.filter(
    (a) => aba === "todos" || a.categoria === aba
  );

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="mb-1 font-display text-[28px] font-black">
            Editais e arquivos
          </h1>
          <p className="m-0 text-[14.5px] text-ink-2">
            Publique ou remova editais, documentos de transparência e outros
            arquivos.
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
              onClick={() => setAba(a.key)}
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

      {loading ? (
        <p className="text-ink-2">Carregando…</p>
      ) : filtrados.length === 0 ? (
        <p className="text-ink-2">Nenhum arquivo nesta categoria.</p>
      ) : (
        <div className="grid gap-2.5">
          {filtrados.map((ar) => (
            <div
              key={ar.id}
              className="flex flex-wrap items-center gap-4 rounded-[14px] bg-white px-5 py-[15px]"
            >
              <div className="flex h-10 w-10 flex-none items-center justify-center rounded-[10px] bg-vermelho/10 text-[10.5px] font-extrabold text-vermelho">
                {tipoArquivo(ar.mime, ar.nome)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[14.5px] font-bold">{ar.nome}</div>
                <div className="mt-px text-[12.5px] text-ink-2">
                  {CATEGORIA_LABEL[ar.categoria]} ·{" "}
                  {fmtDataPublicacao(ar.publicado_em)} ·{" "}
                  {fmtTamanho(ar.tamanho_bytes)}
                </div>
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
          ))}
        </div>
      )}

      {/* Modal upload */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} width={560}>
        <h2 className="mb-[22px] font-display text-[22px] font-black">
          Publicar arquivo
        </h2>
        <div className="grid gap-3.5">
          <button
            onClick={() => fileRef.current?.click()}
            className={[
              "rounded-[14px] border-2 border-dashed p-[34px] text-center transition-colors hover:border-azul",
              file ? "border-verde bg-verde/[.07]" : "border-black/[.18]",
            ].join(" ")}
          >
            <div className="mb-1.5 text-[28px]">{file ? "✓" : "⬆"}</div>
            <div className="text-[14.5px] font-bold text-ink-mid">
              {file ? `${file.name} selecionado` : "Clique para escolher um arquivo"}
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
              const f = e.target.files?.[0] ?? null;
              setFile(f);
              if (f && !nome) setNome(f.name.replace(/\.[^.]+$/, ""));
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
