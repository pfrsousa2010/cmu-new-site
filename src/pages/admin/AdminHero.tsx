import { useEffect, useRef, useState } from "react";
import { useToast } from "@/components/Toast";
import ConfirmDialog from "@/components/ConfirmDialog";
import {
  fetchHeroImagensAdmin,
  adicionarHeroImagem,
  removerHeroImagem,
  setHeroPublicado,
  setHeroLegenda,
  trocarOrdemHero,
  proximaOrdem,
  validarImagemHero,
  urlHero,
  type HeroImagem,
} from "@/lib/hero";

export default function AdminHero() {
  const { toast } = useToast();
  const [imagens, setImagens] = useState<HeroImagem[]>([]);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [progresso, setProgresso] = useState({ feitas: 0, total: 0 });
  const [pending, setPending] = useState<Record<string, boolean>>({});
  const [dragOver, setDragOver] = useState(false);
  const [confirmarRemocao, setConfirmarRemocao] = useState<HeroImagem | null>(
    null
  );
  const inputRef = useRef<HTMLInputElement>(null);

  const recarregar = async () => {
    const data = await fetchHeroImagensAdmin();
    setImagens(data);
    return data;
  };

  useEffect(() => {
    let ativo = true;
    fetchHeroImagensAdmin().then((data) => {
      if (!ativo) return;
      setImagens(data);
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
      const erro = validarImagemHero(file);
      if (erro) toast(`${file.name}: ${erro}`);
      else validos.push(file);
    }
    if (validos.length === 0) return;

    setEnviando(true);
    setProgresso({ feitas: 0, total: validos.length });
    let ordem = proximaOrdem(imagens);
    let enviadas = 0;
    try {
      for (const file of validos) {
        await adicionarHeroImagem(file, ordem);
        ordem += 1;
        enviadas += 1;
        setProgresso({ feitas: enviadas, total: validos.length });
      }
      toast(
        enviadas === 1 ? "Foto adicionada" : `${enviadas} fotos adicionadas`
      );
    } catch (err) {
      toast("Não foi possível enviar a foto. Tente novamente.");
      console.error(err);
    } finally {
      await recarregar();
      setEnviando(false);
      setProgresso({ feitas: 0, total: 0 });
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remover = async (img: HeroImagem) => {
    setConfirmarRemocao(null);
    setPending((p) => ({ ...p, [img.id]: true }));
    try {
      await removerHeroImagem(img);
      setImagens((is) => is.filter((i) => i.id !== img.id));
      toast("Foto removida");
    } catch (err) {
      toast("Erro ao remover foto");
      console.error(err);
    } finally {
      setPending((p) => ({ ...p, [img.id]: false }));
    }
  };

  const togglePublicado = async (img: HeroImagem) => {
    const novo = !img.publicado;
    setPending((p) => ({ ...p, [img.id]: true }));
    setImagens((is) =>
      is.map((i) => (i.id === img.id ? { ...i, publicado: novo } : i))
    );
    try {
      await setHeroPublicado(img.id, novo);
      toast(novo ? "Foto publicada" : "Foto oculta do site");
    } catch (err) {
      setImagens((is) =>
        is.map((i) => (i.id === img.id ? { ...i, publicado: !novo } : i))
      );
      toast("Erro ao atualizar a foto");
      console.error(err);
    } finally {
      setPending((p) => ({ ...p, [img.id]: false }));
    }
  };

  const mover = async (img: HeroImagem, direcao: -1 | 1) => {
    const i = imagens.findIndex((x) => x.id === img.id);
    const vizinho = imagens[i + direcao];
    if (!vizinho) return;

    setPending((p) => ({ ...p, [img.id]: true, [vizinho.id]: true }));
    const anterior = imagens;
    const otimista = [...imagens];
    otimista[i] = vizinho;
    otimista[i + direcao] = img;
    setImagens(otimista);
    try {
      await trocarOrdemHero(img, vizinho);
    } catch (err) {
      setImagens(anterior);
      toast("Erro ao reordenar");
      console.error(err);
    } finally {
      setPending((p) => ({ ...p, [img.id]: false, [vizinho.id]: false }));
    }
  };

  const salvarLegenda = async (img: HeroImagem, legenda: string) => {
    if ((img.legenda ?? "") === legenda) return;
    setImagens((is) =>
      is.map((i) => (i.id === img.id ? { ...i, legenda } : i))
    );
    try {
      await setHeroLegenda(img.id, legenda);
    } catch (err) {
      toast("Erro ao salvar a descrição");
      console.error(err);
    }
  };

  const publicadas = imagens.filter((i) => i.publicado).length;

  return (
    <div>
      <h1 className="mb-1 font-display text-[28px] font-black">
        Fotos da página inicial
      </h1>
      <p className="m-0 mb-5 max-w-[640px] text-[14.5px] leading-[1.55] text-ink-2">
        Estas são as fotos que passam no topo da página inicial do site, na
        ordem definida aqui. Enquanto você não publicar nenhuma, a página
        inicial continua mostrando as fotos que já estão no ar.
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
                ? `Enviando foto ${Math.min(progresso.feitas + 1, progresso.total)} de ${progresso.total}…`
                : "Enviando foto…"}
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
              Arraste as fotos para cá
            </div>
            <div className="mt-1 text-[13px] text-ink-2">
              JPG, PNG, WEBP ou AVIF · até 2 MB cada · pode selecionar várias
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
      ) : imagens.length === 0 && !enviando ? (
        <p className="text-ink-2">
          Você ainda não adicionou fotos. A página inicial segue mostrando as
          fotos que já estão no ar.
        </p>
      ) : (
        <>
          {imagens.length > 0 && (
            <p className="mb-3 text-[13.5px] font-bold text-ink-2">
              {imagens.length}{" "}
              {imagens.length === 1 ? "foto adicionada" : "fotos adicionadas"} ·{" "}
              {publicadas} aparecendo no site
            </p>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {imagens.map((img, i) => {
              const busy = pending[img.id];
              return (
                <div
                  key={img.id}
                  className={[
                    "overflow-hidden rounded-2xl border border-black/[.06] bg-white shadow-sm transition-opacity",
                    busy ? "opacity-60" : "",
                    img.publicado ? "" : "opacity-70",
                  ].join(" ")}
                >
                  <div className="relative h-[150px] bg-subtle">
                    <img
                      src={urlHero(img)}
                      alt={img.legenda ?? ""}
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute left-2 top-2 rounded-full bg-dark/80 px-2 py-[3px] text-[11px] font-bold text-white">
                      {i + 1}º
                    </span>
                    {!img.publicado && (
                      <span className="absolute right-2 top-2 rounded-full bg-ink-mid px-2.5 py-[3px] text-[11px] font-bold text-white">
                        Oculta
                      </span>
                    )}
                  </div>

                  <div className="space-y-2.5 p-3.5">
                    <input
                      type="text"
                      defaultValue={img.legenda ?? ""}
                      placeholder="Descreva a foto em poucas palavras"
                      onBlur={(e) => void salvarLegenda(img, e.target.value)}
                      className="w-full rounded-lg border-[1.5px] border-black/[.12] bg-white px-3 py-2 text-[13px] text-ink outline-none transition-colors placeholder:text-ink-2/70 focus:border-azul"
                    />
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        disabled={busy || i === 0}
                        onClick={() => void mover(img, -1)}
                        aria-label="Mover para trás"
                        className="rounded-lg bg-subtle px-2.5 py-1.5 text-[13px] font-bold text-ink-mid transition-colors hover:bg-azul/[.1] hover:text-azul disabled:opacity-40"
                      >
                        ←
                      </button>
                      <button
                        type="button"
                        disabled={busy || i === imagens.length - 1}
                        onClick={() => void mover(img, 1)}
                        aria-label="Mover para frente"
                        className="rounded-lg bg-subtle px-2.5 py-1.5 text-[13px] font-bold text-ink-mid transition-colors hover:bg-azul/[.1] hover:text-azul disabled:opacity-40"
                      >
                        →
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void togglePublicado(img)}
                        className="rounded-lg px-2.5 py-1.5 text-[13px] font-bold text-azul transition-colors hover:bg-azul/[.1] disabled:opacity-40"
                      >
                        {img.publicado ? "Ocultar" : "Publicar"}
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setConfirmarRemocao(img)}
                        className="ml-auto rounded-lg px-2.5 py-1.5 text-[13px] font-bold text-vermelho transition-colors hover:bg-vermelho/[.1] disabled:opacity-40"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Espaços das fotos que ainda estão subindo. */}
            {enviando &&
              Array.from({
                length: Math.max(progresso.total - progresso.feitas, 0),
              }).map((_, i) => (
                <div
                  key={`enviando-${i}`}
                  className="overflow-hidden rounded-2xl border border-black/[.06] bg-white shadow-sm"
                >
                  <div className="flex h-[150px] animate-pulse items-center justify-center bg-subtle">
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

      <ConfirmDialog
        open={Boolean(confirmarRemocao)}
        titulo="Remover esta foto?"
        descricao="Ela deixa de aparecer na página inicial do site. Não dá para desfazer."
        onConfirm={() => confirmarRemocao && void remover(confirmarRemocao)}
        onClose={() => setConfirmarRemocao(null)}
      />
    </div>
  );
}
