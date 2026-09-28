import { useEffect, useMemo, useState } from "react";
import LoadingLogo from "@/components/LoadingLogo";
import {
  fetchArquivos,
  urlArquivo,
  fmtTamanho,
  fmtDataPublicacao,
  type ArquivoRow,
  type CategoriaArquivo,
} from "@/lib/arquivos";

type Aba = Extract<CategoriaArquivo, "compra" | "servicos" | "seletivo">;

const ABAS: { key: Aba; label: string }[] = [
  { key: "compra", label: "Editais de compra" },
  { key: "servicos", label: "Prestação de serviços" },
  { key: "seletivo", label: "Processo seletivo" },
];

export default function Editais() {
  const [arquivos, setArquivos] = useState<ArquivoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [aba, setAba] = useState<Aba>("compra");

  useEffect(() => {
    fetchArquivos().then((data) => {
      setArquivos(data);
      setLoading(false);
    });
  }, []);

  const filtrados = useMemo(
    () => arquivos.filter((a) => a.categoria === aba),
    [arquivos, aba]
  );

  const abertos = useMemo(
    () => filtrados.filter((a) => a.encerrado !== true),
    [filtrados]
  );
  const encerrados = useMemo(
    () => filtrados.filter((a) => a.encerrado === true),
    [filtrados]
  );

  return (
    <div className="mx-auto max-w-[1000px] px-6 pb-20 pt-14">
      <h1 className="mb-3 font-display text-[42px] font-black">Editais</h1>
      <p className="m-0 mb-8 text-[17px] text-ink-2">
        Editais de compra, prestação de serviços e processos seletivos em
        andamento.
      </p>

      <div className="mb-7 flex flex-wrap gap-2">
        {ABAS.map((a) => {
          const active = aba === a.key;
          return (
            <button
              key={a.key}
              onClick={() => setAba(a.key)}
              className={[
                "rounded-full border-[1.5px] px-5 py-2.5 text-sm font-bold transition-colors",
                active
                  ? "border-vermelho bg-vermelho text-white"
                  : "border-black/[.12] bg-white text-ink-mid hover:border-vermelho",
              ].join(" ")}
            >
              {a.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <LoadingLogo label="Carregando editais…" />
      ) : filtrados.length === 0 ? (
        <p className="text-ink-2">Nenhum edital nesta categoria no momento.</p>
      ) : (
        <div className="grid gap-6">
          <SecaoEditais titulo="Em aberto" editais={abertos} iniciaAberta />
          <SecaoEditais titulo="Encerrados" editais={encerrados} iniciaAberta={false} />
        </div>
      )}
    </div>
  );
}

function SecaoEditais({
  titulo,
  editais,
  iniciaAberta,
}: {
  titulo: string;
  editais: ArquivoRow[];
  iniciaAberta: boolean;
}) {
  const [aberta, setAberta] = useState(iniciaAberta);

  return (
    <div>
      <button
        type="button"
        onClick={() => setAberta((a) => !a)}
        aria-expanded={aberta}
        className="flex w-full items-center justify-between gap-3 border-b border-black/[.08] pb-2.5 text-left"
      >
        <span className="font-display text-lg font-extrabold">
          {titulo}{" "}
          <span className="font-sans text-sm font-bold text-ink-2">
            ({editais.length})
          </span>
        </span>
        <span className="flex flex-none items-center gap-1.5 text-[13px] font-bold text-ink-2">
          {aberta ? "Clique para fechar" : "Clique para expandir"}
          <span
            aria-hidden="true"
            className={["transition-transform", aberta ? "rotate-180" : ""].join(
              " "
            )}
          >
            ▾
          </span>
        </span>
      </button>
      {aberta &&
        (editais.length === 0 ? (
          <p className="mt-3 text-ink-2">Nenhum edital nesta categoria no momento.</p>
        ) : (
          <div className="mt-3 grid gap-3">
            {editais.map((ed) => (
              <EditalCard key={ed.id} ed={ed} />
            ))}
          </div>
        ))}
    </div>
  );
}

function EditalCard({ ed }: { ed: ArquivoRow }) {
  const encerrado = ed.encerrado === true;
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-black/[.07] bg-white px-4 py-4 transition-shadow hover:shadow-card-hover sm:flex-row sm:items-center sm:gap-[18px] sm:px-[22px] sm:py-[18px]">
      <div className="flex min-w-0 flex-1 items-start gap-3.5 sm:items-center sm:gap-[18px]">
        <div className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-vermelho/10 text-[11px] font-extrabold text-vermelho">
          PDF
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[15.5px] font-bold leading-snug">{ed.nome}</div>
          <div className="mt-0.5 text-[13px] text-ink-2">
            Publicado em {fmtDataPublicacao(ed.publicado_em)} ·{" "}
            {fmtTamanho(ed.tamanho_bytes)}
          </div>
        </div>
      </div>
      <div className="flex flex-none items-center justify-between gap-4 pl-[58px] sm:justify-end sm:gap-[18px] sm:pl-0">
        <span
          className={[
            "rounded-full px-3 py-[5px] text-xs font-bold",
            encerrado
              ? "bg-black/[.07] text-ink-2"
              : "bg-verde/[.12] text-verde-dark",
          ].join(" ")}
        >
          {encerrado ? "Encerrado" : "Aberto"}
        </span>
        <a
          href={urlArquivo(ed)}
          target="_blank"
          rel="noreferrer"
          className="text-sm font-bold text-azul hover:text-laranja"
        >
          Baixar ↓
        </a>
      </div>
    </div>
  );
}
