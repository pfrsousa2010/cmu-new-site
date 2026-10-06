/**
 * SEO do site público: título, descrição e URL canônica de cada página.
 *
 * O Google executa o JavaScript antes de indexar, então trocar as metas no
 * `document` a cada rota basta para ele. O `index.html` traz os valores da
 * home, que é o que robôs sem JavaScript (WhatsApp, Facebook) enxergam em
 * qualquer link.
 *
 * Este arquivo também é importado pelo `vite.config.ts` para gerar o
 * `sitemap.xml` no build — por isso não pode importar nada do navegador
 * nem do Supabase no topo.
 */

/** Domínio principal. O `www` redireciona (301) para este na Netlify. */
export const SITE_URL = "https://clubedasmaesunidas.org.br";

export const SITE_NOME = "Clube das Mães Unidas";

export type PaginaSeo = {
  titulo: string;
  descricao: string;
};

/** Páginas indexáveis. A ordem é a do sitemap. */
export const PAGINAS_SEO: Record<string, PaginaSeo> = {
  "/": {
    titulo: `${SITE_NOME} — Capacitando para um mundo melhor`,
    descricao:
      "ONG de Londrina/PR que capacita jovens e adultos para o mercado de trabalho por meio de cursos gratuitos e inclusão social.",
  },
  "/sobre": {
    titulo: "Sobre nós",
    descricao:
      "Há mais de três décadas em Londrina/PR, o Clube das Mães Unidas capacita jovens e adultos para o mercado de trabalho e promove a inclusão social.",
  },
  "/projetos": {
    titulo: "Projetos",
    descricao:
      "Serviço de Convivência e Fortalecimento de Vínculos (SCFV) e Educação Socioprofissional: os projetos do Clube das Mães Unidas em Londrina/PR.",
  },
  "/atividades": {
    titulo: "Atividades",
    descricao:
      "Cursos, eventos e oficinas gratuitos do Clube das Mães Unidas em Londrina/PR. Veja o que está com inscrição aberta e inscreva-se pelo site.",
  },
  "/atividades/cursos": {
    titulo: "Cursos gratuitos",
    descricao:
      "Cursos profissionalizantes gratuitos em Londrina/PR. Veja as turmas com inscrições abertas no Clube das Mães Unidas e faça sua pré-inscrição.",
  },
  "/atividades/eventos": {
    titulo: "Eventos com inscrição",
    descricao:
      "Palestras e ações comunitárias gratuitas do Clube das Mães Unidas em Londrina/PR. Inscreva-se pelo site.",
  },
  "/atividades/oficinas": {
    titulo: "Oficinas gratuitas",
    descricao:
      "Oficinas práticas e gratuitas do Clube das Mães Unidas em Londrina/PR. Veja as inscrições abertas.",
  },
  "/parceiros": {
    titulo: "Parceiros",
    descricao:
      "Empresas e instituições que apoiam o trabalho do Clube das Mães Unidas em Londrina/PR.",
  },
  "/editais": {
    titulo: "Editais",
    descricao:
      "Editais, chamamentos e processos seletivos publicados pelo Clube das Mães Unidas.",
  },
  "/transparencia": {
    titulo: "Transparência",
    descricao:
      "Prestação de contas, relatórios e documentos institucionais do Clube das Mães Unidas.",
  },
  "/doar": {
    titulo: "Doe agora",
    descricao:
      "Apoie o Clube das Mães Unidas: doe por PIX ou transferência e ajude a oferecer cursos gratuitos em Londrina/PR.",
  },
  "/contato": {
    titulo: "Contato",
    descricao:
      "Fale com o Clube das Mães Unidas: R. Roseiral, 77 – Jd. Interlagos, Londrina/PR. Telefone e WhatsApp (43) 3325-6488.",
  },
};

/** Título final da aba: a home já vem completa, as demais ganham o nome do clube. */
export function tituloCompleto(caminho: string, titulo: string): string {
  return caminho === "/" ? titulo : `${titulo} | ${SITE_NOME}`;
}

function setMeta(atributo: "name" | "property", chave: string, valor: string) {
  let el = document.head.querySelector<HTMLMetaElement>(
    `meta[${atributo}="${chave}"]`
  );
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(atributo, chave);
    document.head.appendChild(el);
  }
  el.content = valor;
}

function setCanonical(url: string | null) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!url) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement("link");
    el.rel = "canonical";
    document.head.appendChild(el);
  }
  el.href = url;
}

/**
 * Aplica as metas da rota atual. Rotas fora de `PAGINAS_SEO` (a inscrição
 * de cada atividade) recebem `noindex`: são formulários de turmas que fecham,
 * e quem deve aparecer na busca são as páginas de /atividades.
 */
export function aplicarSeo(caminho: string) {
  const pagina = PAGINAS_SEO[caminho];
  const base = PAGINAS_SEO["/"];
  const titulo = pagina ? tituloCompleto(caminho, pagina.titulo) : document.title;
  const descricao = (pagina ?? base).descricao;
  const url = pagina ? `${SITE_URL}${caminho === "/" ? "/" : caminho}` : null;

  document.title = titulo;
  setMeta("name", "description", descricao);
  setMeta("name", "robots", pagina ? "index, follow" : "noindex, follow");
  setCanonical(url);

  setMeta("property", "og:title", titulo);
  setMeta("property", "og:description", descricao);
  if (url) setMeta("property", "og:url", url);
}

/** Usado pela inscrição, que só sabe o nome do curso depois do fetch. */
export function setTituloPagina(titulo: string) {
  document.title = `${titulo} | ${SITE_NOME}`;
  setMeta("property", "og:title", document.title);
}

/** Conteúdo do sitemap.xml, gerado no build a partir de `PAGINAS_SEO`. */
export function montarSitemap(): string {
  const urls = Object.keys(PAGINAS_SEO)
    .map(
      (caminho) =>
        `  <url>\n    <loc>${SITE_URL}${caminho}</loc>\n  </url>`
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}
