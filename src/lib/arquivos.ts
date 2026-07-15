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

export async function fetchArquivos(): Promise<ArquivoRow[]> {
  const { data, error } = await supabase
    .from("site_arquivos")
    .select("*")
    .order("publicado_em", { ascending: false });

  if (error) {
    console.error("Erro ao buscar arquivos:", error.message);
    return [];
  }
  return (data ?? []) as ArquivoRow[];
}

export interface ArquivoUpload {
  nome: string;
  categoria: CategoriaArquivo;
  subcategoria?: SubcatTransparencia | null;
  file: File;
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
  });
  if (error) throw error;
}

export async function removerArquivo(a: ArquivoRow): Promise<void> {
  await supabase.storage.from(BUCKET_ARQUIVOS).remove([a.storage_path]);
  const { error } = await supabase.from("site_arquivos").delete().eq("id", a.id);
  if (error) throw error;
}
