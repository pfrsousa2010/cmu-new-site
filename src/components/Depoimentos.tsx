import { useEffect, useState } from "react";
import Modal from "@/components/Modal";
import {
  fetchDepoimentos,
  urlMidia,
  urlPoster,
  type Depoimento,
} from "@/lib/depoimentos";

/** Tempo entre um depoimento e o próximo, quando ninguém está interagindo. */
const INTERVALO_MS = 8000;

/**
 * Carrossel de depoimentos da Home, alimentado pelo painel.
 *
 * A seção inteira não é renderizada quando não há nenhum ativo — por isso o
 * componente devolve a `<section>` própria, e não só o miolo.
 */
export default function Depoimentos() {
  const [lista, setLista] = useState<Depoimento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [index, setIndex] = useState(0);
  const [pausado, setPausado] = useState(false);
  /** Depoimento em vídeo aberto na modal; null = ninguém assistindo. */
  const [assistindo, setAssistindo] = useState<Depoimento | null>(null);

  useEffect(() => {
    let ativo = true;
    fetchDepoimentos().then((data) => {
      if (!ativo) return;
      setLista(data);
      setCarregando(false);
    });
    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => {
    if (pausado || assistindo || lista.length <= 1) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % lista.length);
    }, INTERVALO_MS);
    return () => window.clearInterval(id);
  }, [pausado, assistindo, lista.length]);

  if (carregando || lista.length === 0) return null;

  const atual = lista[Math.min(index, lista.length - 1)];
  const poster = urlPoster(atual);

  return (
    <section
      className="border-t border-black/[.06] bg-white"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
    >
      <div className="mx-auto max-w-container px-6 py-16">
        <h2 className="mb-3 font-display text-[32px] font-black">Depoimentos</h2>
        <p className="m-0 mb-8 max-w-[520px] text-[16px] leading-[1.6] text-ink-2">
          Histórias de quem transformou a própria vida com os cursos do Clube das
          Mães Unidas.
        </p>

        <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-[280px_1fr] md:items-center">
          <div className="mx-auto w-full max-w-[280px]">
            {atual.midia_tipo === "video" ? (
              // Capa clicável em vez do player embutido: no tamanho da coluna o
              // vídeo fica pequeno demais para assistir. Retângulo, e não
              // círculo, para não recortar o que está sendo mostrado.
              <button
                type="button"
                onClick={() => setAssistindo(atual)}
                aria-label={`Assistir ao depoimento de ${atual.nome}`}
                className="group relative block w-full overflow-hidden rounded-2xl bg-dark"
              >
                {poster ? (
                  <img
                    src={poster}
                    alt=""
                    className="w-full transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="aspect-video w-full" />
                )}
                <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-dark/45 transition-colors group-hover:bg-dark/55">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/95 pl-1 text-[22px] text-ink shadow-[0_4px_14px_rgba(0,0,0,.3)]">
                    ▶
                  </span>
                  <span className="font-display text-[13.5px] font-extrabold text-white">
                    Clique para assistir
                  </span>
                </span>
              </button>
            ) : (
              <div className="relative mx-auto aspect-square w-full max-w-[240px] overflow-hidden rounded-full">
                {lista
                  .filter((d) => d.midia_tipo === "foto")
                  .map((d) => (
                    <img
                      key={d.id}
                      src={urlMidia(d)}
                      alt={d.nome}
                      className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-out ${
                        d.id === atual.id ? "opacity-100" : "opacity-0"
                      }`}
                    />
                  ))}
              </div>
            )}
          </div>

          <div>
            <blockquote className="m-0 text-[16.5px] leading-[1.7] text-ink-2 [text-wrap:pretty]">
              “{atual.texto}”
            </blockquote>
            <cite className="mt-5 block font-display text-[18px] font-extrabold not-italic text-ink">
              {atual.nome}
            </cite>
          </div>
        </div>

        {lista.length > 1 && (
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
            {lista.map((d, i) => {
              const capa = urlPoster(d);
              return (
                <button
                  key={d.id}
                  type="button"
                  aria-label={`Depoimento de ${d.nome}`}
                  aria-current={i === index}
                  onClick={() => setIndex(i)}
                  className={`relative overflow-hidden rounded-full bg-subtle transition-all duration-300 ${
                    i === index
                      ? "h-12 w-12 ring-2 ring-azul ring-offset-2"
                      : "h-10 w-10 opacity-55 hover:opacity-90"
                  }`}
                >
                  {capa ? (
                    <img src={capa} alt="" className="h-full w-full object-cover" />
                  ) : (
                    // Vídeo sem capa: o navegador não conseguiu extrair o quadro.
                    <span className="flex h-full w-full items-center justify-center text-[13px] text-ink-mid">
                      ▶
                    </span>
                  )}
                  {d.midia_tipo === "video" && capa && (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/30 text-[11px] text-white">
                      ▶
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <Modal
        open={Boolean(assistindo)}
        onClose={() => setAssistindo(null)}
        width={880}
        className="overflow-hidden p-0"
      >
        {assistindo && (
          <>
            <video
              // key: sem ela o React reaproveita o elemento e o vídeo anterior
              // continua carregado ao abrir outro depoimento.
              key={assistindo.id}
              src={urlMidia(assistindo)}
              poster={urlPoster(assistindo) ?? undefined}
              controls
              autoPlay
              playsInline
              // Só play/pause, volume e a linha do tempo. `nodownload` e
              // `noplaybackrate` esvaziam o menu de três pontos (download,
              // velocidade, transmitir) e o navegador esconde o menu sozinho
              // quando não sobra nada nele; `disablePictureInPicture` fecha a
              // última porta de saída do vídeo da modal.
              controlsList="nofullscreen nodownload noplaybackrate noremoteplayback"
              disablePictureInPicture
              // O Chrome mobile ignora o `nofullscreen` do controlsList — lá o
              // botão de tela cheia só sai escondendo o pseudo-elemento do
              // player. Os dois juntos cobrem desktop e celular.
              className="max-h-[70vh] w-full bg-dark [&::-webkit-media-controls-fullscreen-button]:hidden [&::-webkit-media-controls-overflow-button]:hidden"
            />
            <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
              <span className="font-display text-[17px] font-extrabold text-ink">
                {assistindo.nome}
              </span>
              <button
                type="button"
                onClick={() => setAssistindo(null)}
                className="rounded-full border-[1.5px] border-black/[.12] bg-white px-5 py-2.5 font-display text-[13.5px] font-extrabold text-ink transition-colors hover:border-azul hover:text-azul"
              >
                Fechar
              </button>
            </div>
          </>
        )}
      </Modal>
    </section>
  );
}
