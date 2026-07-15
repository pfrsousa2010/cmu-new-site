const SEDE_IMG =
  "/sede/e7e902_a2a7c003db3c4c45aeb53ca19f588810~mv2.avif";

const FUNDADORA_IMG = "/sobre-nos/fundadora-Ignez-Vidotti-cutted.jpg";

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
      <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-2">
        <div className="relative h-full min-h-[320px] overflow-hidden rounded-[20px] md:min-h-0">
          <img
            src={SEDE_IMG}
            alt="Sede do Clube das Mães Unidas"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
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

      <section className="mt-16 grid grid-cols-1 items-center gap-10 md:grid-cols-[1fr_280px]">
        <div>
          <h2 className="mb-4 font-display text-[32px] font-black">
            Para onde vamos?
          </h2>
          <blockquote className="m-0 mb-6 font-display text-[22px] font-extrabold leading-[1.35] text-azul">
            “Ensinar a pescar e não apenas dar o peixe”
          </blockquote>
          <p className="m-0 text-[16.5px] leading-[1.7] text-ink-2 [text-wrap:pretty]">
            <span className="font-extrabold text-ink">APOIAR</span> as crianças
            e{" "}
            <span className="font-extrabold text-ink">CAPACITAR</span> pessoas
            para se desenvolverem profissionalmente, gerando renda familiar,
            superando crises e melhorando a auto estima!
          </p>
        </div>
        <figure className="m-0 justify-self-center text-center md:justify-self-end">
          <img
            src={FUNDADORA_IMG}
            alt="Ignez Vidotti, fundadora"
            className="mx-auto h-[280px] w-[280px] rounded-full object-cover"
          />
          <figcaption className="mt-3 font-display text-[15px] font-extrabold text-ink">
            Ignez Vidotti
          </figcaption>
          <p className="m-0 mt-0.5 text-[13px] text-ink-2">Fundadora</p>
        </figure>
      </section>
    </div>
  );
}
