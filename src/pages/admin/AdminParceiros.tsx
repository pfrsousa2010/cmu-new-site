import { useEffect, useRef, useState } from "react";
import { useToast } from "@/components/Toast";
import ConfirmDialog from "@/components/ConfirmDialog";
import RecorteImagem from "@/components/RecorteImagem";
import {
  fetchParceirosAdmin,
  adicionarParceiro,
  removerParceiro,
  setParceiroAtivo,
  setParceiroNome,
  trocarOrdemParceiro,
  proximaOrdemParceiro,
  validarLogoParceiro,
  urlLogoParceiro,
  recortarParaArquivo,
  substituirArquivoParceiro,
  ehSvg,
  type ParceiroLogo,
  type Recorte,
} from "@/lib/parceiros";

export default function AdminParceiros() {
  const { toast } = useToast();
  const [parceiros, setParceiros] = useState<ParceiroLogo[]>([]);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [progresso, setProgresso] = useState({ feitas: 0, total: 0 });
  const [pending, setPending] = useState<Record<string, boolean>>({});
  const [dragOver, setDragOver] = useState(false);
  const [confirmarRemocao, setConfirmarRemocao] =
    useState<ParceiroLogo | null>(null);
  const [recortando, setRecortando] = useState<ParceiroLogo | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const recarregar = async () => {
    const data = await fetchParceirosAdmin();
    setParceiros(data);
    return data;
  };

  useEffect(() => {
    let ativo = true;
    fetchParceirosAdmin().then((data) => {
      if (!ativo) return;
      setParceiros(data);
      setLoading(false);
    });
    return () => {
      ativo = false;
    };
  }, []);

  const enviarArquivos = async (files: FileList | File[]) => {
    const lista = Array.from(files);
    if (lista.length === 0) return;

    const validos: File[] = [];
    for (const file of lista) {
      const erro = validarLogoParceiro(file);
      if (erro) toast(`${file.name}: ${erro}`);
      else validos.push(file);
    }
    if (validos.length === 0) return;

    setEnviando(true);
    setProgresso({ feitas: 0, total: validos.length });
    let ordem = proximaOrdemParceiro(parceiros);
    let enviados = 0;
    try {
      for (const file of validos) {
        await adicionarParceiro(file, ordem);
        ordem += 1;
        enviados += 1;
        setProgresso({ feitas: enviados, total: validos.length });
      }
      toast(enviados === 1 ? "Logo adicionado" : `${enviados} logos adicionados`);
    } catch (err) {
      // Mostra o motivo real: "tente novamente" sozinho manda o admin repetir
      // um erro que não vai passar (bucket inexistente, arquivo recusado…).
      toast(`Não foi possível enviar o logo: ${(err as Error).message}`);
      console.error(err);
    } finally {
      await recarregar();
      setEnviando(false);
      setProgresso({ feitas: 0, total: 0 });
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remover = async (p: ParceiroLogo) => {
    setConfirmarRemocao(null);
    setPending((s) => ({ ...s, [p.id]: true }));
    try {
      await removerParceiro(p);
      setParceiros((ps) => ps.filter((x) => x.id !== p.id));
      toast("Logo removido");
    } catch (err) {
      toast("Erro ao remover logo");
      console.error(err);
    } finally {
      setPending((s) => ({ ...s, [p.id]: false }));
    }
  };

  const toggleAtivo = async (p: ParceiroLogo) => {
    const novo = !p.ativo;
    setPending((s) => ({ ...s, [p.id]: true }));
    setParceiros((ps) =>
      ps.map((x) => (x.id === p.id ? { ...x, ativo: novo } : x))
    );
    try {
      await setParceiroAtivo(p.id, novo);
      toast(novo ? "Logo aparecendo no site" : "Logo oculto do site");
    } catch (err) {
      setParceiros((ps) =>
        ps.map((x) => (x.id === p.id ? { ...x, ativo: !novo } : x))
      );
      toast("Erro ao atualizar o logo");
      console.error(err);
    } finally {
      setPending((s) => ({ ...s, [p.id]: false }));
    }
  };

  const mover = async (p: ParceiroLogo, direcao: -1 | 1) => {
    const i = parceiros.findIndex((x) => x.id === p.id);
    const vizinho = parceiros[i + direcao];
    if (!vizinho) return;

    setPending((s) => ({ ...s, [p.id]: true, [vizinho.id]: true }));
    const anterior = parceiros;
    const otimista = [...parceiros];
    otimista[i] = vizinho;
    otimista[i + direcao] = p;
    setParceiros(otimista);
    try {
      await trocarOrdemParceiro(p, vizinho);
    } catch (err) {
      setParceiros(anterior);
      toast("Erro ao reordenar");
      console.error(err);
    } finally {
      setPending((s) => ({ ...s, [p.id]: false, [vizinho.id]: false }));
    }
  };

  const salvarNome = async (p: ParceiroLogo, nome: string) => {
    const limpo = nome.trim();
    if (limpo === p.nome) return;
    if (!limpo) {
      toast("O nome do parceiro não pode ficar vazio.");
      await recarregar();
      return;
    }
    setParceiros((ps) =>
      ps.map((x) => (x.id === p.id ? { ...x, nome: limpo } : x))
    );
    try {
      await setParceiroNome(p.id, limpo);
    } catch (err) {
      toast("Erro ao salvar o nome");
      console.error(err);
      await recarregar();
    }
  };

  const aplicarRecorte = async (
    p: ParceiroLogo,
    img: HTMLImageElement,
    area: Recorte
  ) => {
    setPending((s) => ({ ...s, [p.id]: true }));
    try {
      const arquivo = await recortarParaArquivo(img, area, p.storage_path);
      await substituirArquivoParceiro(p, arquivo);
      setRecortando(null);
      await recarregar();
      toast("Recorte aplicado");
    } catch (err) {
      toast(`Não foi possível recortar: ${(err as Error).message}`);
      console.error(err);
    } finally {
      setPending((s) => ({ ...s, [p.id]: false }));
    }
  };

  const ativos = parceiros.filter((p) => p.ativo).length;

  return (
    <div>
      <h1 className="mb-1 font-display text-[28px] font-black">
        Logos dos parceiros
      </h1>
      <p className="m-0 mb-5 max-w-[640px] text-[14.5px] leading-[1.55] text-ink-2">
        Estes são os logos que aparecem na página Parceiros do site, na ordem
        definida aqui. Enquanto você não adicionar nenhum, a página continua
        mostrando os espaços vazios de exemplo.
      </p>

      {/* Upload */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (!enviando) void enviarArquivos(e.dataTransfer.files);
        }}
        onClick={() => {
          if (!enviando) inputRef.current?.click();
        }}
        className={[
          "mb-6 cursor-pointer rounded-2xl border-2 border-dashed px-6 py-8 text-center transition-colors",
          dragOver
            ? "border-azul bg-azul/[.06]"
            : "border-black/[.14] bg-white hover:border-azul",
          enviando ? "pointer-events-none opacity-60" : "",
        ].join(" ")}
      >
        {enviando ? (
          <div role="status" aria-live="polite" className="py-1">
            <img
              src="/logo-cmu.png"
              alt=""
              className="mx-auto h-12 w-12 animate-logo-pulse object-contain"
            />
            <div className="mt-3 font-display text-[15px] font-extrabold text-ink">
              {progresso.total > 1
                ? `Enviando logo ${Math.min(progresso.feitas + 1, progresso.total)} de ${progresso.total}…`
                : "Enviando logo…"}
            </div>
            <div className="mt-1 text-[13px] text-ink-2">
              Isso pode levar alguns segundos. Não feche esta página.
            </div>
            <div className="mx-auto mt-3 h-1.5 w-full max-w-[280px] overflow-hidden rounded-full bg-black/[.08]">
              <div
                className="h-full rounded-full bg-azul transition-[width] duration-300"
                style={{
                  width: `${progresso.total ? (progresso.feitas / progresso.total) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        ) : (
          <>
            <div className="font-display text-[15px] font-extrabold text-ink">
              Arraste os logos para cá
            </div>
            <div className="mt-1 text-[13px] text-ink-2">
              PNG com fundo transparente fica melhor · até 2 MB cada · pode
              selecionar vários · a margem vazia é cortada automaticamente
            </div>
            <button
              type="button"
              onClick={(e) => {
                // O container também abre o seletor; sem isso abriria duas vezes.
                e.stopPropagation();
                inputRef.current?.click();
              }}
              className="mt-3.5 rounded-full bg-azul px-6 py-2.5 font-display text-[14px] font-extrabold text-white transition-colors hover:bg-azul-hover"
            >
              Selecionar arquivos
            </button>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) void enviarArquivos(e.target.files);
          }}
        />
      </div>

      {loading ? (
        <p className="text-ink-2">Carregando…</p>
      ) : parceiros.length === 0 && !enviando ? (
        <p className="text-ink-2">
          Você ainda não adicionou logos. A página Parceiros segue mostrando os
          espaços de exemplo.
        </p>
      ) : (
        <>
          {parceiros.length > 0 && (
            <p className="mb-3 text-[13.5px] font-bold text-ink-2">
              {parceiros.length}{" "}
              {parceiros.length === 1 ? "logo adicionado" : "logos adicionados"}{" "}
              · {ativos} aparecendo no site
            </p>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {parceiros.map((p, i) => {
              const busy = pending[p.id];
              return (
                <div
                  key={p.id}
                  className={[
                    "overflow-hidden rounded-2xl border border-black/[.06] bg-white shadow-sm transition-opacity",
                    busy ? "opacity-60" : "",
                    p.ativo ? "" : "opacity-70",
                  ].join(" ")}
                >
                  {/* Fundo claro e `contain`: logo não pode ser cortado nem
                      esticado, e muitos vêm com transparência. */}
                  <div className="relative flex h-[130px] items-center justify-center bg-subtle p-5">
                    <img
                      src={urlLogoParceiro(p)}
                      alt={p.nome}
                      className="max-h-full max-w-full object-contain"
                    />
                    <span className="absolute left-2 top-2 rounded-full bg-dark/80 px-2 py-[3px] text-[11px] font-bold text-white">
                      {i + 1}º
                    </span>
                    {!p.ativo && (
                      <span className="absolute right-2 top-2 rounded-full bg-ink-mid px-2.5 py-[3px] text-[11px] font-bold text-white">
                        Inativo
                      </span>
                    )}
                  </div>

                  <div className="space-y-2.5 p-3.5">
                    <input
                      type="text"
                      defaultValue={p.nome}
                      placeholder="Nome da instituição"
                      aria-label="Nome da instituição"
                      onBlur={(e) => void salvarNome(p, e.target.value)}
                      className="w-full rounded-lg border-[1.5px] border-black/[.12] bg-white px-3 py-2 text-[13px] text-ink outline-none transition-colors placeholder:text-ink-2/70 focus:border-azul"
                    />
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        disabled={busy || i === 0}
                        onClick={() => void mover(p, -1)}
                        aria-label="Mover para trás"
                        className="rounded-lg bg-subtle px-2.5 py-1.5 text-[13px] font-bold text-ink-mid transition-colors hover:bg-azul/[.1] hover:text-azul disabled:opacity-40"
                      >
                        ←
                      </button>
                      <button
                        type="button"
                        disabled={busy || i === parceiros.length - 1}
                        onClick={() => void mover(p, 1)}
                        aria-label="Mover para frente"
                        className="rounded-lg bg-subtle px-2.5 py-1.5 text-[13px] font-bold text-ink-mid transition-colors hover:bg-azul/[.1] hover:text-azul disabled:opacity-40"
                      >
                        →
                      </button>
                      <button
                        type="button"
                        disabled={busy || ehSvg({ name: p.storage_path })}
                        onClick={() => setRecortando(p)}
                        title={
                          ehSvg({ name: p.storage_path })
                            ? "SVG é vetor: escala sem perder nitidez e não precisa de recorte."
                            : undefined
                        }
                        className="rounded-lg px-2.5 py-1.5 text-[13px] font-bold text-ink-mid transition-colors hover:bg-azul/[.1] hover:text-azul disabled:opacity-40"
                      >
                        Recortar
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void toggleAtivo(p)}
                        aria-pressed={p.ativo}
                        className="rounded-lg px-2.5 py-1.5 text-[13px] font-bold text-azul transition-colors hover:bg-azul/[.1] disabled:opacity-40"
                      >
                        {p.ativo ? "Desativar" : "Ativar"}
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setConfirmarRemocao(p)}
                        className="ml-auto rounded-lg px-2.5 py-1.5 text-[13px] font-bold text-vermelho transition-colors hover:bg-vermelho/[.1] disabled:opacity-40"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Espaços dos logos que ainda estão subindo. */}
            {enviando &&
              Array.from({
                length: Math.max(progresso.total - progresso.feitas, 0),
              }).map((_, i) => (
                <div
                  key={`enviando-${i}`}
                  className="overflow-hidden rounded-2xl border border-black/[.06] bg-white shadow-sm"
                >
                  <div className="flex h-[130px] animate-pulse items-center justify-center bg-subtle">
                    <img
                      src="/logo-cmu.png"
                      alt=""
                      className="h-10 w-10 animate-logo-pulse object-contain opacity-70"
                    />
                  </div>
                  <div className="space-y-2.5 p-3.5">
                    <div className="h-8 animate-pulse rounded-lg bg-black/[.06]" />
                    <div className="h-7 w-2/3 animate-pulse rounded-lg bg-black/[.06]" />
                  </div>
                </div>
              ))}
          </div>
        </>
      )}

      <RecorteImagem
        open={Boolean(recortando)}
        src={recortando ? urlLogoParceiro(recortando) : null}
        nome={recortando?.nome ?? ""}
        onClose={() => setRecortando(null)}
        onAplicar={(img, area) =>
          recortando ? aplicarRecorte(recortando, img, area) : undefined
        }
      />

      <ConfirmDialog
        open={Boolean(confirmarRemocao)}
        titulo="Remover este logo?"
        descricao={
          confirmarRemocao
            ? `"${confirmarRemocao.nome}" sai da página Parceiros e o arquivo é apagado. Não dá para desfazer. Para tirar do site sem apagar, use Desativar.`
            : undefined
        }
        onConfirm={() => confirmarRemocao && void remover(confirmarRemocao)}
        onClose={() => setConfirmarRemocao(null)}
      />
    </div>
  );
}
