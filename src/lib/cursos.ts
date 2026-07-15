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
  /** Pode vir como "seg" ou "segunda", conforme o gestor. */
  dia_semana: string[];
  vagas: number | null;
  qtd_alunos_iniciaram: number | null;
  /** Contagem de linhas em `inscricoes` com status `inscrito` (preenchida no fetch público). */
  qtd_inscritos?: number | null;
  /** Compat: alguns selects antigos; use carga_horaria_total. */
  carga_horaria?: number | null;
  carga_horaria_total?: number | null;
  carga_horaria_diaria?: number | null;
  objetivo_curso?: string | null;
  horario_aula_inicio?: string | null;
  horario_aula_fim?: string | null;
  data_selecao?: string | null;
  horario_atendimento_inicio?: string | null;
  unidade_id?: string | null;
  atendimento_unidade_id?: string | null;
  inscricoes_ativa: boolean;
  inscricoes_inicio?: string | null;
  inscricoes_fim?: string | null;
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

export type UnidadeResumo = { nome?: string | null; endereco?: string | null };

/** Dados do material de divulgação (modal de inscrição). */
export interface CursoDivulgacao {
  id: string;
  titulo: string;
  inicio: string;
  fim: string;
  vagas: number | null;
  periodo: Periodo;
  dia_semana: string[];
  objetivo_curso: string | null;
  carga_horaria_total: number | null;
  carga_horaria_diaria: number | null;
  horario_aula_inicio: string | null;
  horario_aula_fim: string | null;
  data_selecao: string | null;
  horario_atendimento_inicio: string | null;
  inscricoes_inicio: string | null;
  inscricoes_fim: string | null;
  conteudos: string[];
  criterios: string[];
  localAula: UnidadeResumo;
  localAtendimento: UnidadeResumo;
}

export const INSCRICAO_PUBLICA_BASE =
  "https://cursos.clubedasmaesunidas.org.br/inscricao/curso";

export function urlInscricaoPublica(cursoId: string): string {
  return `${INSCRICAO_PUBLICA_BASE}/${cursoId}`;
}

export type StatusCurso =
  | "inscricoes"
  | "andamento"
  | "planejado"
  | "finalizado";

export const DIAS_LABEL: Record<string, string> = {
  seg: "Seg",
  ter: "Ter",
  qua: "Qua",
  qui: "Qui",
  sex: "Sex",
  sab: "Sáb",
  dom: "Dom",
  segunda: "Segunda",
  terca: "Terça",
  quarta: "Quarta",
  quinta: "Quinta",
  sexta: "Sexta",
  sabado: "Sábado",
  domingo: "Domingo",
};

/** Formata dias como no material de divulgação (ex.: "2ª a 6ª feira"). */
export function formatDiasSemana(dias?: string[] | null): string {
  if (!dias || dias.length === 0) return "";
  const map: Record<string, string> = {
    segunda: "2ª",
    terca: "3ª",
    quarta: "4ª",
    quinta: "5ª",
    sexta: "6ª",
    sabado: "Sábado",
    domingo: "Domingo",
    seg: "2ª",
    ter: "3ª",
    qua: "4ª",
    qui: "5ª",
    sex: "6ª",
    sab: "Sábado",
    dom: "Domingo",
  };
  const uteis = ["segunda", "terca", "quarta", "quinta", "sexta"];
  const norm = dias.map((d) => d.toLowerCase());
  if (uteis.every((d) => norm.includes(d))) return "2ª a 6ª feira";
  const labels = dias.map((d) => map[d] || DIAS_LABEL[d] || d);
  if (labels.length === 1) return `${labels[0]} feira`;
  if (labels.length === 2) return `${labels[0]} e ${labels[1]} feira`;
  return `${labels.slice(0, -1).join(", ")} e ${labels[labels.length - 1]} feira`;
}

export function sliceHhmm(value?: string | null): string | null {
  if (!value) return null;
  return String(value).slice(0, 5);
}

export function formatLocalUnidade(u?: UnidadeResumo | null): string {
  const nome = (u?.nome || "").trim();
  const endereco = (u?.endereco || "").trim();
  if (nome && endereco) return `${nome} — ${endereco}`;
  return nome || endereco || "Não informado";
}

