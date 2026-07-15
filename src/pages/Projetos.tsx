const PROJETOS = [
  {
    bar: "bg-azul",
    kicker: "SCFV",
    kickerColor: "text-azul",
    titulo: "Serviço de Convivência e Fortalecimento de Vínculos",
    texto:
      "Atividades em grupo que fortalecem vínculos familiares e comunitários, prevenindo situações de risco social por meio de convivência, arte, esporte e cultura.",
  },
  {
    bar: "bg-verde",
    kicker: "CAPACITAÇÃO",
    kickerColor: "text-verde",
    titulo: "Educação Socioprofissional e Inclusão Produtiva",
    texto:
      "Cursos de qualificação profissional gratuitos que preparam jovens e adultos para o mercado de trabalho e para a geração de renda.",
  },
];

export default function Projetos() {
  return (
    <div className="mx-auto max-w-container px-6 pb-20 pt-14">
      <h1 className="mb-3 font-display text-[42px] font-black">Projetos</h1>
      <p className="m-0 mb-10 max-w-[640px] text-[17px] leading-[1.65] text-ink-2">
        Duas frentes de atuação contínua junto à comunidade.
      </p>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {PROJETOS.map((p) => (
          <div
            key={p.kicker}
            className="overflow-hidden rounded-modal border border-black/[.07] bg-white"
          >
            <div className={`h-2 ${p.bar}`} />
            <div className="p-8">
              <div
                className={`mb-2 text-xs font-bold tracking-[.06em] ${p.kickerColor}`}
              >
                {p.kicker}
              </div>
              <h2 className="m-0 mb-3 font-display text-2xl font-extrabold">
                {p.titulo}
              </h2>
              <p className="m-0 text-[15px] leading-[1.65] text-ink-2">
                {p.texto}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
