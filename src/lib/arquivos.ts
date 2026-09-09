import { supabase, BUCKET_ARQUIVOS, publicUrl } from "./supabase";

export type CategoriaArquivo =
  | "compra"
  | "servicos"
  | "seletivo"
  | "transparencia"
  | "outros";

export interface ArquivoRow {
  id: string;
  nome: string;
  categoria: CategoriaArquivo;
  storage_path: string;
  mime: string | null;
  tamanho_bytes: number | null;
  publicado_em: string;
  /** Só relevante para editais (compra/servicos/seletivo). undefined/false => Aberto. */
  encerrado?: boolean | null;
  /** Agrupamento na página Transparência. undefined => "institucionais". */
  subcategoria?: SubcatTransparencia | null;
  /** Controla se aparece no site público. */
  visivel_site?: boolean | null;
  /** Mês de competência (1–12). Usado em convênios/aditivos. */
  competencia_mes?: number | null;
  /** Ano de competência. Usado em convênios/aditivos. */
  competencia_ano?: number | null;
  /** Convênio pai quando o arquivo é um aditivo. */
  arquivo_pai_id?: string | null;
}

export type SubcatTransparencia =
  | "institucionais"
  | "convenios"
  | "plano"
  | "relatorios";

export const SUBCAT_TRANSP: { key: SubcatTransparencia; label: string; cor: string }[] = [
  { key: "institucionais", label: "Documentos institucionais", cor: "bg-azul" },
  { key: "convenios", label: "Convênios", cor: "bg-verde" },
  { key: "plano", label: "Plano de trabalho", cor: "bg-laranja" },
  { key: "relatorios", label: "Relatório de atividades", cor: "bg-vermelho" },
];

export const CATEGORIA_LABEL: Record<CategoriaArquivo, string> = {
  compra: "Editais de compra",
  servicos: "Prestação de serviços",
  seletivo: "Processo seletivo",
  transparencia: "Transparência",
  outros: "Outros",
};

const MESES_ABREV = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
] as const;

