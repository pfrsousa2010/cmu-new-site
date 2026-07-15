import { Link } from "react-router-dom";
import {
  HERO_IMG,
  IMG_PADARIA,
  IMG_MESA,
  IMG_MARMITA,
} from "@/lib/refImages";

const DESTAQUES = [
  {
    titulo: "Padaria",
    tag: "CURSO · INSCRIÇÕES ABERTAS",
    tagColor: "text-verde",
    img: IMG_PADARIA,
  },
  {
    titulo: "Mesa posta",
    tag: "CURSO · INSCRIÇÕES ABERTAS",
    tagColor: "text-verde",
    img: IMG_MESA,
  },
  {
    titulo: "Marmitaria — Comida caseira",
    tag: "CURSO · EM ANDAMENTO",
    tagColor: "text-azul",
    img: IMG_MARMITA,
  },
];

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="mx-auto grid max-w-container grid-cols-1 items-center gap-14 px-6 pb-14 pt-16 md:grid-cols-[1.05fr_.95fr]">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-verde/[.12] px-3.5 py-1.5 text-[13px] font-bold text-verde-dark">
            ● Inscrições abertas para novos cursos
          </div>
          <h1 className="mb-5 font-display text-[42px] font-black leading-[1.05] md:text-[54px]">
            Capacitando para um <span className="text-verde">mundo</span>{" "}
            <span className="text-azul">melhor</span>
          </h1>
          <p className="mb-8 max-w-[480px] text-[18px] leading-[1.6] text-ink-2 [text-wrap:pretty]">
            O Clube das Mães Unidas prepara e capacita jovens e adultos para o
            mercado de trabalho, por meio de cursos gratuitos e trabalhos de
            inclusão social em Londrina.
          </p>
          <div className="flex flex-wrap gap-3.5">
            <Link
              to="/cursos"
              className="rounded-full bg-azul px-[30px] py-3.5 font-display text-base font-extrabold text-white shadow-[0_4px_14px_rgba(46,111,183,.3)] transition-colors hover:bg-azul-hover hover:text-white"
            >
              Ver cursos
            </Link>
            <Link
              to="/sobre"
              className="rounded-full border-[1.5px] border-black/[.12] bg-white px-[30px] py-3.5 font-display text-base font-extrabold text-ink transition-colors hover:border-azul hover:text-azul"
            >
              Conheça a ONG
            </Link>
          </div>
        </div>

        <div className="relative">
          <img
            src={HERO_IMG}
            alt="Alunas em atividade"
            className="block h-[400px] w-full rounded-3xl object-cover"
          />
          <div className="absolute -bottom-[18px] -left-[18px] flex gap-[18px] rounded-2xl bg-white px-5 py-3.5 shadow-[0_8px_30px_rgba(0,0,0,.12)]">
            {[
              ["+30", "anos de história", "text-verde"],
              ["+500", "alunos por ano", "text-laranja"],
              ["100%", "gratuito", "text-vermelho"],
            ].map(([n, label, color]) => (
              <div key={label as string}>
                <div className={`font-display text-2xl font-black ${color}`}>
                  {n}
                </div>
                <div className="text-xs text-ink-2">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pilares */}
      <section className="mx-auto grid max-w-container grid-cols-1 gap-5 px-6 pb-14 pt-8 md:grid-cols-3">
        {[
          {
            to: "/sobre",
            border: "border-t-verde",
            titulo: "Missão",
            texto:
              "Contribuir para a construção de uma sociedade melhor, minimizando vulnerabilidades sociais e promovendo o protagonismo das pessoas atendidas.",
          },
          {
            to: "/eventos",
            border: "border-t-azul",
            titulo: "Agenda",
            texto:
              "Acompanhe nossa agenda com os próximos eventos, oficinas e cursos abertos à comunidade.",
          },
          {
            to: "/cursos",
            border: "border-t-laranja",
            titulo: "Cursos",
            texto:
              "Conheça nossos cursos e possibilidades de crescimento pessoal e profissional — sempre gratuitos.",
          },
        ].map((p) => (
          <Link
            key={p.titulo}
            to={p.to}
            className={`rounded-card border-t-[5px] ${p.border} bg-white p-7 shadow-card transition-shadow hover:shadow-card-hover`}
          >
            <div className="mb-2 font-display text-xl font-extrabold text-ink">
              {p.titulo}
            </div>
            <p className="m-0 text-[14.5px] leading-[1.6] text-ink-2">
              {p.texto}
            </p>
          </Link>
        ))}
      </section>

      {/* Fique por dentro */}
      <section className="border-y border-black/[.06] bg-white">
        <div className="mx-auto max-w-container px-6 py-16">
          <div className="mb-7 flex items-baseline justify-between">
            <h2 className="m-0 font-display text-[34px] font-black">
              Fique por dentro
            </h2>
            <Link
              to="/cursos"
              className="text-[15px] font-bold text-azul hover:text-laranja"
            >
              Ver todos os cursos →
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {DESTAQUES.map((d) => (
              <Link
                key={d.titulo}
                to="/cursos"
                className="overflow-hidden rounded-[18px] border border-black/[.07] bg-white transition-shadow hover:shadow-card-hover-lg"
              >
                <img
                  src={d.img}
                  alt={d.titulo}
                  className="block h-[180px] w-full object-cover"
                />
                <div className="px-5 pb-5 pt-[18px]">
                  <div
                    className={`mb-1.5 text-xs font-bold ${d.tagColor}`}
                  >
                    {d.tag}
                  </div>
                  <div className="font-display text-lg font-extrabold text-ink">
                    {d.titulo}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Quote + CTA */}
      <section className="mx-auto max-w-[800px] px-6 py-20 text-center">
        <div className="font-display text-[28px] font-extrabold leading-[1.4] text-ink">
          “Estamos aqui para ajudar as pessoas e é nossa obrigação fazê-lo. É a
          nossa missão.”
        </div>
        <div className="mt-3.5 text-[15px] text-ink-2">— Hélio Terzoni</div>
        <div className="mt-10 inline-flex flex-wrap justify-center gap-3.5">
          <Link
            to="/contato"
            className="rounded-full bg-verde px-[30px] py-3.5 font-display text-base font-extrabold text-white shadow-[0_4px_14px_rgba(98,179,46,.3)] transition-colors hover:bg-verde-hover hover:text-white"
          >
            Junte-se a nós
          </Link>
          <Link
            to="/doar"
            className="rounded-full border-[1.5px] border-laranja bg-white px-[30px] py-3.5 font-display text-base font-extrabold text-laranja transition-colors hover:bg-laranja hover:text-white"
          >
            Faça uma doação
          </Link>
        </div>
      </section>
    </>
  );
}
