import { SOBRE_IMG } from "@/lib/refImages";

const CARDS = [
  {
    border: "border-l-verde",
    titulo: "Missão",
    texto:
      "Contribuir para a construção de uma sociedade melhor através de serviços que minimizem as vulnerabilidades sociais e proporcionem protagonismo, crescimento pessoal e social.",
  },
  {
    border: "border-l-azul",
    titulo: "Visão",
    texto:
      "Ser referência em capacitação profissional e inclusão produtiva na região de Londrina.",
  },
  {
    border: "border-l-laranja",
    titulo: "Valores",
    texto:
      "Acolhimento, respeito, ética, transparência e compromisso com a comunidade.",
  },
];

export default function Sobre() {
  return (
    <div className="mx-auto max-w-container px-6 pb-20 pt-14">
      <h1 className="mb-3 font-display text-[42px] font-black">Sobre nós</h1>
      <p className="m-0 mb-10 max-w-[640px] text-[17px] leading-[1.65] text-ink-2 [text-wrap:pretty]">
        Há mais de três décadas em Londrina-PR, o Clube das Mães Unidas atua na
        capacitação de jovens e adultos para o mercado de trabalho e na promoção
        da inclusão social.
      </p>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <img
          src={SOBRE_IMG}
          alt="Nossa equipe"
          className="h-[320px] w-full rounded-[20px] object-cover"
        />
        <div className="grid gap-4">
          {CARDS.map((c) => (
            <div
              key={c.titulo}
              className={`rounded-2xl border-l-[5px] ${c.border} bg-white px-6 py-[22px]`}
            >
              <div className="mb-1 font-display text-[17px] font-extrabold">
                {c.titulo}
              </div>
              <div className="text-[14.5px] leading-[1.55] text-ink-2">
                {c.texto}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