export const MESES_LABEL: { value: number; label: string }[] = [
  { value: 1, label: "Janeiro" },
  { value: 2, label: "Fevereiro" },
  { value: 3, label: "Março" },
  { value: 4, label: "Abril" },
  { value: 5, label: "Maio" },
  { value: 6, label: "Junho" },
  { value: 7, label: "Julho" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Setembro" },
  { value: 10, label: "Outubro" },
  { value: 11, label: "Novembro" },
  { value: 12, label: "Dezembro" },
];

export function isArquivoVisivel(a: ArquivoRow): boolean {
  return a.visivel_site !== false;
}

export function fmtTamanho(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}

export function fmtDataPublicacao(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR");
}

/** Formata competência como "mar/2025". Vazio se mês/ano inválidos. */
export function fmtCompetencia(
  mes: number | null | undefined,
  ano: number | null | undefined
): string {
  if (!mes || !ano || mes < 1 || mes > 12) return "";
  return `${MESES_ABREV[mes - 1]}/${ano}`;
}

export function ehConvenio(a: ArquivoRow): boolean {
  return a.subcategoria === "convenios" && !a.arquivo_pai_id;
}

export function ehAditivo(a: ArquivoRow): boolean {
  return a.subcategoria === "convenios" && Boolean(a.arquivo_pai_id);
}

function chaveCompetencia(a: ArquivoRow): number {
  const ano = a.competencia_ano ?? 0;
  const mes = a.competencia_mes ?? 0;
  return ano * 100 + mes;
}

export interface ConvenioComAditivos {
  convenio: ArquivoRow;
  aditivos: ArquivoRow[];
}

export interface AnoConvenios {
  /** Ano numérico, ou null para "Sem data". */
  ano: number | null;
  label: string;
  itens: ConvenioComAditivos[];
}

/**
 * Agrupa documentos de convênios por ano do convênio-pai.
 * Aditivos ficam aninhados sob o pai (mesmo se tiverem outro mês/ano).
 * Anos em ordem desc; "Sem data" no fim.
 */
export function agruparConveniosPorAno(docs: ArquivoRow[]): AnoConvenios[] {
  const convenios = docs.filter(ehConvenio);
  const aditivos = docs.filter(ehAditivo);

  const porPai = new Map<string, ArquivoRow[]>();
  for (const a of aditivos) {
    const pai = a.arquivo_pai_id!;
    const lista = porPai.get(pai) ?? [];
    lista.push(a);
    porPai.set(pai, lista);
  }

  const ordenarAditivos = (lista: ArquivoRow[]) =>
    [...lista].sort((x, y) => chaveCompetencia(y) - chaveCompetencia(x));

  const porAno = new Map<number | "sem", ConvenioComAditivos[]>();
  for (const c of convenios) {
    const chave: number | "sem" =
      c.competencia_ano != null ? c.competencia_ano : "sem";
    const lista = porAno.get(chave) ?? [];
    lista.push({
      convenio: c,
      aditivos: ordenarAditivos(porPai.get(c.id) ?? []),
    });
    porAno.set(chave, lista);
  }

  // Aditivos órfãos (pai ausente/oculto): viram entradas soltas sob o ano do aditivo.
  const paisPresentes = new Set(convenios.map((c) => c.id));
  for (const a of aditivos) {
    if (paisPresentes.has(a.arquivo_pai_id!)) continue;
    const chave: number | "sem" =
      a.competencia_ano != null ? a.competencia_ano : "sem";
    const lista = porAno.get(chave) ?? [];
    lista.push({ convenio: a, aditivos: [] });
    porAno.set(chave, lista);
  }

  const ordenarItens = (itens: ConvenioComAditivos[]) =>
    [...itens].sort(
      (x, y) => chaveCompetencia(y.convenio) - chaveCompetencia(x.convenio)
    );

  const anosNumericos = [...porAno.keys()]
    .filter((k): k is number => k !== "sem")
    .sort((a, b) => b - a);

  const resultado: AnoConvenios[] = anosNumericos.map((ano) => ({
    ano,
    label: String(ano),
    itens: ordenarItens(porAno.get(ano) ?? []),
  }));

  if (porAno.has("sem")) {
    resultado.push({
      ano: null,
      label: "Sem data",
      itens: ordenarItens(porAno.get("sem") ?? []),
    });
  }

  return resultado;
}

/** Anos disponíveis no seletor de competência (atual ± 5, e um pouco atrás). */
export function anosCompetencia(): number[] {
  const atual = new Date().getFullYear();
  const anos: number[] = [];
  for (let y = atual + 1; y >= atual - 15; y--) anos.push(y);
  return anos;
}

export function tipoArquivo(mime: string | null, nome: string): string {
  if (mime?.includes("pdf") || nome.toLowerCase().endsWith(".pdf")) return "PDF";
  if (mime?.includes("word") || /\.docx?$/i.test(nome)) return "DOC";
  if (mime?.includes("sheet") || /\.xlsx?$/i.test(nome)) return "XLS";
  if (mime?.startsWith("image/")) return "IMG";
  return "DOC";
}

export function urlArquivo(a: ArquivoRow): string {
  return publicUrl(BUCKET_ARQUIVOS, a.storage_path);
}

/** Arquivos visíveis no site público. */
export async function fetchArquivos(): Promise<ArquivoRow[]> {
  const { data, error } = await supabase
    .from("site_arquivos")
    .select("*")
    .order("publicado_em", { ascending: false });

  if (error) {
    console.error("Erro ao buscar arquivos:", error.message);
    return [];
  }
  return ((data ?? []) as ArquivoRow[]).filter(isArquivoVisivel);
}

/** Todos os arquivos (painel admin). */
export async function fetchArquivosAdmin(): Promise<ArquivoRow[]> {
  const { data, error } = await supabase
    .from("site_arquivos")
    .select("*")
    .order("publicado_em", { ascending: false });

  if (error) {
    console.error("Erro ao buscar arquivos (admin):", error.message);
    return [];
  }
  return (data ?? []) as ArquivoRow[];
}

export async function setArquivoVisivel(
  id: string,
  visivel: boolean
): Promise<void> {
  const { error } = await supabase
    .from("site_arquivos")
    .update({ visivel_site: visivel })
    .eq("id", id);
  if (error) throw error;
}

export async function setArquivoEncerrado(
  id: string,
  encerrado: boolean
): Promise<void> {
  const { error } = await supabase
    .from("site_arquivos")
    .update({ encerrado })
    .eq("id", id);
  if (error) throw error;
}

/** Categorias de edital que exibem badge Aberto/Encerrado. */
export function ehCategoriaEdital(cat: CategoriaArquivo): boolean {
  return cat === "compra" || cat === "servicos" || cat === "seletivo";
}

export interface ArquivoUpload {
  nome: string;
  categoria: CategoriaArquivo;
  subcategoria?: SubcatTransparencia | null;
  file: File;
  competencia_mes?: number | null;
  competencia_ano?: number | null;
  arquivo_pai_id?: string | null;
}

/** Faz upload do arquivo para o Storage e cria o registro. */
export async function publicarArquivo(input: ArquivoUpload): Promise<void> {
  const ext = input.file.name.split(".").pop() || "bin";
  const safe = input.file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const path = `${input.categoria}/${Date.now()}-${safe}`;
  const up = await supabase.storage
    .from(BUCKET_ARQUIVOS)
    .upload(path, input.file, { upsert: false, contentType: input.file.type });
  if (up.error) throw up.error;

  const ehConvenios =
    input.categoria === "transparencia" && input.subcategoria === "convenios";

  const { error } = await supabase.from("site_arquivos").insert({
    nome: input.nome || input.file.name,
    categoria: input.categoria,
    subcategoria:
      input.categoria === "transparencia"
        ? input.subcategoria ?? "institucionais"
        : null,
    storage_path: path,
    mime: input.file.type || `application/${ext}`,
    tamanho_bytes: input.file.size,
    visivel_site: true,
    competencia_mes: ehConvenios ? input.competencia_mes ?? null : null,
    competencia_ano: ehConvenios ? input.competencia_ano ?? null : null,
    arquivo_pai_id: ehConvenios ? input.arquivo_pai_id ?? null : null,
  });
  if (error) {
    // Não deixa objeto órfão no bucket quando o insert falha.
    await supabase.storage.from(BUCKET_ARQUIVOS).remove([path]);
    throw error;
  }
}

export async function removerArquivo(a: ArquivoRow): Promise<void> {
  const paths = [a.storage_path];

  // Cascade no banco remove aditivos; limpa os objetos filhos no Storage antes.
  if (ehConvenio(a)) {
    const { data: filhos } = await supabase
      .from("site_arquivos")
      .select("storage_path")
      .eq("arquivo_pai_id", a.id);
    for (const f of filhos ?? []) {
      if (f.storage_path) paths.push(f.storage_path as string);
    }
  }

  await supabase.storage.from(BUCKET_ARQUIVOS).remove(paths);
  const { error } = await supabase.from("site_arquivos").delete().eq("id", a.id);
  if (error) throw error;
}
