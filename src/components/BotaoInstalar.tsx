import { useCallback, useEffect, useRef, useState } from "react";
import Modal from "@/components/Modal";
import { useToast } from "@/components/Toast";
import { eIOS, estaInstalado, type EventoDeInstalacao } from "@/lib/pwa";

/**
 * Marca de que o aviso já apareceu. Em `sessionStorage`, e não em
 * `localStorage`: uma vez por visita é lembrete, toda vez é praga, e
 * "nunca mais" faz quem ignorou o aviso no dia corrido nunca mais
 * descobrir que dá para instalar.
 */
const CHAVE_AVISO = "cmu-admin:aviso-instalar";

/** Espera o painel terminar de pintar antes de avisar. */
const MS_ATE_O_AVISO = 1500;

/**
 * "aparelho", e não "celular": o painel também é usado no computador, e é
 * lá que o Chrome mais oferece a instalação. É a mesma palavra do botão.
 */
const AVISO = "Clique aqui para instalar o painel admin no seu aparelho.";

/**
 * "Instalar no aparelho", no rodapé da barra do painel.
 *
 * Dois caminhos, porque os sistemas não oferecem o mesmo:
 *
 * - Android, Chrome e Edge disparam `beforeinstallprompt` e aceitam abrir
 *   o diálogo nativo. É um clique.
 * - iPhone e iPad não têm esse diálogo. Instalar lá é pelo menu
 *   Compartilhar, e a única coisa útil a fazer é ensinar o caminho.
 *
 * Já instalado, ou num navegador que não instala, o botão não aparece —
 * oferecer o que não vai funcionar é pior do que não oferecer.
 *
 * O aviso de que dá para instalar sai daqui, e não do AdminLayout, porque
 * é aqui que se sabe se a instalação é possível: só depois do
 * `beforeinstallprompt` (ou num iPhone) existe o que anunciar. Como o
 * componente só é montado pelo AdminLayout, o aviso também não tem como
 * escapar para o site.
 */
export default function BotaoInstalar({ aoNavegar }: { aoNavegar?: () => void }) {
  const { toast } = useToast();
  const [evento, setEvento] = useState<EventoDeInstalacao | null>(null);
  const [instalado, setInstalado] = useState(() => estaInstalado());
  const [ajudaAberta, setAjudaAberta] = useState(false);
  const noIphone = eIOS();
  // Espelho do `evento` para quem age depois do render que o recebeu —
  // ver `acionar`. O estado continua existindo porque é ele que decide se
  // o botão aparece.
  const eventoRef = useRef<EventoDeInstalacao | null>(null);

  useEffect(() => {
    const guardar = (e: Event) => {
      // Sem o preventDefault o Chrome mostra a própria barra de instalação
      // por cima da tela; queremos o convite no lugar que escolhemos.
      e.preventDefault();
      eventoRef.current = e as EventoDeInstalacao;
      setEvento(e as EventoDeInstalacao);
    };

    const aoInstalar = () => {
      eventoRef.current = null;
      setInstalado(true);
      setEvento(null);
    };

    window.addEventListener("beforeinstallprompt", guardar);
    window.addEventListener("appinstalled", aoInstalar);

    return () => {
      window.removeEventListener("beforeinstallprompt", guardar);
      window.removeEventListener("appinstalled", aoInstalar);
    };
  }, []);

  const podeInstalar = !instalado && (!!evento || noIphone);

  /**
   * O que instalar significa aqui: o diálogo do Chrome, ou o passo a passo
   * do iPhone. Serve ao botão e ao aviso, que fazem a mesma coisa.
   *
   * Lê o convite da ref, e não do estado, porque o aviso fica na tela por
   * segundos: o `evento` do render em que ele foi agendado pode já ter sido
   * gasto quando alguém finalmente toca, e `prompt()` num convite usado
   * rejeita.
   */
  const acionar = useCallback(async () => {
    const convite = eventoRef.current;

    // Sem convite só há o que fazer no iPhone. Fora dele, isso é o aviso
    // ainda na tela depois de a instalação já ter sido aceita — não abre
    // um passo a passo que não serve para aquele navegador.
    if (!convite) {
      if (noIphone) setAjudaAberta(true);
      return;
    }

    await convite.prompt();
    const { outcome } = await convite.userChoice;

    // O convite só serve uma vez. Recusando, o Chrome dispara outro mais
    // tarde; por isso é só descartar, e não esconder o botão para sempre.
    eventoRef.current = null;
    setEvento(null);
    if (outcome === "accepted") setInstalado(true);
  }, [noIphone]);

  useEffect(() => {
    if (!podeInstalar) return;
    if (sessionStorage.getItem(CHAVE_AVISO)) return;

    const id = setTimeout(() => {
      sessionStorage.setItem(CHAVE_AVISO, "1");
      // O aviso instala por conta própria: mandar procurar o atalho no menu
      // é pedir para quem já está com o dedo na tela fazer mais um passo.
      toast(AVISO, () => void acionar());
    }, MS_ATE_O_AVISO);

    return () => clearTimeout(id);
  }, [podeInstalar, acionar, toast]);

  if (!podeInstalar) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          aoNavegar?.();
          void acionar();
        }}
        className="flex w-full items-center gap-[11px] rounded-[11px] px-3.5 py-[11px] text-left text-sm font-semibold text-white/65 transition-colors hover:bg-white/[.08]"
      >
        <span aria-hidden="true" className="text-base">
          ⤓
        </span>
        Instalar no aparelho
      </button>

      <Modal open={ajudaAberta} onClose={() => setAjudaAberta(false)} width={440}>
        <h2 className="mb-[18px] font-display text-[22px] font-black">
          Instalar no iPhone
        </h2>
        <div className="grid gap-3 text-[15px] leading-snug text-ink-mid">
          <p className="m-0">
            O iPhone não tem botão de instalar — quem faz isso é o próprio Safari:
          </p>
          <ol className="m-0 grid list-decimal gap-1.5 pl-5">
            <li>
              Toque em <strong className="font-bold text-ink">Compartilhar</strong>, o
              quadrado com a seta para cima, na barra de baixo.
            </li>
            <li>
              Role a lista e escolha{" "}
              <strong className="font-bold text-ink">Adicionar à Tela de Início</strong>.
            </li>
            <li>
              Confirme em <strong className="font-bold text-ink">Adicionar</strong>.
            </li>
          </ol>
          <p className="m-0 text-ink-2">
            O painel passa a ter ícone próprio e abre sem a barra de endereço. Precisa
            ser pelo Safari: no Chrome do iPhone essa opção não existe.
          </p>
        </div>
      </Modal>
    </>
  );
}
