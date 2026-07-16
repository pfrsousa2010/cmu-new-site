import { useState } from "react";

// Dados bancários e PIX são PLACEHOLDERS — o cliente substituirá pelos reais.
const CHAVE_PIX = "00.000.000/0001-00";

const BANCO = [
  ["Banco", "Caixa Econômica Federal"],
  ["Agência", "0000"],
  ["Conta", "00000-0"],
  ["Titular", "Clube das Mães Unidas"],
];

export default function Doar() {
  const [copiado, setCopiado] = useState(false);

  async function copiarCnpj() {
    try {
      await navigator.clipboard.writeText(CHAVE_PIX);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Fallback para ambientes sem clipboard API
      const el = document.createElement("textarea");
      el.value = CHAVE_PIX;
      el.setAttribute("readonly", "");
      el.style.position = "absolute";
      el.style.left = "-9999px";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2000);
    }
  }

  return (
    <div className="mx-auto max-w-[900px] px-6 pb-20 pt-14">
      <h1 className="mb-3 font-display text-[42px] font-black">
        Doe aqui <span className="text-laranja">♥</span>
      </h1>
      <p className="m-0 mb-10 max-w-[600px] text-[17px] leading-[1.6] text-ink-2">
        Sua doação mantém nossos cursos 100% gratuitos e transforma vidas em
        Londrina. Qualquer valor faz diferença.
      </p>

      <div className="grid grid-cols-1 gap-[22px] md:grid-cols-2">
        {/* PIX */}
        <div className="rounded-card border-t-[6px] border-t-verde bg-white p-[30px]">
          <div className="mb-4 font-display text-[22px] font-extrabold">PIX</div>
          <div className="mb-4 rounded-2xl bg-site-bg p-[18px] text-center">
            <div className="mx-auto mb-3 flex h-[140px] w-[140px] items-center justify-center rounded-xl bg-[repeating-linear-gradient(45deg,#e8e4dd,#e8e4dd_5px,#faf8f5_5px,#faf8f5_10px)] font-mono text-[11px] text-ink-3">
              QR code PIX
            </div>
            <div className="text-[13px] text-ink-2">Chave PIX (CNPJ)</div>
            <div className="mt-1 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
              <div className="font-mono text-base font-bold">{CHAVE_PIX}</div>
              <button
                type="button"
                onClick={copiarCnpj}
                className="rounded-lg border border-black/[.1] bg-white px-2.5 py-1 text-xs font-bold text-ink-mid transition-colors hover:border-verde hover:text-verde"
                aria-label={copiado ? "CNPJ copiado" : "Copiar CNPJ"}
              >
                {copiado ? "Copiado!" : "Copiar"}
              </button>
            </div>
          </div>
          <div className="text-center text-[13px] text-ink-2">
            Escaneie o QR code ou copie a chave
          </div>
        </div>

        {/* Transferência bancária */}
        <div className="rounded-card border-t-[6px] border-t-azul bg-white p-[30px]">
          <div className="mb-4 font-display text-[22px] font-extrabold">
            Transferência bancária
          </div>
          <div className="grid gap-3 text-[15px]">
            {BANCO.map(([label, valor]) => (
              <div
                key={label}
                className="flex justify-between rounded-[10px] bg-site-bg px-4 py-3"
              >
                <span className="text-ink-2">{label}</span>
                <b>{valor}</b>
              </div>
            ))}
          </div>
          <div className="mt-[18px] text-justify text-[13px] leading-[1.5] text-ink-2">
            Após doar, envie o comprovante pelo WhatsApp para receber nosso
            agradecimento:
            <a
              href="https://wa.me/554333256488?text=Ol%C3%A1!%20Acabei%20de%20fazer%20uma%20doa%C3%A7%C3%A3o%20pelo%20site%20e%20gostaria%20de%20enviar%20o%20comprovante."
              target="_blank"
              rel="noreferrer"
              className="mt-3 flex items-center justify-center gap-2 rounded-[10px] bg-verde/[.12] px-4 py-3 text-center font-bold text-verde transition-colors hover:bg-verde/[.18] hover:text-verde-dark"
            >
              (43) 3325-6488
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="h-[18px] w-[18px] fill-current"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
