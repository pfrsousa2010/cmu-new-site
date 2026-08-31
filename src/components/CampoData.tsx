import { useEffect, useRef, useState } from "react";
import {
  dataBRparaISO,
  dataISOparaBR,
  mascaraData,
} from "@/lib/inscricoes";

interface CampoDataProps {
  id: string;
  /** Valor em ISO (yyyy-mm-dd) ou "" enquanto a digitação não fecha uma data. */
  value: string;
  onChange: (iso: string) => void;
  /** Bloqueia datas futuras no seletor (datas de nascimento). */
  semFuturo?: boolean;
  className?: string;
}

/**
 * Data digitável no formato dd/mm/aaaa, com o seletor de calendário atrás do
 * ícone.
 *
 * O `<input type="date">` puro abre o seletor nativo assim que o campo recebe
 * o toque no celular, sem teclado numérico — quem sabe a própria data de
 * nascimento perde tempo navegando por um calendário. Aqui o campo é texto com
 * máscara (teclado numérico) e o calendário só aparece se a pessoa tocar no
 * ícone, que dispara o seletor nativo de um `<input type="date">` escondido.
 * Mesma decisão do `DateInput` do SGE, sem trazer uma lib de calendário para um
 * projeto que não tem nenhuma.
 */
export default function CampoData({
  id,
  value,
  onChange,
  semFuturo,
  className = "",
}: CampoDataProps) {
  const [texto, setTexto] = useState(() => dataISOparaBR(value));
  const seletorRef = useRef<HTMLInputElement | null>(null);

  // Acompanha mudanças externas (limpar formulário, carregar dados).
  useEffect(() => {
    setTexto(dataISOparaBR(value));
  }, [value]);

  const handleChange = (valor: string) => {
    const mascarado = mascaraData(valor);
    setTexto(mascarado);
    onChange(dataBRparaISO(mascarado));
  };

  const abrirSeletor = () => {
    const el = seletorRef.current;
    if (!el) return;
    // showPicker precisa de gesto do usuário; o clique no botão serve.
    if (typeof el.showPicker === "function") {
      try {
        el.showPicker();
        return;
      } catch {
        // Safari antigo lança quando o input está escondido: cai no fallback.
      }
    }
    el.focus();
    el.click();
  };

  const hoje = new Date().toISOString().slice(0, 10);

  return (
    <div className={`relative ${className}`}>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder="dd/mm/aaaa"
        maxLength={10}
        value={texto}
        onChange={(e) => handleChange(e.target.value)}
        className="w-full rounded-xl border-[1.5px] border-black/[.12] bg-white px-4 py-3 pr-12 text-[15px] text-ink outline-none transition-colors placeholder:text-ink-2/60 focus:border-azul"
      />

      <button
        type="button"
        onClick={abrirSeletor}
        aria-label="Escolher data no calendário"
        className="absolute right-0 top-0 flex h-full w-12 items-center justify-center text-ink-3 transition-colors hover:text-azul"
      >
        <svg
          width="19"
          height="19"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
      </button>

      {/* Só existe para abrir o seletor nativo; nunca recebe foco por tab. */}
      <input
        ref={seletorRef}
        type="date"
        tabIndex={-1}
        aria-hidden="true"
        max={semFuturo ? hoje : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pointer-events-none absolute bottom-0 right-3 h-0 w-0 opacity-0"
      />
    </div>
  );
}
