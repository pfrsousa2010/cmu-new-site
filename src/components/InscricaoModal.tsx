import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "@/components/Modal";
import LoadingLogo from "@/components/LoadingLogo";
import {
  fetchCursoDivulgacao,
  formatDiasSemana,
  formatLocalUnidade,
  fmtDataCurta,
  fmtDataHora,
  sliceHhmm,
  PERIODOS_LABEL,
  PERIODO_CLASSES,
  limiteInscricoes,
  vagasRestantes,
  emListaEspera,
  type CursoDivulgacao,
  type PreRequisito,
} from "@/lib/cursos";

interface InscricaoModalProps {
  cursoId: string | null;
  onClose: () => void;
}

export default function InscricaoModal({ cursoId, onClose }: InscricaoModalProps) {
  const navigate = useNavigate();
  const [info, setInfo] = useState<CursoDivulgacao | null>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!cursoId) {
      setInfo(null);
      setErro("");
      return;
    }
    let ativo = true;
    setLoading(true);
    setErro("");
    fetchCursoDivulgacao(cursoId).then((data) => {
      if (!ativo) return;
      if (!data) setErro("Não foi possível carregar as informações do curso.");
      setInfo(data);
      setLoading(false);
    });
    return () => {
      ativo = false;
    };
  }, [cursoId]);

  const open = Boolean(cursoId);

  const hIni = sliceHhmm(info?.horario_aula_inicio);
  const hFim = sliceHhmm(info?.horario_aula_fim);
  const diasLabel = formatDiasSemana(info?.dia_semana);
  const horarioAulaFmt =
    hIni && hFim ? `${hIni}h às ${hFim}h` : hIni ? `${hIni}h` : hFim ? `${hFim}h` : "";
  const totalH = info?.carga_horaria_total;
  const diariaH = info?.carga_horaria_diaria;
  const cargaLinha1 =
    totalH != null && Number(totalH) > 0 ? `${Number(totalH)}h` : "";
  const cargaLinha2 =
    totalH != null &&
    Number(totalH) > 0 &&
    diariaH != null &&
    Number(diariaH) > 0
      ? `${Math.round(Number(totalH) / Number(diariaH))} aulas`
      : "";
  const carga = [cargaLinha1, cargaLinha2].filter(Boolean).join("\n");
  const dataAtend = info?.data_selecao
    ? fmtDataCurta(info.data_selecao)
    : "";
  const horaAtend = sliceHhmm(info?.horario_atendimento_inicio);
  const quandoAtend =
    dataAtend && horaAtend
      ? `${dataAtend} às ${horaAtend}`
      : dataAtend || horaAtend || "Não definido";

  const limiteInsc = info ? limiteInscricoes(info) : null;
  const restantesInsc = info ? vagasRestantes(info) : null;
  const listaEspera = info ? emListaEspera(info) : false;

  const handleInscrever = () => {
    if (!cursoId) return;
    navigate(`/cursos/${cursoId}/inscricao`);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      width={720}
      className="flex flex-col overflow-hidden p-0"
    >
      {loading ? (
        <div className="p-8">
          <LoadingLogo label="Carregando informações…" className="py-10" />
        </div>
      ) : erro || !info ? (
        <div className="space-y-5 p-8">
          <p className="m-0 text-ink-2">{erro || "Curso não encontrado."}</p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border-[1.5px] border-black/[.12] bg-white px-6 py-3 font-display text-sm font-extrabold text-ink"
          >
            Fechar
          </button>
        </div>
      ) : (
        <>
          <div className="shrink-0 border-b border-black/[.07] px-8 pb-4 pt-8">
            <h2 className="m-0 font-display text-[26px] font-black leading-tight text-ink">
              {info.titulo}
            </h2>
            <p className="mt-2 text-[14px] text-ink-2">
              Curso: {fmtDataCurta(info.inicio)} a {fmtDataCurta(info.fim)}
            </p>
            {(info.inscricoes_inicio || info.inscricoes_fim) && (
              <p className="mt-1 text-[14px] text-ink-2">
                Inscrições: {fmtDataHora(info.inscricoes_inicio)}
                {info.inscricoes_fim
                  ? ` até ${fmtDataHora(info.inscricoes_fim)}`
                  : ""}
              </p>
            )}
          </div>

          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-8 py-5">
            {listaEspera && (
              <div className="rounded-2xl bg-laranja/[.1] px-5 py-4 text-[14.5px] leading-[1.6] text-ink">
                <b>Vagas esgotadas.</b> Sua inscrição continua sendo aceita, mas
                entra na <b>lista de espera</b>: se uma vaga for liberada, a
                equipe entra em contato.
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {listaEspera ? (
                <MetaChip label="Inscrições" value={"Lista\nde espera"} />
              ) : limiteInsc != null ? (
                <MetaChip
                  label="Vagas para inscrição"
                  value={`${restantesInsc} de ${limiteInsc}`}
                />
              ) : (
                info.vagas != null &&
                info.vagas > 0 && (
                  <MetaChip label="Vagas na turma" value={String(info.vagas)} />
                )
              )}
              {carga && <MetaChip label="Carga horária" value={carga} />}
              {diasLabel && <MetaChip label="Dias" value={diasLabel} />}
              {/* O turno fica junto do horário, não dos dias: é o mesmo dado
                  lido de dois jeitos ("Tarde" e "14:30h às 17:30h"). */}
              <MetaChip
                label="Horário"
                value={[PERIODOS_LABEL[info.periodo], horarioAulaFmt]
                  .filter(Boolean)
                  .join("\n")}
                tom={PERIODO_CLASSES[info.periodo]}
              />
            </div>

            {info.objetivo_curso?.trim() && (
              <Section title="Objetivo">
                <p className="m-0 text-[14.5px] leading-[1.65] text-ink-2 [text-wrap:pretty]">
                  {info.objetivo_curso.trim()}
                </p>
              </Section>
            )}

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Section title="Conteúdo">
                <ItemList items={info.conteudos} empty="Não informado" />
              </Section>
              <Section title="Critérios">
                <PreRequisitoList itens={info.criterios} />
              </Section>
            </div>

            <Section title="Local da aula">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <p className="m-0 text-[14.5px] leading-[1.55] text-ink-2">
                  {formatLocalUnidade(info.localAula)}
                </p>
                {mapsQuery(info.localAula) && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery(info.localAula)!)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 text-[13.5px] font-bold text-azul hover:text-laranja"
                  >
                    Ver no mapa
                  </a>
                )}
              </div>
            </Section>

            <Section title="Atendimento">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <p className="m-0 text-[14.5px] leading-[1.55] text-ink-2">
                  {quandoAtend} — {formatLocalUnidade(info.localAtendimento)}
                </p>
                {mapsQuery(info.localAtendimento) && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery(info.localAtendimento)!)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 text-[13.5px] font-bold text-azul hover:text-laranja"
                  >
                    Ver no mapa
                  </a>
                )}
              </div>
            </Section>
          </div>

          {/* Lado a lado também no celular: cada botão fica com metade da
              linha (`flex-1`), porque "Entrar na lista de espera" não cabe ao
              lado de "Cancelar" no tamanho natural. A partir de sm voltam ao
              tamanho do conteúdo, alinhados à direita. */}
          <div className="flex shrink-0 gap-3 border-t border-black/[.07] bg-white px-5 py-4 sm:justify-end sm:px-8">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-full border-[1.5px] border-black/[.12] bg-white px-4 py-3 font-display text-[13.5px] font-extrabold leading-tight text-ink transition-colors hover:border-azul hover:text-azul sm:flex-none sm:px-6 sm:text-sm"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleInscrever}
              className="flex-1 rounded-full bg-verde px-4 py-3 font-display text-[13.5px] font-extrabold leading-tight text-white shadow-[0_3px_10px_rgba(98,179,46,.3)] transition-colors hover:bg-verde-hover sm:flex-none sm:px-7 sm:text-sm"
            >
              {listaEspera ? "Entrar na lista de espera" : "Inscrever agora!"}
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}

