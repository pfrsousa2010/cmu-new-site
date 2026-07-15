import { useEffect, useState } from "react";

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

export default function Depoimentos() {
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
      className="border-t border-black/[.06] bg-white"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="mx-auto max-w-container px-6 py-16">
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
      </div>
    </section>
  );
}
