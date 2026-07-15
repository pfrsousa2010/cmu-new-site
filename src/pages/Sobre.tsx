import { useEffect, useState } from "react";

const SOBRE_FOTOS = [
  "/sobre-nos/04c518_0422ce93c8c44973a338f68ce10b227b~mv2.avif",
  "/sobre-nos/04c518_04f3154884c94bb194263e71e7e76899~mv2.avif",
  "/sobre-nos/04c518_142944292c9b45f1a6b4d15a918d7b18~mv2.avif",
  "/sobre-nos/04c518_551ca846c7e142458ac05b3964563c73~mv2.avif",
  "/sobre-nos/04c518_6a530e9a6fb4442fae359c9931a0baa2~mv2.avif",
  "/sobre-nos/04c518_6c171a90a57f4d6da5b3997a0e5f30aa~mv2.avif",
  "/sobre-nos/04c518_93ea2b34f5e54a888b3511bb98bdc5c1~mv2.avif",
  "/sobre-nos/04c518_9eaca1b8bdfa48bf83f8d04e266a3ca4~mv2.avif",
  "/sobre-nos/04c518_a209a26536014f3fb7a563b2b3945c00~mv2.avif",
  "/sobre-nos/04c518_a8e6be6f5d3f4cc69f8ee875a36719d9~mv2.avif",
  "/sobre-nos/e7e902_feb773fdef5747039c2ede0def345afd~mv2.avif",
];

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

const DEPOIMENTOS = [
  {
    nome: "Marcia",
    foto: "/depoimento/Marcia.avif",
    texto:
      "Participei do curso de salgados e agora estou fazendo panificação, Presente de Deus na minha vida, recomendo de olhos fechados ótimos profissionais, a minha turma é uma benção. Que Deus abençoe grandemente a toda equipe envolvida neste lindo trabalho. O meu próximo curso será de confeitaria.",
  },
  {
    nome: "Maria",
    foto: "/depoimento/Maria.avif",
    texto:
      "Para mim o curso de manicure foi muito importante, pois venho de algumas crises de depressões. Quando cheguei ao clube, vi o quanto era capaz e que podia seguir em frente. Com este curso, apreendi a conviver com outras pessoas, pois quando você passa pela depressão você se fecha muito, e o curso me trouxe outra visão, hoje eu quero ser uma profissional e eu sei que sou capaz e posso ser essa profissional. E tudo isso eu devo ao Clube das Mães, meu tempo era muito ocioso, ficava muito parada e por isso vinha até um pouco de depressão, então o curso foi muito importante. E pra quem tem a intenção de fazer eu recomendo! Porque agregou muito na minha vida, psicologamente e como pessoa. Eu consegui vi que eu sou capaz e peguei meu certificado. Agradeço ao clube a professora e todas as minhas amigas. Obrigada!",
  },
  {
    nome: "Dineusa",
    foto: "/depoimento/Dineuza.avif",
    texto:
      "Tudo de bom fiz o curso de manicure e aprendi mesmo, a professora Dalziza é maravilhosa. Clube das mães gente abençoada, já estou ganhando dinheiro com a minha nova profissão de manicure em breve quero fazer outros cursos.",
  },
  {
    nome: "Leticia",
    foto: "/depoimento/Leticia.avif",
    texto:
      "Procurei o Clube das mães unidas, pois tive alguns problemas no meu trabalho, e então, resolvi não trabalhar mais como empregada e atuar na área da beleza. Tive a oportunidade de começar a fazer o curso de depilação e vi que precisava fazer outros cursos na área para atender outras necessidades de minhas clientes, então fiz outros cursos como: maquiagem, design de sobrancelhas, manicure e no momento faço o curso de cabeleireira. Desta forma consegui abrir meu espaço, onde consigo ter uma renda mensal e manter minha casa e minha família. Agradeço muito ao clube das mães, um ótimo local, com ótimos profissionais. Eu agradeço de coração mesmo! Espaço de beleza e estética SEMPREBELA.",
  },
  {
    nome: "Ana",
    foto: "/depoimento/Ana.avif",
    texto:
      "Maravilhoso, somos muito bem recebidos e tratados com muito amor por todos que fazem parte do clube das mães, um lugar onde estou aprendendo a cada curso e colocando em prática meus talentos.... Amo todos vocês... secretárias e professoras meu muito obrigado!",
  },
  {
    nome: "Alzira",
    foto: "/depoimento/Alzira.avif",
    texto:
      "O Clube pra mim foi como uma mãe. Comecei com o curso de cuidador de idosos, e foi tão bom que aumentou muito a minha autoestima, por causa da minha idade. Tenho 60 anos e achei que não tinha cursos assim, que poderiam valorizar a gente. Posteriormente veio a oportunidade de trabalhar na área da beleza e fui gostando. Hoje consegui concluir o 8º curso e foi maravilhoso, se você achar que não é capaz de trabalhar, pense, é capaz sim! Eu com a minha idade resolvi fazer e começar a trabalhar. Hoje atendo a domicílio e inclusive, já comecei a montar o meu salão. Aquele que acha que é incapaz não é! Temos que procurar nosso objetivo não importa a idade. Se Deus abriu essa porta ele sabe que a gente é capaz. Então esse é o conselho que deixo não só para nossa idade, mas também para as meninas que estão começando agora, quem não tem oportunidade de trabalho. Procure o Clube das Mães Unidas, pois são muito bons os cursos, são valorizados os professores e toda a equipe é ótima. É uma mãe mesmo.",
  },
];

function SobreCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % SOBRE_FOTOS.length);
    }, 4000);
    return () => window.clearInterval(id);
  }, [paused]);

  return (
    <div
      className="relative h-full min-h-[320px] overflow-hidden rounded-[20px] md:min-h-0"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {SOBRE_FOTOS.map((src, i) => (
        <img
          key={src}
          src={src}
          alt={`Nossa equipe ${i + 1}`}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-out ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 to-transparent" />
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
        {SOBRE_FOTOS.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Ir para foto ${i + 1}`}
            aria-current={i === index}
            onClick={() => setIndex(i)}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === index ? "w-5 bg-white" : "w-2 bg-white/55 hover:bg-white/80"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function Depoimentos() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const atual = DEPOIMENTOS[index];

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % DEPOIMENTOS.length);
    }, 8000);
    return () => window.clearInterval(id);
  }, [paused]);

  return (
    <section
      className="mt-16"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <h2 className="mb-3 font-display text-[32px] font-black">Depoimentos</h2>
      <p className="m-0 mb-8 max-w-[520px] text-[16px] leading-[1.6] text-ink-2">
        Histórias de quem transformou a própria vida com os cursos do Clube das
        Mães Unidas.
      </p>

      <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-[240px_1fr] md:items-center">
        <div className="relative mx-auto aspect-square w-full max-w-[240px] overflow-hidden rounded-full">
          {DEPOIMENTOS.map((d, i) => (
            <img
              key={d.nome}
              src={d.foto}
              alt={d.nome}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-out ${
                i === index ? "opacity-100" : "opacity-0"
              }`}
            />
          ))}
        </div>

        <div>
          <blockquote className="m-0 text-[16.5px] leading-[1.7] text-ink-2 [text-wrap:pretty]">
            “{atual.texto}”
          </blockquote>
          <cite className="mt-5 block font-display text-[18px] font-extrabold not-italic text-ink">
            {atual.nome}
          </cite>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
        {DEPOIMENTOS.map((d, i) => (
          <button
            key={d.nome}
            type="button"
            aria-label={`Depoimento de ${d.nome}`}
            aria-current={i === index}
            onClick={() => setIndex(i)}
            className={`overflow-hidden rounded-full transition-all duration-300 ${
              i === index
                ? "h-12 w-12 ring-2 ring-azul ring-offset-2"
                : "h-10 w-10 opacity-55 hover:opacity-90"
            }`}
          >
            <img src={d.foto} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
    </section>
  );
}

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
        <SobreCarousel />
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

      <Depoimentos />
    </div>
  );
}
