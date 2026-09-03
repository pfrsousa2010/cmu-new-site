import { useEffect, useRef, useState } from "react";
import Modal from "@/components/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useToast } from "@/components/Toast";
import {
  fetchDepoimentosAdmin,
  adicionarDepoimento,
  atualizarDepoimento,
  removerDepoimento,
  setDepoimentoAtivo,
  trocarOrdemDepoimento,
  proximaOrdemDepoimento,
  validarMidiaDepoimento,
  urlMidia,
  urlPoster,
  ehVideo,
  type Depoimento,
} from "@/lib/depoimentos";

export default function AdminDepoimentos() {
  const { toast } = useToast();
  const [lista, setLista] = useState<Depoimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<Record<string, boolean>>({});
  const [editando, setEditando] = useState<Depoimento | null>(null);
  const [criando, setCriando] = useState(false);
  const [confirmarRemocao, setConfirmarRemocao] = useState<Depoimento | null>(
    null
  );

  const recarregar = async () => {
    const data = await fetchDepoimentosAdmin();
    setLista(data);
    return data;
  };

  useEffect(() => {
    let ativo = true;
    fetchDepoimentosAdmin().then((data) => {
      if (!ativo) return;
      setLista(data);
      setLoading(false);
    });
    return () => {
      ativo = false;
    };
  }, []);

  const remover = async (d: Depoimento) => {
    setConfirmarRemocao(null);
    setPending((s) => ({ ...s, [d.id]: true }));
    try {
      await removerDepoimento(d);
      setLista((ds) => ds.filter((x) => x.id !== d.id));
      toast("Depoimento removido");
    } catch (err) {
      toast(`Erro ao remover: ${(err as Error).message}`);
      console.error(err);
    } finally {
      setPending((s) => ({ ...s, [d.id]: false }));
    }
  };

  const toggleAtivo = async (d: Depoimento) => {
    const novo = !d.ativo;
    setPending((s) => ({ ...s, [d.id]: true }));
    setLista((ds) => ds.map((x) => (x.id === d.id ? { ...x, ativo: novo } : x)));
    try {
      await setDepoimentoAtivo(d.id, novo);
      toast(novo ? "Depoimento no site" : "Depoimento oculto do site");
    } catch (err) {
      setLista((ds) =>
        ds.map((x) => (x.id === d.id ? { ...x, ativo: !novo } : x))
      );
      toast("Erro ao atualizar");
      console.error(err);
    } finally {
      setPending((s) => ({ ...s, [d.id]: false }));
    }
  };

  const mover = async (d: Depoimento, direcao: -1 | 1) => {
    const i = lista.findIndex((x) => x.id === d.id);
    const vizinho = lista[i + direcao];
    if (!vizinho) return;

    setPending((s) => ({ ...s, [d.id]: true, [vizinho.id]: true }));
    const anterior = lista;
    const otimista = [...lista];
    otimista[i] = vizinho;
    otimista[i + direcao] = d;
    setLista(otimista);
    try {
      await trocarOrdemDepoimento(d, vizinho);
    } catch (err) {
      setLista(anterior);
      toast("Erro ao reordenar");
      console.error(err);
    } finally {
      setPending((s) => ({ ...s, [d.id]: false, [vizinho.id]: false }));
    }
  };

  const salvar = async (
    dados: { nome: string; texto: string },
    midia: File | null
  ) => {
    if (editando) {
      await atualizarDepoimento(editando, dados, midia);
      toast("Depoimento atualizado");
    } else {
      if (!midia) throw new Error("Escolha uma foto ou um vídeo.");
      await adicionarDepoimento(dados, midia, proximaOrdemDepoimento(lista));
      toast("Depoimento adicionado");
    }
    setEditando(null);
    setCriando(false);
    await recarregar();
  };

  const ativos = lista.filter((d) => d.ativo).length;

  return (
    <div>
      <h1 className="mb-1 font-display text-[28px] font-black">Depoimentos</h1>
      <p className="m-0 mb-5 max-w-[640px] text-[14.5px] leading-[1.55] text-ink-2">
        Histórias de alunas e alunos que aparecem na página inicial, na ordem
        definida aqui. Cada depoimento leva uma foto ou um vídeo. Sem nenhum
        depoimento ativo, a seção some da página inicial.
      </p>

      <button
        type="button"
        onClick={() => {
          setEditando(null);
          setCriando(true);
        }}
        className="mb-6 rounded-full bg-azul px-6 py-2.5 font-display text-[14px] font-extrabold text-white transition-colors hover:bg-azul-hover"
      >
        Adicionar depoimento
      </button>

      {loading ? (
        <p className="text-ink-2">Carregando…</p>
      ) : lista.length === 0 ? (
        <p className="text-ink-2">
          Nenhum depoimento cadastrado. Enquanto não houver nenhum, a seção não
          aparece na página inicial.
        </p>
      ) : (
        <>
          <p className="mb-3 text-[13.5px] font-bold text-ink-2">
            {lista.length}{" "}
            {lista.length === 1 ? "depoimento" : "depoimentos"} · {ativos}{" "}
            {ativos === 1 ? "aparecendo" : "aparecendo"} no site
          </p>
          <div className="grid gap-4">
            {lista.map((d, i) => {
              const busy = pending[d.id];
              const capa = urlPoster(d);
              return (
                <div
                  key={d.id}
                  className={[
                    "flex flex-col gap-4 rounded-2xl border border-black/[.06] bg-white p-4 shadow-sm transition-opacity sm:flex-row",
                    busy ? "opacity-60" : "",
                    d.ativo ? "" : "opacity-70",
                  ].join(" ")}
                >
                  <div className="relative h-[110px] w-[110px] shrink-0 self-center overflow-hidden rounded-xl bg-subtle sm:self-start">
                    {capa ? (
                      <img
                        src={capa}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-ink-mid">
                        ▶
                      </span>
                    )}
                    {d.midia_tipo === "video" && (
                      <span className="absolute bottom-1 left-1 rounded-full bg-dark/80 px-2 py-[2px] text-[10px] font-bold text-white">
                        Vídeo
                      </span>
                    )}
                    <span className="absolute right-1 top-1 rounded-full bg-dark/80 px-2 py-[2px] text-[10px] font-bold text-white">
                      {i + 1}º
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-display text-[16px] font-extrabold text-ink">
                        {d.nome}
                      </span>
                      {!d.ativo && (
                        <span className="rounded-full bg-ink-mid px-2.5 py-[2px] text-[11px] font-bold text-white">
                          Inativo
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 line-clamp-3 text-[14px] leading-[1.55] text-ink-2">
                      {d.texto}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        disabled={busy || i === 0}
                        onClick={() => void mover(d, -1)}
                        aria-label="Mover para cima"
                        className="rounded-lg bg-subtle px-2.5 py-1.5 text-[13px] font-bold text-ink-mid transition-colors hover:bg-azul/[.1] hover:text-azul disabled:opacity-40"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        disabled={busy || i === lista.length - 1}
                        onClick={() => void mover(d, 1)}
                        aria-label="Mover para baixo"
                        className="rounded-lg bg-subtle px-2.5 py-1.5 text-[13px] font-bold text-ink-mid transition-colors hover:bg-azul/[.1] hover:text-azul disabled:opacity-40"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          setCriando(false);
                          setEditando(d);
                        }}
                        className="rounded-lg px-2.5 py-1.5 text-[13px] font-bold text-ink-mid transition-colors hover:bg-azul/[.1] hover:text-azul disabled:opacity-40"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void toggleAtivo(d)}
                        className="rounded-lg px-2.5 py-1.5 text-[13px] font-bold text-azul transition-colors hover:bg-azul/[.1] disabled:opacity-40"
                      >
                        {d.ativo ? "Desativar" : "Ativar"}
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setConfirmarRemocao(d)}
                        className="ml-auto rounded-lg px-2.5 py-1.5 text-[13px] font-bold text-vermelho transition-colors hover:bg-vermelho/[.1] disabled:opacity-40"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <FormDepoimento
        open={criando || Boolean(editando)}
        depoimento={editando}
        onClose={() => {
          setCriando(false);
          setEditando(null);
        }}
        onSalvar={salvar}
      />

      <ConfirmDialog
        open={Boolean(confirmarRemocao)}
        titulo="Remover este depoimento?"
        descricao={
          confirmarRemocao
            ? `O depoimento de ${confirmarRemocao.nome} sai da página inicial e o arquivo é apagado. Não dá para desfazer. Para tirar do site sem apagar, use Desativar.`
            : undefined
        }
        onConfirm={() => confirmarRemocao && void remover(confirmarRemocao)}
        onClose={() => setConfirmarRemocao(null)}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------

function FormDepoimento({
  open,
  depoimento,
  onClose,
  onSalvar,
}: {
  open: boolean;
  depoimento: Depoimento | null;
  onClose: () => void;
  onSalvar: (
    dados: { nome: string; texto: string },
    midia: File | null
  ) => Promise<void>;
}) {
  const { toast } = useToast();
  const [nome, setNome] = useState("");
  const [texto, setTexto] = useState("");
  const [midia, setMidia] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Recarrega o formulário sempre que abre, para não vazar dado de uma edição
  // anterior no cadastro seguinte.
  useEffect(() => {
    if (!open) return;
    setNome(depoimento?.nome ?? "");
    setTexto(depoimento?.texto ?? "");
    setMidia(null);
    setPreviewUrl(null);
    if (inputRef.current) inputRef.current.value = "";
  }, [open, depoimento]);

  // O object URL do preview precisa ser liberado, senão o arquivo fica na
  // memória da aba até recarregar a página.
  useEffect(() => {
    if (!midia) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(midia);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [midia]);

  /**
   * Aceita um arquivo só. Soltar vários seria ambíguo — o depoimento tem uma
   * mídia — então avisa em vez de escolher um por conta própria.
   */
  const escolher = (files: FileList | File[] | null | undefined) => {
    const lista = files ? Array.from(files) : [];
    if (lista.length === 0) return;
    if (lista.length > 1) {
      toast("Solte apenas um arquivo: o depoimento tem uma foto ou um vídeo.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    const file = lista[0];
    const erro = validarMidiaDepoimento(file);
    if (erro) {
      toast(erro);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    setMidia(file);
  };

  const salvar = async () => {
    setSalvando(true);
    try {
      await onSalvar({ nome, texto }, midia);
    } catch (err) {
      toast((err as Error).message);
      console.error(err);
    } finally {
      setSalvando(false);
    }
  };

  const capaAtual = depoimento ? urlPoster(depoimento) : null;
  const mostrandoVideoNovo = midia ? ehVideo(midia) : false;

  return (
    <Modal
      open={open}
      onClose={onClose}
      width={640}
      className="flex flex-col overflow-hidden p-0"
    >
      <div className="shrink-0 border-b border-black/[.07] px-7 pb-4 pt-6">
        <h2 className="m-0 font-display text-[20px] font-extrabold text-ink">
          {depoimento ? "Editar depoimento" : "Novo depoimento"}
        </h2>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-7 py-5">
        <div>
          <label
            htmlFor="dep-nome"
            className="mb-1.5 block text-[13.5px] font-bold text-ink"
          >
            Nome de quem fala <span className="text-vermelho">*</span>
          </label>
          <input
            id="dep-nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="w-full rounded-xl border-[1.5px] border-black/[.12] bg-white px-4 py-3 text-[15px] text-ink outline-none transition-colors focus:border-azul"
          />
        </div>

        <div>
          <label
            htmlFor="dep-texto"
            className="mb-1.5 block text-[13.5px] font-bold text-ink"
          >
            Depoimento <span className="text-vermelho">*</span>
          </label>
          <textarea
            id="dep-texto"
            rows={6}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Escreva sem as aspas — o site já coloca."
            className="w-full resize-y rounded-xl border-[1.5px] border-black/[.12] bg-white px-4 py-3 text-[15px] leading-[1.6] text-ink outline-none transition-colors placeholder:text-ink-2/60 focus:border-azul"
          />
        </div>

        <div>
          <span className="mb-1.5 block text-[13.5px] font-bold text-ink">
            Foto ou vídeo{" "}
            {!depoimento && <span className="text-vermelho">*</span>}
          </span>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              escolher(e.dataTransfer.files);
            }}
            onClick={() => inputRef.current?.click()}
            className={[
              "cursor-pointer rounded-xl border-2 border-dashed px-5 py-6 text-center transition-colors",
              dragOver
                ? "border-azul bg-azul/[.06]"
                : "border-black/[.14] bg-white hover:border-azul",
            ].join(" ")}
          >
            <div className="font-display text-[14.5px] font-extrabold text-ink">
              {midia
                ? midia.name
                : "Arraste a foto ou o vídeo para cá"}
            </div>
            <div className="mt-1 text-[12.5px] text-ink-2">
              Um arquivo por depoimento
            </div>
            <button
              type="button"
              onClick={(e) => {
                // A área também abre o seletor; sem isso abriria duas vezes.
                e.stopPropagation();
                inputRef.current?.click();
              }}
              className="mt-3 rounded-full bg-azul px-5 py-2 font-display text-[13px] font-extrabold text-white transition-colors hover:bg-azul-hover"
            >
              {midia ? "Trocar arquivo" : "Escolher arquivo"}
            </button>
          </div>
          <input
            id="dep-midia"
            ref={inputRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={(e) => escolher(e.target.files)}
          />
          <p className="mt-1.5 text-[12.5px] text-ink-2">
            Foto até 2 MB · vídeo até 25 MB. No vídeo, a capa é tirada
            automaticamente de um quadro.
            {depoimento && " Deixe em branco para manter a mídia atual."}
          </p>

          {(previewUrl || capaAtual) && (
            <div className="mt-3 flex items-center gap-3">
              {previewUrl && mostrandoVideoNovo ? (
                <video
                  src={previewUrl}
                  controls
                  playsInline
                  className="h-[120px] rounded-xl bg-dark"
                />
              ) : (
                <img
                  src={previewUrl ?? capaAtual ?? ""}
                  alt=""
                  className="h-[120px] w-[120px] rounded-xl object-cover"
                />
              )}
              <span className="text-[13px] text-ink-2">
                {previewUrl ? "Mídia nova" : "Mídia atual"}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap justify-end gap-3 border-t border-black/[.07] px-7 py-4">
        <button
          type="button"
          onClick={onClose}
          disabled={salvando}
          className="rounded-full border-[1.5px] border-black/[.12] bg-white px-5 py-2.5 font-display text-[13.5px] font-extrabold text-ink transition-colors hover:border-azul hover:text-azul disabled:opacity-40"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={() => void salvar()}
          disabled={salvando}
          className="rounded-full bg-verde px-6 py-2.5 font-display text-[13.5px] font-extrabold text-white transition-colors hover:bg-verde-hover disabled:opacity-40"
        >
          {salvando ? "Salvando…" : "Salvar"}
        </button>
      </div>
    </Modal>
  );
}
