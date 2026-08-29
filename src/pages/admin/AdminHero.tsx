import { useEffect, useRef, useState } from "react";
import { useToast } from "@/components/Toast";
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
  HERO_FALLBACK,
  type HeroImagem,
} from "@/lib/hero";

export default function AdminHero() {
  const { toast } = useToast();
  const [imagens, setImagens] = useState<HeroImagem[]>([]);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [pending, setPending] = useState<Record<string, boolean>>({});
  const [dragOver, setDragOver] = useState(false);
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
    let ordem = proximaOrdem(imagens);
    let enviadas = 0;
    try {
      for (const file of validos) {
        await adicionarHeroImagem(file, ordem);
        ordem += 1;
        enviadas += 1;
      }
      toast(
        enviadas === 1 ? "Foto adicionada" : `${enviadas} fotos adicionadas`
      );
    } catch (err) {
      toast("Erro ao enviar foto (a tabela site_hero_imagens existe?)");
      console.error(err);
    } finally {
      await recarregar();
      setEnviando(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remover = async (img: HeroImagem) => {
    if (!window.confirm("Remover esta foto do carrossel da Home?")) return;
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
        Carrossel da Home
      </h1>
      <p className="m-0 mb-5 max-w-[640px] text-[14.5px] leading-[1.55] text-ink-2">
        As fotos aparecem no topo da página inicial, na ordem definida aqui.
        Enquanto nenhuma foto estiver publicada, o site usa as{" "}
        {HERO_FALLBACK.length} imagens originais do projeto.
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
        <div className="font-display text-[15px] font-extrabold text-ink">
          {enviando ? "Enviando…" : "Arraste fotos aqui ou clique para escolher"}
        </div>
        <div className="mt-1 text-[13px] text-ink-2">
          JPG, PNG, WEBP ou AVIF · até 2 MB cada · pode selecionar várias
        </div>
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
      ) : imagens.length === 0 ? (
        <p className="text-ink-2">
          Nenhuma foto no banco ainda — a Home está exibindo as imagens
          originais.
        </p>
      ) : (
        <>
          <p className="mb-3 text-[13.5px] font-bold text-ink-2">
            {imagens.length}{" "}
            {imagens.length === 1 ? "foto cadastrada" : "fotos cadastradas"} ·{" "}
            {publicadas} no ar
          </p>
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
                      placeholder="Descrição da foto (acessibilidade)"
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
                        onClick={() => void remover(img)}
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
    </div>
  );
}
