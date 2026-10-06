/**
 * Cursos, eventos e oficinas do SGE na página **Atividades**.
 *
 * Evento e oficina ganharam inscrição em 10/2026 (spec `spec-paineis-eventos-oficinas.md`
 * no repo do SGE): mesma ficha, mesma regra de vagas, mesma chave `visivel_site` do curso.
 * O que muda é a tabela, a coluna de vínculo em `inscricoes` e alguns nomes de coluna — e
 * isso fica aqui, para as telas não espalharem `if (tipo === "evento")`.
 *
 * Não confundir com `eventos.ts`: aquele é a agenda/galeria do próprio site
 * (`site_eventos`), editada no admin, e a página `/eventos` continua sendo dela.
 */

import { supabase } from "./supabase";
import type { CursoRow } from "./cursos";

export type TipoAtividade = "curso" | "evento" | "oficina";

/** Segmento da URL: `/atividades/cursos`, `/atividades/eventos`, `/atividades/oficinas`. */
export const SLUG_TIPO: Record<TipoAtividade, string> = {
  curso: "cursos",
  evento: "eventos",
  oficina: "oficinas",
};

export function tipoDoSlug(slug?: string | null): TipoAtividade | null {
  if (slug === "cursos") return "curso";
  if (slug === "eventos") return "evento";
  if (slug === "oficinas") return "oficina";
  return null;
}

export const ROTULO_TIPO: Record<TipoAtividade, { singular: string; plural: string }> = {
  curso: { singular: "Curso", plural: "Cursos" },
  evento: { singular: "Evento", plural: "Eventos" },
  oficina: { singular: "Oficina", plural: "Oficinas" },
};

/** "do curso", "do evento", "da oficina". */
export const DO_TIPO: Record<TipoAtividade, string> = {
  curso: "do curso",
  evento: "do evento",
  oficina: "da oficina",
};

/** "neste curso", "neste evento", "nesta oficina". */
export const NESTE_TIPO: Record<TipoAtividade, string> = {
  curso: "neste curso",
  evento: "neste evento",
  oficina: "nesta oficina",
};

export const TABELA_TIPO: Record<TipoAtividade, string> = {
  curso: "cursos",
  evento: "eventos",
  oficina: "oficinas",
};

/** Coluna de vínculo em `inscricoes` e `pre_requisitos_atividade`. */
export const FK_TIPO: Record<TipoAtividade, string> = {
  curso: "curso_id",
  evento: "evento_id",
  oficina: "oficina_id",
};

/** Índice único de CPF por atividade — aparece na mensagem de erro do Postgres. */
export const INDICE_CPF_TIPO: Record<TipoAtividade, string> = {
  curso: "idx_inscricoes_unique_cpf_curso",
  evento: "idx_inscricoes_unique_cpf_evento",
  oficina: "idx_inscricoes_unique_cpf_oficina",
};

export function urlInscricaoSite(tipo: TipoAtividade, id: string): string {
  return `/atividades/${SLUG_TIPO[tipo]}/${id}/inscricao`;
}

/**
 * Colunas que a chave anon pode ler de evento/oficina. O SGE libera só estas por coluna
 * (observação e motivo de cancelamento ficam fechados), então `select("*")` dá erro.
 */
export const COLUNAS_EVENTO =
  "id, titulo, professor, parceiro_id, unidade_id, sala_id, local_manual, inicio, fim, dia_semana, periodo, vagas, carga_horaria, is_planejado, is_cancelado, percurso_id, visivel_site, inscricoes_inicio, inscricoes_fim, max_inscricoes, aceita_menores_18, imagem_url, horario_inicio, horario_fim, objetivo";

export const COLUNAS_OFICINA =
  "id, titulo, professor, parceiro_id, unidade_id, sala_id, inicio, fim, dia_semana, periodo, vagas, carga_horaria_total, carga_horaria_diaria, conteudo, is_planejado, is_cancelado, percurso_id, visivel_site, inscricoes_inicio, inscricoes_fim, max_inscricoes, aceita_menores_18, imagem_url, horario_inicio, horario_fim, objetivo";

/**
 * Linha de evento/oficina traduzida para o formato de `CursoRow`, para o card, a modal e o
 * formulário servirem aos três: horário vira `horario_aula_*`, objetivo vira
 * `objetivo_curso`, a CH do evento vira `carga_horaria_total`.
 */
export function comoCursoRow(tipo: Exclude<TipoAtividade, "curso">, row: Record<string, any>): CursoRow {
  return {
    ...row,
    tipo,
    professor: row.professor ?? "",
    carga_horaria_total: tipo === "evento" ? row.carga_horaria ?? null : row.carga_horaria_total ?? null,
    carga_horaria_diaria: tipo === "oficina" ? row.carga_horaria_diaria ?? null : null,
    horario_aula_inicio: row.horario_inicio ?? null,
    horario_aula_fim: row.horario_fim ?? null,
    objetivo_curso: row.objetivo ?? null,
    qtd_alunos_iniciaram: null,
  } as unknown as CursoRow;
}

/** Inscritos que ocupam o teto, por tipo (RPC `security definer` do SGE). */
export async function contarInscritosAtividade(tipo: TipoAtividade, id: string): Promise<number> {
  const { data, error } =
    tipo === "curso"
      ? await supabase.rpc("inscricao_publica_vagas_ocupadas", { p_curso_id: id })
      : await supabase.rpc("inscricao_publica_vagas_ocupadas_atividade", {
          p_tipo: tipo,
          p_atividade_id: id,
        });
  if (error) {
    console.error("Erro ao contar inscritos:", error.message);
    throw new Error("Não foi possível confirmar as vagas. Tente novamente.");
  }
  return Number(data ?? 0);
}
