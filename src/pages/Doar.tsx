// Dados bancários e PIX são PLACEHOLDERS — o cliente substituirá pelos reais.
const BANCO = [
  ["Banco", "Caixa Econômica Federal"],
  ["Agência", "0000"],
  ["Conta", "00000-0"],
  ["Titular", "Clube das Mães Unidas"],
];

export default function Doar() {
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
            <div className="mt-1 font-mono text-base font-bold">
              00.000.000/0001-00
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
          <div className="mt-[18px] text-[13px] leading-[1.5] text-ink-2">
            Após doar, envie o comprovante pelo WhatsApp{" "}
            <b>(43) 3325-6488</b> para receber nosso agradecimento.
          </div>
        </div>
      </div>
    </div>
  );
}