function mapsQuery(u: { nome?: string | null; endereco?: string | null }): string | null {
  const endereco = (u.endereco || "").trim();
  const nome = (u.nome || "").trim();
  const q = [nome, endereco].filter(Boolean).join(", ");
  return q || null;
}

function MetaChip({
  label,
  value,
  tom,
}: {
  label: string;
  value: string;
  /** Fundo + texto do turno; sem isto o chip usa o azul padrão. */
  tom?: string;
}) {
  return (
    <div
      className={`rounded-2xl px-4 py-3 text-center ${tom ?? "bg-azul/[.07]"}`}
    >
      {/* Sem baixar a opacidade: a 80% o rótulo de 11px cai para ~3.4:1 sobre
          o fundo do turno, abaixo do mínimo de 4.5:1. */}
      <div
        className={`text-[11px] font-bold uppercase tracking-[.04em] ${tom ? "" : "text-azul"}`}
      >
        {label}
      </div>
      <div
        className={`mt-1 whitespace-pre-line text-[20px] font-semibold leading-[1.35] ${tom ? "" : "text-ink"}`}
      >
        {value}
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div>
      <h3 className="mb-2 font-display text-[13px] font-extrabold uppercase tracking-[.04em] text-azul">
        {title}
      </h3>
      {children}
    </div>
  );
}

function ItemList({ items, empty }: { items: string[]; empty: string }) {
  if (items.length === 0) {
    return <p className="m-0 text-[14px] italic text-ink-2">{empty}</p>;
  }
  return (
    <ul className="m-0 list-disc space-y-1.5 pl-5 text-[14.5px] leading-[1.55] text-ink-2">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

/** Critérios do SGE: os obrigatórios ganham selo, como na inscrição do SGE. */
function PreRequisitoList({ itens }: { itens: PreRequisito[] }) {
  if (itens.length === 0) {
    return <p className="m-0 text-[14px] italic text-ink-2">Não informado</p>;
  }
  return (
    <ul className="m-0 list-disc space-y-1.5 pl-5 text-[14.5px] leading-[1.55] text-ink-2">
      {itens.map((item) => (
        <li key={item.descricao}>
          {item.descricao}
          {item.obrigatorio && (
            <span className="ml-2 whitespace-nowrap rounded-full bg-laranja/[.12] px-2 py-[2px] align-middle text-[11px] font-bold uppercase tracking-[.03em] text-laranja">
              Obrigatório
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