export function formatCargaHoraria(
  total?: number | null,
  diaria?: number | null
): string {
  const t = total != null ? Number(total) : null;
  if (t == null || t <= 0) return "";
  let text = `${t}h`;
  const d = diaria != null ? Number(diaria) : null;
  if (d != null && d > 0) {
    const aulas = Math.round(t / d);
    if (aulas > 0) text += ` · ${aulas} aulas`;
  }
  return text;
}

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
 * Inscrições abertas: agora está entre inscricoes_inicio e inscricoes_fim
 * (timestamps com horário). Depois de inscricoes_fim, deixa de ser "abertas".
 */
export function inscricoesAbertas(c: CursoRow): boolean {
  if (!c.inscricoes_inicio || !c.inscricoes_fim) return false;
  const agora = Date.now();
  const ini = new Date(c.inscricoes_inicio).getTime();
  const fim = new Date(c.inscricoes_fim).getTime();
  if (Number.isNaN(ini) || Number.isNaN(fim)) return false;
  return agora >= ini && agora <= fim;
}

/**
 * Regra de status (só cursos com is_planejado = false entram no site):
 * - finalizado: data fim do curso anterior a hoje
 * - inscricoes: período configurado e vigente + toggle inscricoes_ativa
 * - planejado (Em breve): data inicio do curso posterior a hoje
 * - andamento: demais
 *
 * Curso "Em breve" com janela de inscrição vigente só vira "Inscrições abertas"
 * se o toggle estiver ligado; caso contrário permanece "Em breve".
 */
export function statusDe(c: CursoRow): StatusCurso {
  if (c.fim && c.fim < hojeISO()) return "finalizado";
  if (c.inscricoes_ativa && inscricoesAbertas(c)) return "inscricoes";
  if (c.inicio && c.inicio > hojeISO()) return "planejado";
  return "andamento";
}

export function isAtivoNoSite(c: CursoRow): boolean {
  return statusDe(c) !== "finalizado";
}

