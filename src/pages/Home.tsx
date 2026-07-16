import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Depoimentos from "@/components/Depoimentos";
import LoadingLogo from "@/components/LoadingLogo";
import {
  fetchCursos,
  selecionarDestaquesHome,
  statusDe,
  STATUS_META,
  type CursoRow,
  type StatusCurso,
} from "@/lib/cursos";
import { CURSO_FALLBACK } from "@/lib/refImages";

const HERO_FOTOS = [
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

const TAG_HOME: Record<
  Exclude<StatusCurso, "finalizado">,
  { tag: string; tagColor: string }
> = {
  inscricoes: { tag: "CURSO · INSCRIÇÕES ABERTAS", tagColor: "text-verde" },
  andamento: { tag: "CURSO · EM ANDAMENTO", tagColor: "text-azul" },
  planejado: { tag: "CURSO · EM BREVE", tagColor: "text-laranja" },
};

function HeroCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % HERO_FOTOS.length);
    }, 4000);
    return () => window.clearInterval(id);
  }, [paused]);

  return (
    <div
      className="relative h-[400px] overflow-hidden rounded-3xl"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {HERO_FOTOS.map((src, i) => (
        <img
          key={src}
          src={src}
          alt={`Alunas em atividade ${i + 1}`}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-out ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
      <div className="absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-black/35 to-transparent" />
      <div className="absolute left-1/2 top-4 z-10 flex -translate-x-1/2 gap-1.5">
        {HERO_FOTOS.map((_, i) => (
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

export default function Home() {
  const [destaques, setDestaques] = useState<CursoRow[]>([]);
  const [loadingDestaques, setLoadingDestaques] = useState(true);

  useEffect(() => {
    let ativo = true;
    fetchCursos().then((data) => {
      if (!ativo) return;
      setDestaques(selecionarDestaquesHome(data));
      setLoadingDestaques(false);
    });
    return () => {
      ativo = false;
    };
  }, []);

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
          <HeroCarousel />
          <div className="absolute -bottom-[18px] -left-[18px] z-20 flex gap-[18px] rounded-2xl bg-white px-5 py-3.5 shadow-[0_8px_30px_rgba(0,0,0,.12)]">
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
          <div className="mb-7 flex items-baseline justify-between gap-4">
            <h2 className="m-0 font-display text-[34px] font-black">
              Fique por dentro
            </h2>
            <Link
              to="/cursos"
              className="flex-none text-[15px] font-bold text-azul hover:text-laranja"
            >
              Ver todos os cursos →
            </Link>
          </div>
          {loadingDestaques ? (
            <LoadingLogo label="Carregando cursos…" />
          ) : destaques.length === 0 ? (
            <p className="m-0 text-ink-2">
              Nenhum curso em destaque no momento.{" "}
              <Link
                to="/cursos"
                className="font-bold text-azul hover:text-laranja"
              >
                Ver cursos
              </Link>
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {destaques.map((c) => {
                const st = statusDe(c);
                const tag =
                  st === "finalizado"
                    ? {
                        tag: `CURSO · ${STATUS_META.finalizado.label.toUpperCase()}`,
                        tagColor: "text-ink-2",
                      }
                    : TAG_HOME[st];
                const temImagem = Boolean(c.imagem_url);
                const img = c.imagem_url || CURSO_FALLBACK;
                return (
                  <Link
                    key={c.id}
                    to={`/cursos?busca=${encodeURIComponent(c.titulo)}`}
                    className="overflow-hidden rounded-[18px] border border-black/[.07] bg-white transition-shadow hover:shadow-card-hover-lg"
                  >
                    <div
                      className={
                        temImagem
                          ? "h-[180px] w-full"
                          : "flex h-[180px] w-full items-center justify-center bg-dark"
                      }
                    >
                      <img
                        src={img}
                        alt={c.titulo}
                        className={
                          temImagem
                            ? "block h-full w-full object-cover"
                            : "block h-[88px] w-[88px] object-contain"
                        }
                      />
                    </div>
                    <div className="px-5 pb-5 pt-[18px]">
                      <div
                        className={`mb-1.5 text-xs font-bold ${tag.tagColor}`}
                      >
                        {tag.tag}
                      </div>
                      <div className="font-display text-lg font-extrabold text-ink">
                        {c.titulo}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
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

      <Depoimentos />
    </>
  );
}
