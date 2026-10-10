import { useEffect, useRef } from "react";

const VIDEO_ID = "kbggerBQyW8";
const YT_ORIGEM = "https://www.youtube-nocookie.com";

const SRC =
  `${YT_ORIGEM}/embed/${VIDEO_ID}?autoplay=1&mute=1&loop=1&playlist=${VIDEO_ID}` +
  `&playsinline=1&rel=0&iv_load_policy=3&cc_load_policy=0&hl=pt&enablejsapi=1`;

/**
 * Vídeo institucional do YouTube: toca sozinho (mudo), em loop, com os
 * controles e o link do YouTube. O loop do player exige `playlist` com o mesmo
 * id.
 *
 * As legendas já estão gravadas no vídeo, mas o YouTube ainda sobrepõe a faixa
 * de legenda dele quando o espectador tem "sempre mostrar legendas" ligado;
 * `cc_load_policy=0` não vence essa preferência. Por isso, assim que o player
 * avisa que está pronto, descarregamos o módulo de legendas pela API.
 */
export default function VideoInstitucional() {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    function enviar(msg: object) {
      iframeRef.current?.contentWindow?.postMessage(JSON.stringify(msg), YT_ORIGEM);
    }
    function desligarLegendas() {
      enviar({ event: "command", func: "unloadModule", args: ["captions"] });
      enviar({ event: "command", func: "unloadModule", args: ["cc"] });
      enviar({ event: "command", func: "setOption", args: ["captions", "track", {}] });
    }
    function aoReceber(e: MessageEvent) {
      if (e.origin !== YT_ORIGEM || typeof e.data !== "string") return;
      try {
        const msg = JSON.parse(e.data);
        // `onReady` chega uma vez; o `infoDelivery` repete o comando caso o
        // módulo de legendas só tenha subido depois.
        if (msg?.event === "onReady" || msg?.event === "initialDelivery") desligarLegendas();
        if (msg?.event === "infoDelivery" && msg?.info?.playerState === 1) desligarLegendas();
      } catch {
        /* mensagem que não é JSON: ignora */
      }
    }
    window.addEventListener("message", aoReceber);
    return () => window.removeEventListener("message", aoReceber);
  }, []);

  function aoCarregar() {
    // Sem isso o player não envia eventos de volta.
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: "listening", id: 1 }),
      YT_ORIGEM,
    );
  }

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-3xl bg-ink shadow-card-hover">
      <iframe
        ref={iframeRef}
        className="absolute inset-0 h-full w-full"
        src={SRC}
        title="Vídeo institucional do Clube das Mães Unidas"
        allow="autoplay; encrypted-media; picture-in-picture; clipboard-write"
        allowFullScreen
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        onLoad={aoCarregar}
      />
    </div>
  );
}
