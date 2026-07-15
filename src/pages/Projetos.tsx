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

const FOTO_CAPACITACAO =
  "/projetos/e7e902_06d8f7aedebe4fce833c918b8b5feccb~mv2.avif";
const FOTO_EDUCADORES =
  "/projetos/e7e902_b18aa4d43d894ebbaea561cd754581a5~mv2.avif";

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

      <section className="mt-16 grid grid-cols-1 items-center gap-10 md:grid-cols-2">
        <div>
          <h2 className="mb-2 font-display text-[32px] font-black">
            Capacitando para a vida
          </h2>
          <p className="m-0 mb-5 font-display text-[18px] font-extrabold leading-[1.4] text-azul">
            Muito além da capacitação, uma prevenção à saúde
          </p>
          <div className="space-y-4 text-[15.5px] leading-[1.7] text-ink-2 [text-wrap:pretty]">
            <p className="m-0">
              O Clube das Mães Unidas, por meio de seus cursos e treinamentos,
              tem ajudado indiretamente na prevenção da depressão para a
              comunidade londrinense, pois uma das formas de prevenção, segundo
              o Ministério da Saúde, é “Combater o estresse concedendo tempo na
              agenda para atividades prazerosas”.
            </p>
            <p className="m-0">
              No Clube das Mães, as atividades proporcionam aos alunos a
              oportunidade de novas amizades, de novos aprendizados, e com isto
              a sensação de sentir-se útil, aumentando a auto estima, melhorando
              no relacionamento familiar e, na maioria das vezes, agregando
              renda à família.
            </p>
            <p className="m-0">
              Desta forma, contribuir com o Clube das Mães Unidas é uma decisão
              importante, pois os cursos ajudam a saúde física e mental das
              pessoas, além de estimular habilidades técnicas contribuindo
              economicamente para a sociedade.
            </p>
            <p className="m-0">
              Durante estes anos, pudemos testemunhar vários depoimentos de
              pessoas que se tornaram pessoas saudáveis, se livraram da
              depressão e melhoraram o convívio familiar!
            </p>
          </div>
        </div>
        <img
          src={FOTO_CAPACITACAO}
          alt="Alunas em atividade no Clube das Mães Unidas"
          className="h-[380px] w-full rounded-[20px] object-cover"
        />
      </section>

      <section className="mt-16 grid grid-cols-1 items-center gap-10 md:grid-cols-2">
        <img
          src={FOTO_EDUCADORES}
          alt="Educadores do Clube das Mães Unidas"
          className="order-2 h-[380px] w-full rounded-[20px] object-cover md:order-1"
        />
        <div className="order-1 md:order-2">
          <h2 className="mb-2 font-display text-[32px] font-black">
            Formação de Educadores
          </h2>
          <p className="m-0 mb-5 font-display text-[18px] font-extrabold leading-[1.4] text-verde">
            Corpo docente preparado para o futuro!
          </p>
          <div className="space-y-4 text-[15.5px] leading-[1.7] text-ink-2 [text-wrap:pretty]">
            <p className="m-0">
              Os professores do Clube das Mães Unidas são todos profissionais
              contratados, pois acreditamos que desta forma há uma dedicação
              profissional, beneficiando o ensino e respeitando o aluno com a
              frequência de um mesmo professor durante o curso.
            </p>
            <p className="m-0">
              A exigência técnica com os profissionais é comparada à de uma
              escola de negócios de alto nível, pois temos o apoio de
              instituições que colaboram com a capacitação técnica de nossos
              professores.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
