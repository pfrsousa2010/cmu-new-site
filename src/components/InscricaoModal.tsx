import { useEffect, useState, type ReactNode } from "react";
import Modal from "@/components/Modal";
import LoadingLogo from "@/components/LoadingLogo";
import {
  fetchCursoDivulgacao,
  formatDiasSemana,
  formatLocalUnidade,
  fmtDataCurta,
  fmtDataHora,
  sliceHhmm,
  urlInscricaoPublica,
  type CursoDivulgacao,
} from "@/lib/cursos";

interface InscricaoModalProps {
  cursoId: string | null;
  onClose: () => void;
}

export default function InscricaoModal({ cursoId, onClose }: InscricaoModalProps) {
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

  const handleInscrever = () => {
    if (!cursoId) return;
    window.open(urlInscricaoPublica(cursoId), "_blank", "noopener,noreferrer");
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
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {info.vagas != null && info.vagas > 0 && (
                <MetaChip label="Vagas" value={String(info.vagas)} />
              )}
              {carga && <MetaChip label="Carga horária" value={carga} />}
              {(diasLabel || horarioAulaFmt) && (
                <MetaChip
                  label="Dias e horários"
                  value={[diasLabel, horarioAulaFmt].filter(Boolean).join("\n")}
                />
              )}
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
                <ItemList items={info.criterios} empty="Não informado" />
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

          <div className="flex shrink-0 flex-wrap justify-end gap-3 border-t border-black/[.07] bg-white px-8 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border-[1.5px] border-black/[.12] bg-white px-6 py-3 font-display text-sm font-extrabold text-ink transition-colors hover:border-azul hover:text-azul"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleInscrever}
              className="rounded-full bg-verde px-7 py-3 font-display text-sm font-extrabold text-white shadow-[0_3px_10px_rgba(98,179,46,.3)] transition-colors hover:bg-verde-hover"
            >
              Inscrever agora!
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

function MetaChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-azul/[.07] px-4 py-3 text-center">
      <div className="text-[11px] font-bold uppercase tracking-[.04em] text-azul">
        {label}
      </div>
      <div className="mt-1 whitespace-pre-line text-[20px] font-semibold leading-[1.35] text-ink">
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
