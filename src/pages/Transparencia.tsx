import { useEffect, useMemo, useState } from "react";
import {
  fetchArquivos,
  urlArquivo,
  SUBCAT_TRANSP,
  type ArquivoRow,
} from "@/lib/arquivos";

export default function Transparencia() {
  const [arquivos, setArquivos] = useState<ArquivoRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArquivos().then((data) => {
      setArquivos(data);
      setLoading(false);
    });
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
        <p className="text-ink-2">Carregando documentos…</p>
      ) : grupos.length === 0 ? (
        <p className="text-ink-2">
          Nenhum documento de transparência publicado no momento.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-[22px] md:grid-cols-2">
          {grupos.map((g) => (
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
              <div className="grid gap-2">
                {g.itens.map((doc) => (
                  <a
                    key={doc.id}
                    href={urlArquivo(doc)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2.5 rounded-[10px] bg-site-bg px-3 py-2.5 transition-colors hover:bg-subtle"
                  >
                    <span className="flex-none text-[11px] font-extrabold text-vermelho">
                      PDF
                    </span>
                    <span className="flex-1 text-sm font-semibold text-ink">
                      {doc.nome}
                    </span>
                    <span className="flex-none text-[13px] font-bold text-azul">
                      ↓
                    </span>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
