import { supabase } from "./supabase";

export type Periodo = "manha" | "tarde" | "noite";
export type DiaSemana = "seg" | "ter" | "qua" | "qui" | "sex" | "sab" | "dom";

/** Linha da tabela `cursos` (apenas os campos usados pelo site público/admin). */
export interface CursoRow {
  id: string;
  titulo: string;
  professor: string;
  inicio: string;
  fim: string;
  periodo: Periodo;
  dia_semana: DiaSemana[];
  vagas: number | null;
  qtd_alunos_iniciaram: number | null;
  carga_horaria: number | null;
  inscricoes_ativa: boolean;
  is_planejado: boolean;
  is_cancelado: boolean;
  imagem_url?: string | null;
  // Coluna nova (opcional até a migração rodar). undefined => visível.
  visivel_site?: boolean | null;
}

export type StatusCurso = "inscricoes" | "andamento" | "planejado";

export const DIAS_LABEL: Record<DiaSemana, string> = {
  seg: "Seg",
  ter: "Ter",
  qua: "Qua",
  qui: "Qui",
  sex: "Sex",
  sab: "Sáb",
  dom: "Dom",
};

export const PERIODOS_LABEL: Record<Periodo, string> = {
  manha: "Manhã",
  tarde: "Tarde",
  noite: "Noite",
};

export const STATUS_META: Record<
  StatusCurso,
  { label: string; color: string; className: string }
> = {
  inscricoes: { label: "Inscrições abertas", color: "#62b32e", className: "bg-verde" },
  andamento: { label: "Em andamento", color: "#2e6fb7", className: "bg-azul" },
  planejado: { label: "Em breve", color: "#ee7623", className: "bg-laranja" },
};

/** Regra de status: planejado > inscrições abertas > em andamento. */
export function statusDe(c: CursoRow): StatusCurso {
  if (c.is_planejado) return "planejado";
  if (c.inscricoes_ativa) return "inscricoes";
  return "andamento";
}

export function vagasRestantes(c: CursoRow): number {
  return Math.max((c.vagas ?? 0) - (c.qtd_alunos_iniciaram ?? 0), 0);
}

/** Formata "2026-08-03" como "03/08/26". */
export function fmtDataCurta(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y.slice(2)}`;
}

/** Formata "2026-08-03" como "03/08". */
export function fmtDiaMes(iso: string): string {
  if (!iso) return "";
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

/**
 * Busca os cursos ativos (não cancelados). O filtro de visibilidade é aplicado
 * em memória para funcionar mesmo antes da coluna `visivel_site` existir.
 */
export async function fetchCursos(): Promise<CursoRow[]> {
  const { data, error } = await supabase
    .from("cursos")
    .select("*")
    .eq("is_cancelado", false)
    .order("inicio", { ascending: true });

  if (error) {
    console.error("Erro ao buscar cursos:", error.message);
    return [];
  }
  return (data ?? []) as CursoRow[];
}

/** Visível no site público: coluna ausente/null/true => visível; só oculta quando false. */
export function isVisivel(c: CursoRow): boolean {
  return c.visivel_site !== false;
}

/** Todos os cursos não cancelados, para o painel admin (ignora visibilidade). */
export async function fetchCursosAdmin(): Promise<CursoRow[]> {
  const { data, error } = await supabase
    .from("cursos")
    .select("*")
    .eq("is_cancelado", false)
    .order("inicio", { ascending: true });
  if (error) {
    console.error("Erro ao buscar cursos (admin):", error.message);
    return [];
  }
  return (data ?? []) as CursoRow[];
}

export async function setInscricoesAtiva(id: string, ativa: boolean): Promise<void> {
  const { error } = await supabase
    .from("cursos")
    .update({ inscricoes_ativa: ativa })
    .eq("id", id);
  if (error) throw error;
}

export async function setVisivelSite(id: string, visivel: boolean): Promise<void> {
  const { error } = await supabase
    .from("cursos")
    .update({ visivel_site: visivel })
    .eq("id", id);
  if (error) throw error;
}
