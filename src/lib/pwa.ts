/**
 * Registro do service worker do painel.
 *
 * Só no painel e só em produção, por dois motivos diferentes:
 *
 * - **Só no painel** porque o service worker mora em `/admin/sw.js` e o
 *   navegador limita o alcance dele ao próprio diretório. Registrar a
 *   partir do site público não funcionaria, e não deve funcionar: o site
 *   não é para ser instalado.
 *
 * - **Só em produção** porque service worker guardando arquivo em
 *   desenvolvimento é a maior fonte de "mas eu já salvei isso" que
 *   existe. O `npm run dev` continua sem nenhum — e sem o `dist/admin/`,
 *   que só existe depois do build.
 */

const CAMINHO = "/admin/sw.js";
const ESCOPO = "/admin/";

export function registrarServiceWorker(): void {
  if (!import.meta.env.PROD) return;
  if (!("serviceWorker" in navigator)) return;
  if (!window.location.pathname.startsWith("/admin")) return;

  // Depois do load: o registro concorreria com o primeiro carregamento da
  // tela, e ele não tem pressa nenhuma.
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register(CAMINHO, { scope: ESCOPO }).catch(() => {
      // Falhar aqui não pode atrapalhar quem só quer usar o painel: sem
      // service worker, ele funciona igual — só não instala.
    });
  });
}

/** true quando o painel está aberto como aplicativo, e não numa aba. */
export const estaInstalado = (): boolean =>
  window.matchMedia("(display-mode: standalone)").matches ||
  // O Safari do iPhone não implementa display-mode; usa esta propriedade.
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

/** iPhone e iPad, que não têm o diálogo de instalação do Chrome. */
export const eIOS = (): boolean =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  // iPad com iPadOS se apresenta como Mac; o toque é o que o denuncia.
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

/**
 * O evento que o Chrome dispara quando o site pode ser instalado.
 * Não está no lib.dom padrão porque a especificação ainda é um rascunho.
 */
export interface EventoDeInstalacao extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
