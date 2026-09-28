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
/** SPA não navega: sem isso o Chrome pode levar até 24h para achar o sw.js novo. */
const MS_CHECAGEM = 5 * 60 * 1000;

export function registrarServiceWorker(): void {
  if (!podeRegistrar()) return;

  // Depois do load: o registro concorreria com o primeiro carregamento da
  // tela, e ele não tem pressa nenhuma.
  window.addEventListener("load", () => {
    void garantirRegistro();
  });
}

function podeRegistrar(): boolean {
  return (
    import.meta.env.PROD &&
    "serviceWorker" in navigator &&
    window.location.pathname.startsWith("/admin")
  );
}

let registroEmCurso: Promise<ServiceWorkerRegistration | null> | null = null;

function garantirRegistro(): Promise<ServiceWorkerRegistration | null> {
  if (!podeRegistrar()) return Promise.resolve(null);
  if (!registroEmCurso) {
    registroEmCurso = navigator.serviceWorker
      .register(CAMINHO, { scope: ESCOPO })
      .then((registration) => {
        acompanhar(registration);
        agendarChecagens(registration);
        return registration;
      })
      .catch(() => {
        registroEmCurso = null;
        // Falhar aqui não pode atrapalhar quem só quer usar o painel: sem
        // service worker, ele funciona igual — só não instala.
        return null;
      });
  }
  return registroEmCurso;
}

let acompanhando: ServiceWorkerRegistration | null = null;

function acompanhar(registration: ServiceWorkerRegistration): void {
  if (acompanhando === registration) {
    sinalizarSeHouver(registration);
    return;
  }
  acompanhando = registration;

  const ouvirInstalacao = (worker: ServiceWorker) => {
    worker.addEventListener("statechange", () => {
      if (worker.state === "installed") sinalizarSeHouver(registration);
    });
  };

  registration.addEventListener("updatefound", () => {
    const installing = registration.installing;
    if (installing) ouvirInstalacao(installing);
  });
  if (registration.installing) ouvirInstalacao(registration.installing);

  sinalizarSeHouver(registration);
}

let checagensLigadas = false;

function agendarChecagens(registration: ServiceWorkerRegistration): void {
  if (checagensLigadas) return;
  checagensLigadas = true;

  const checar = () => {
    void registration.update();
  };
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") checar();
  });
  window.setInterval(checar, MS_CHECAGEM);
}

type AplicarAtualizacao = () => void;
type Ouvidor = (aplicar: AplicarAtualizacao) => void;

const ouvidores = new Set<Ouvidor>();
let aplicar: AplicarAtualizacao | null = null;
let recarregando = false;

/**
 * Avisa quando há um service worker novo em espera. Só dispara se a aba
 * já tem um controller — a primeira instalação do PWA não é "versão nova".
 *
 * A função entregue recarrega o painel depois de pedir skipWaiting. Quem
 * já está no deploy atual nunca entra aqui: não há worker esperando.
 */
export function observarAtualizacao(aoDisponivel: Ouvidor): () => void {
  ouvidores.add(aoDisponivel);
  if (aplicar) aoDisponivel(aplicar);
  void garantirRegistro();
  return () => {
    ouvidores.delete(aoDisponivel);
  };
}

function sinalizarSeHouver(registration: ServiceWorkerRegistration): void {
  const worker = registration.waiting;
  // Sem controller é a primeira instalação, não uma atualização.
  if (!worker || !navigator.serviceWorker.controller) return;
  aplicar = () => aplicarAtualizacao(worker);
  for (const ouvidor of ouvidores) ouvidor(aplicar);
}

function aplicarAtualizacao(worker: ServiceWorker): void {
  if (recarregando) return;
  recarregando = true;

  const recarregar = () => {
    window.location.reload();
  };

  navigator.serviceWorker.addEventListener("controllerchange", recarregar);

  if (worker.state === "redundant") {
    recarregar();
    return;
  }
  worker.postMessage({ type: "SKIP_WAITING" });
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
