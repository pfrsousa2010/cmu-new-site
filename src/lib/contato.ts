/** WhatsApp oficial do clube (mesmo número do rodapé e da página Doar). */
export const WHATSAPP_CLUBE = "554333256488";

export type MensagemContato = {
  nome: string;
  contato: string;
  mensagem: string;
};

/** Monta o texto pré-preenchido para o WhatsApp a partir do formulário. */
export function textoWhatsAppContato(dados: MensagemContato): string {
  const nome = dados.nome.trim();
  const contato = dados.contato.trim();
  const mensagem = dados.mensagem.trim();

  return [
    "Olá! Vim pelo formulário de contato do site.",
    "",
    `*Nome:* ${nome}`,
    `*E-mail ou telefone:* ${contato}`,
    "",
    "*Mensagem:*",
    mensagem,
  ].join("\n");
}

/** Link `wa.me` com a mensagem do formulário já preenchida. */
export function urlWhatsAppContato(dados: MensagemContato): string {
  const texto = textoWhatsAppContato(dados);
  return `https://wa.me/${WHATSAPP_CLUBE}?text=${encodeURIComponent(texto)}`;
}
