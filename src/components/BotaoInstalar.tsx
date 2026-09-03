import { useEffect, useState } from "react";
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

  useEffect(() => {
    const guardar = (e: Event) => {
      // Sem o preventDefault o Chrome mostra a própria barra de instalação
      // por cima da tela; queremos o convite no lugar que escolhemos.
      e.preventDefault();
      setEvento(e as EventoDeInstalacao);
    };

    const aoInstalar = () => {
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

  useEffect(() => {
    if (!podeInstalar) return;
    if (sessionStorage.getItem(CHAVE_AVISO)) return;

    const id = setTimeout(() => {
      sessionStorage.setItem(CHAVE_AVISO, "1");
      toast(
        "Dá para instalar o painel no aparelho e abrir sem o navegador. O atalho fica no fim do menu."
      );
    }, MS_ATE_O_AVISO);

    return () => clearTimeout(id);
  }, [podeInstalar, toast]);

  const instalar = async () => {
    if (!evento) return;

    await evento.prompt();
    const { outcome } = await evento.userChoice;

    // O evento só serve uma vez. Recusando, o Chrome dispara outro mais
    // tarde; por isso é só descartar, e não esconder o botão para sempre.
    setEvento(null);
    if (outcome === "accepted") setInstalado(true);
  };

  if (!podeInstalar) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          aoNavegar?.();
          if (noIphone && !evento) setAjudaAberta(true);
          else void instalar();
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
