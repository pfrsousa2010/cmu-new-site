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
  // Cursos de percurso não entram na listagem pública.
  percurso_id?: string | null;
  parceiro_id?: string | null;
  parceiros?: { id: string; nome: string } | null;
}

export type StatusCurso =
  | "inscricoes"
  | "andamento"
  | "planejado"
  | "finalizado";

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
  finalizado: { label: "Finalizado", color: "#6b7280", className: "bg-ink-mid" },
};

/** Data local no formato YYYY-MM-DD. */
export function hojeISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Regra de status:
 * - finalizado: data fim anterior a hoje
 * - planejado / inscricoes / andamento: demais (andamento exige fim >= hoje)
 */
export function statusDe(c: CursoRow): StatusCurso {
  if (c.fim && c.fim < hojeISO()) return "finalizado";
  if (c.is_planejado) return "planejado";
  if (c.inscricoes_ativa) return "inscricoes";
  return "andamento";
}

export function isAtivoNoSite(c: CursoRow): boolean {
  return statusDe(c) !== "finalizado";
}

export function vagasRestantes(c: CursoRow): number {
  return Math.max((c.vagas ?? 0) - (c.qtd_alunos_iniciaram ?? 0), 0);
}

/** Retorna só o primeiro e o último nome (ex.: "Mary … Miné" → "Mary Miné"). */
export function nomeCurto(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length <= 2) return partes.join(" ");
  return `${partes[0]} ${partes[partes.length - 1]}`;
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
 * Busca os cursos ativos (não cancelados) do ano corrente,
 * excluindo cursos vinculados a percursos (`percurso_id`).
 * O filtro de visibilidade é aplicado em memória para funcionar mesmo
 * antes da coluna `visivel_site` existir.
 *
 * Deduplica chamadas concorrentes (ex.: React Strict Mode no dev)
 * para que só haja uma requisição HTTP em voo.
 */
let cursosInflight: Promise<CursoRow[]> | null = null;

export function fetchCursos(): Promise<CursoRow[]> {
  if (cursosInflight) return cursosInflight;

  const ano = new Date().getFullYear();
  const hoje = hojeISO();

  cursosInflight = (async () => {
    const { data, error } = await supabase
      .from("cursos")
      .select("*, parceiros(id, nome)")
      .eq("is_cancelado", false)
      .is("percurso_id", null)
      .gte("inicio", `${ano}-01-01`)
      .lte("inicio", `${ano}-12-31`)
      .gte("fim", hoje)
      .order("inicio", { ascending: true });

    if (error) {
      console.error("Erro ao buscar cursos:", error.message);
      return [];
    }
    return ((data ?? []) as CursoRow[]).filter((c) => !c.percurso_id);
  })().finally(() => {
    cursosInflight = null;
  });

  return cursosInflight;
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
