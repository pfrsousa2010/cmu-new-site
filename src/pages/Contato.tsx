import { useState } from "react";
import { urlWhatsAppContato } from "@/lib/contato";

const CARDS = [
  {
    border: "border-l-azul",
    titulo: "Endereço",
    html: (
      <>
        R. Roseiral, 77 – Jd. Interlagos
        <br />
        86035-330 – Londrina/PR
      </>
    ),
  },
  {
    border: "border-l-verde",
    titulo: "Telefone / WhatsApp",
    html: "(43) 3325-6488",
  },
  {
    border: "border-l-laranja",
    titulo: "Redes sociais",
    html: (
      <>
        @clubedasmaesunidas
        <br />
        facebook.com/clubedasmaesunidas
      </>
    ),
  },
];

const inputCls =
  "w-full rounded-xl border-[1.5px] border-black/[.12] px-4 py-[13px] text-[15px] outline-none transition-colors focus:border-azul";

export default function Contato() {
  const [enviado, setEnviado] = useState(false);
  const [form, setForm] = useState({ nome: "", contato: "", mensagem: "" });

  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    const url = urlWhatsAppContato(form);
    window.open(url, "_blank", "noopener,noreferrer");
    setEnviado(true);
  };

  return (
    <div className="mx-auto max-w-[1000px] px-6 pb-20 pt-14">
      <h1 className="mb-3 font-display text-[42px] font-black">Contato</h1>
      <p className="m-0 mb-10 text-[17px] text-ink-2">
        Fale com a gente — teremos prazer em atender você.
      </p>

      <div className="grid grid-cols-1 gap-7 md:grid-cols-[1fr_1.2fr]">
        <div className="grid content-start gap-3.5">
          {CARDS.map((c) => (
            <div
              key={c.titulo}
              className={`rounded-2xl border-l-[5px] ${c.border} bg-white px-6 py-5`}
            >
              <div className="mb-1 font-display font-extrabold">{c.titulo}</div>
              <div className="text-[14.5px] leading-[1.5] text-ink-2">
                {c.html}
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-card border border-black/[.07] bg-white p-[30px]">
          {enviado ? (
            <div className="px-5 py-[60px] text-center">
              <div className="mb-3 text-[44px]">✓</div>
              <div className="font-display text-[22px] font-extrabold text-verde">
                WhatsApp aberto!
              </div>
              <div className="mt-2 text-[14.5px] text-ink-2">
                Confirme o envio da mensagem no WhatsApp. Se a janela não
                abriu, verifique se o bloqueador de pop-ups está ativo.
              </div>
              <button
                type="button"
                onClick={() => {
                  window.open(
                    urlWhatsAppContato(form),
                    "_blank",
                    "noopener,noreferrer"
                  );
                }}
                className="mt-5 rounded-xl bg-azul px-4 py-[11px] font-display text-[15px] font-extrabold text-white transition-colors hover:bg-azul-hover"
              >
                Abrir WhatsApp de novo
              </button>
            </div>
          ) : (
            <form onSubmit={enviar} className="grid gap-3.5">
              <input
                required
                name="nome"
                placeholder="Seu nome"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                className={inputCls}
              />
              <input
                required
                name="contato"
                placeholder="Seu e-mail ou telefone"
                value={form.contato}
                onChange={(e) => setForm({ ...form, contato: e.target.value })}
                className={inputCls}
              />
              <textarea
                required
                name="mensagem"
                placeholder="Sua mensagem"
                rows={5}
                value={form.mensagem}
                onChange={(e) => setForm({ ...form, mensagem: e.target.value })}
                className={`${inputCls} resize-y`}
              />
              <button
                type="submit"
                className="rounded-xl bg-azul px-3 py-[13px] text-center font-display text-base font-extrabold text-white transition-colors hover:bg-azul-hover"
              >
                Enviar pelo WhatsApp
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