export function vagasRestantes(c: CursoRow): number {
  // Preferência: inscritos na fase de inscrição (tabela inscricoes).
  // Fallback: alunos que já iniciaram o curso (campo legado).
  const ocupadas = c.qtd_inscritos ?? c.qtd_alunos_iniciaram ?? 0;
  return Math.max((c.vagas ?? 0) - ocupadas, 0);
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

/** Formata timestamp ISO como "16/07/26 às 13:00" (hora local). */
export function fmtDataHora(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  const data = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${String(d.getFullYear()).slice(2)}`;
  const hora = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return `${data} às ${hora}`;
}

/** Formata "2026-08-03" como "03/08". */
export function fmtDiaMes(iso: string): string {
  if (!iso) return "";
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

/**
 * Busca os cursos ativos (não cancelados) do ano corrente,
 * excluindo percursos e cursos ainda planejados (`is_planejado` — não aprovados).
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
      .eq("is_planejado", false)
      .is("percurso_id", null)
      .gte("inicio", `${ano}-01-01`)
      .lte("inicio", `${ano}-12-31`)
      .gte("fim", hoje)
      .order("inicio", { ascending: true });

    if (error) {
      console.error("Erro ao buscar cursos:", error.message);
      return [];
    }

    const rows = ((data ?? []) as CursoRow[]).filter(
      (c) => !c.percurso_id && !c.is_planejado
    );

    if (rows.length === 0) return rows;

    const ids = rows.map((c) => c.id);
    const { data: inscritos, error: inscError } = await supabase
      .from("inscricoes")
      .select("curso_id")
      .eq("status", "inscrito")
      .in("curso_id", ids);

    if (inscError) {
      console.error("Erro ao contar inscritos:", inscError.message);
      return rows.map((c) => ({ ...c, qtd_inscritos: 0 }));
    }

    const counts = new Map<string, number>();
    for (const row of inscritos ?? []) {
      const id = (row as { curso_id: string }).curso_id;
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }

    return rows.map((c) => ({
      ...c,
      qtd_inscritos: counts.get(c.id) ?? 0,
    }));
  })().finally(() => {
    cursosInflight = null;
  });

  return cursosInflight;
}

/** Visível no site público: coluna ausente/null/true => visível; só oculta quando false. */
export function isVisivel(c: CursoRow): boolean {
  return c.visivel_site !== false;
}

/** Detalhes usados na modal de inscrição (mesmo conteúdo do material de divulgação). */
export async function fetchCursoDivulgacao(
  cursoId: string
): Promise<CursoDivulgacao | null> {
  const { data, error } = await supabase
    .from("cursos")
    .select(
      `
      id, titulo, inicio, fim, vagas, periodo, dia_semana,
      objetivo_curso, carga_horaria_total, carga_horaria_diaria,
      horario_aula_inicio, horario_aula_fim, data_selecao,
      horario_atendimento_inicio, inscricoes_inicio, inscricoes_fim,
      unidade_id, atendimento_unidade_id,
      unidades:unidade_id(nome, endereco)
    `
    )
    .eq("id", cursoId)
    .maybeSingle();

  if (error) {
    console.error("Erro ao buscar divulgação do curso:", error.message);
    return null;
  }
  if (!data) return null;

  const row = data as any;
  const unidadeAula: UnidadeResumo = row.unidades ?? {};
  let localAtendimento: UnidadeResumo = unidadeAula;

  if (
    row.atendimento_unidade_id &&
    row.atendimento_unidade_id !== row.unidade_id
  ) {
    const { data: und } = await supabase
      .from("unidades")
      .select("nome, endereco")
      .eq("id", row.atendimento_unidade_id)
      .maybeSingle();
    if (und) localAtendimento = und;
  }

  const [{ data: prereqs }, { data: cursoConteudos, error: conteudosError }] =
    await Promise.all([
      supabase
        .from("pre_requisitos_atividade")
        .select("descricao, ordem")
        .eq("curso_id", cursoId)
        .order("ordem", { ascending: true }),
      supabase
        .from("curso_conteudos")
        .select("conteudo_id, conteudos(nome)")
        .eq("curso_id", cursoId),
    ]);

  if (conteudosError) {
    console.error("Erro ao buscar conteúdos do curso:", conteudosError.message);
  }

  const conteudos = ((cursoConteudos ?? []) as any[])
    .map((cc) => String(cc?.conteudos?.nome || "").trim())
    .filter(Boolean);

  const criterios = (prereqs ?? [])
    .map((p: any) => String(p.descricao || "").trim())
    .filter(Boolean);

  return {
    id: row.id,
    titulo: row.titulo,
    inicio: row.inicio,
    fim: row.fim,
    vagas: row.vagas,
    periodo: row.periodo,
    dia_semana: row.dia_semana ?? [],
    objetivo_curso: row.objetivo_curso ?? null,
    carga_horaria_total: row.carga_horaria_total ?? null,
    carga_horaria_diaria: row.carga_horaria_diaria ?? null,
    horario_aula_inicio: row.horario_aula_inicio ?? null,
    horario_aula_fim: row.horario_aula_fim ?? null,
    data_selecao: row.data_selecao ?? null,
    horario_atendimento_inicio: row.horario_atendimento_inicio ?? null,
    inscricoes_inicio: row.inscricoes_inicio ?? null,
    inscricoes_fim: row.inscricoes_fim ?? null,
    conteudos,
    criterios,
    localAula: unidadeAula,
    localAtendimento,
  };
}

/**
 * Cursos do painel admin com as mesmas regras de listagem do site:
 * não cancelados, não planejados, sem percurso, ano corrente e não finalizados.
 * Inclui nome do parceiro quando houver.
 */
export async function fetchCursosAdmin(): Promise<CursoRow[]> {
  const ano = new Date().getFullYear();
  const hoje = hojeISO();
  const { data, error } = await supabase
    .from("cursos")
    .select("*, parceiros(id, nome)")
    .eq("is_cancelado", false)
    .eq("is_planejado", false)
    .is("percurso_id", null)
    .gte("inicio", `${ano}-01-01`)
    .lte("inicio", `${ano}-12-31`)
    .gte("fim", hoje)
    .order("inicio", { ascending: true });
  if (error) {
    console.error("Erro ao buscar cursos (admin):", error.message);
    return [];
  }
  return ((data ?? []) as CursoRow[]).filter(
    (c) => !c.percurso_id && !c.is_planejado
  );
}

/** Toggle de inscrição só se o período estiver configurado e ainda não encerrado. */
export function podeAlternarInscricoes(c: CursoRow): boolean {
  if (!c.inscricoes_inicio || !c.inscricoes_fim) return false;
  const fim = new Date(c.inscricoes_fim).getTime();
  if (Number.isNaN(fim)) return false;
  return Date.now() <= fim;
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
