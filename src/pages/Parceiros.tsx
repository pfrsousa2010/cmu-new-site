import { useEffect, useState } from "react";
import LoadingLogo from "@/components/LoadingLogo";
import {
  fetchParceiros,
  urlLogoParceiro,
  type ParceiroLogo,
} from "@/lib/parceiros";

/**
 * Espaços de exemplo usados enquanto ninguém subiu logo no painel — mesma
 * ideia do fallback do carrossel da Home: a página nunca fica em branco.
 */
const SLOTS = Array.from({ length: 8 }, () => "logo do parceiro");

export default function Parceiros() {
  const [parceiros, setParceiros] = useState<ParceiroLogo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ativo = true;
    fetchParceiros().then((data) => {
      if (!ativo) return;
      setParceiros(data);
      setLoading(false);
    });
    return () => {
      ativo = false;
    };
  }, []);

  return (
    <div className="mx-auto max-w-container px-6 pb-20 pt-14">
      <h1 className="mb-3 font-display text-[42px] font-black">Parceiros</h1>
      <p className="m-0 mb-10 max-w-[600px] text-[17px] leading-[1.6] text-ink-2">
        Nada disso seria possível sem quem caminha conosco. Conheça as
        instituições que apoiam nosso trabalho.
      </p>

      {loading ? (
        <LoadingLogo label="Carregando parceiros…" />
      ) : (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4">
          {parceiros.length > 0
            ? parceiros.map((p) => (
                <div
                  key={p.id}
                  className="flex h-[120px] items-center justify-center rounded-2xl border border-black/[.07] bg-white p-5 transition-shadow hover:shadow-card-hover"
                >
                  {/* Sem `title`: o logo já identifica a instituição, e o
                      tooltip só repetia o nome por cima dele. O `alt` fica —
                      é o que o leitor de tela anuncia e o que aparece se a
                      imagem não carregar. */}
                  <img
                    src={urlLogoParceiro(p)}
                    alt={p.nome}
                    loading="lazy"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              ))
            : SLOTS.map((s, i) => (
                <div
                  key={i}
                  className="flex h-[120px] flex-col items-center justify-center gap-2 rounded-2xl border border-black/[.07] bg-white"
                >
                  <div className="h-11 w-11 rounded-[10px] bg-[repeating-linear-gradient(45deg,#f0ede8,#f0ede8_6px,#faf8f5_6px,#faf8f5_12px)]" />
                  <div className="font-mono text-[11px] text-ink-3">{s}</div>
                </div>
              ))}
        </div>
      )}
    </div>
  );
}
