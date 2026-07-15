// Placeholders — o cliente substituirá pelos logos reais dos parceiros.
const SLOTS = Array.from({ length: 8 }, () => "logo do parceiro");

export default function Parceiros() {
  return (
    <div className="mx-auto max-w-container px-6 pb-20 pt-14">
      <h1 className="mb-3 font-display text-[42px] font-black">Parceiros</h1>
      <p className="m-0 mb-10 max-w-[600px] text-[17px] leading-[1.6] text-ink-2">
        Nada disso seria possível sem quem caminha conosco. Conheça as
        instituições que apoiam nosso trabalho.
      </p>
      <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4">
        {SLOTS.map((p, i) => (
          <div
            key={i}
            className="flex h-[120px] flex-col items-center justify-center gap-2 rounded-2xl border border-black/[.07] bg-white"
          >
            <div className="h-11 w-11 rounded-[10px] bg-[repeating-linear-gradient(45deg,#f0ede8,#f0ede8_6px,#faf8f5_6px,#faf8f5_12px)]" />
            <div className="font-mono text-[11px] text-ink-3">{p}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
