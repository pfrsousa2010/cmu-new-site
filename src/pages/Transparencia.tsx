import { useEffect, useMemo, useState } from "react";
import LoadingLogo from "@/components/LoadingLogo";
import {
  fetchArquivos,
  urlArquivo,
  tipoArquivo,
  fmtCompetencia,
  agruparConveniosPorAno,
  SUBCAT_TRANSP,
  type ArquivoRow,
} from "@/lib/arquivos";

function LinkDoc({
  doc,
  badge,
  indent,
}: {
  doc: ArquivoRow;
  badge?: string;
  indent?: boolean;
}) {
  return (
    <a
      href={urlArquivo(doc)}
      target="_blank"
      rel="noreferrer"
      className={[
        "flex items-center gap-2.5 rounded-[10px] bg-site-bg px-3 py-2.5 transition-colors hover:bg-subtle",
        indent ? "ml-4 border-l-2 border-verde/30 pl-3" : "",
      ].join(" ")}
    >
      <span className="flex-none text-[11px] font-extrabold text-vermelho">
        {tipoArquivo(doc.mime, doc.nome)}
      </span>
      <span className="min-w-0 flex-1 text-sm font-semibold text-ink">
        {doc.nome}
      </span>
      {badge ? (
        <span className="flex-none rounded-full bg-verde/12 px-2 py-0.5 text-[11px] font-bold text-verde">
          {badge}
        </span>
      ) : null}
      <span className="flex-none text-[13px] font-bold text-azul">↓</span>
    </a>
  );
}

export default function Transparencia() {
  const [arquivos, setArquivos] = useState<ArquivoRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ativo = true;
    fetchArquivos().then((data) => {
      if (!ativo) return;
      setArquivos(data);
      setLoading(false);
    });
    return () => {
      ativo = false;
    };
  }, []);

  const grupos = useMemo(() => {
    const docs = arquivos.filter((a) => a.categoria === "transparencia");
    return SUBCAT_TRANSP.map((s) => ({
      ...s,
      itens: docs.filter(
        (d) => (d.subcategoria ?? "institucionais") === s.key
      ),
    })).filter((g) => g.itens.length > 0);
  }, [arquivos]);

  return (
    <div className="mx-auto max-w-container px-6 pb-20 pt-14">
      <h1 className="mb-3 font-display text-[42px] font-black">Transparência</h1>
      <p className="m-0 mb-10 max-w-[620px] text-[17px] leading-[1.6] text-ink-2">
        Prestamos contas de tudo o que fazemos. Acesse nossos documentos
        institucionais, convênios, planos de trabalho e relatórios.
      </p>

      {loading ? (
        <LoadingLogo label="Carregando documentos…" />
      ) : grupos.length === 0 ? (
        <p className="text-ink-2">
          Nenhum documento de transparência publicado no momento.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-[22px]">
          {grupos.map((g) => {
            const ehConvenios = g.key === "convenios";
            const anos = ehConvenios ? agruparConveniosPorAno(g.itens) : [];

            return (
              <div
                key={g.key}
                className="rounded-card border border-black/[.07] bg-white px-7 py-[26px]"
              >
                <div className="mb-4 flex items-center gap-3">
                  <div className={`h-8 w-2.5 rounded-full ${g.cor}`} />
                  <div className="font-display text-[19px] font-extrabold">
                    {g.label}
                  </div>
                </div>

                {ehConvenios ? (
                  <div className="grid gap-6">
                    {anos.map((ano) => (
                      <div key={ano.label}>
                        <div className="mb-2.5 font-display text-[15px] font-extrabold text-ink-2">
                          {ano.label}
                        </div>
                        <div className="grid gap-3">
                          {ano.itens.map(({ convenio, aditivos }) => {
                            const comp = fmtCompetencia(
                              convenio.competencia_mes,
                              convenio.competencia_ano
                            );
                            return (
                              <div key={convenio.id} className="grid gap-1.5">
                                <LinkDoc doc={convenio} badge={comp || undefined} />
                                {aditivos.map((ad) => (
                                  <LinkDoc
                                    key={ad.id}
                                    doc={ad}
                                    indent
                                    badge={
                                      fmtCompetencia(
                                        ad.competencia_mes,
                                        ad.competencia_ano
                                      ) || undefined
                                    }
                                  />
                                ))}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid gap-2">
                    {g.itens.map((doc) => (
                      <LinkDoc key={doc.id} doc={doc} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
