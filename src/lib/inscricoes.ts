import { supabase } from "./supabase";

/**
 * Inscrição em curso feita pelo próprio site.
 *
 * Grava direto em `inscricoes` (tabela do SGE) com a chave anon, pela policy
 * `inscricoes_insert_public`. É o mesmo caminho que a página pública do SGE
 * (`cursos.clubedasmaesunidas.org.br/inscricao/curso/:id`) usa — a diferença é
 * a coluna `origem`, que aqui vale `site_cmu` e faz o SGE exibir "Site CMU".
 *
 * Este módulo é uma réplica das regras de
 * `cmu-cursos-planner/src/modules/inscricoes/pages/InscricaoPublica.tsx`.
 * Campos, validações, máscaras e opções precisam continuar iguais aos de lá:
 * os dois formulários alimentam a mesma tabela e a mesma triagem.
 */

/** Valor de `inscricoes.origem` que o SGE rotula como "Site CMU". */
export const ORIGEM_SITE = "site_cmu";

export type StatusInscricao = "inscrito" | "lista_espera";

// ---------------------------------------------------------------------------
// Opções da ficha
// Espelham `cmu-cursos-planner/src/modules/inscricoes/lib/fichaOpcoes.ts`.
// Os rótulos são gravados como texto no banco — mudar aqui não migra registros
// antigos, e diverge da inscrição manual se não mudar lá também.
// ---------------------------------------------------------------------------

export const ESTADO_CIVIL_OPCOES = [
  "Casado(a)",
  "Solteiro(a)",
  "Divorciado(a)/separado(a)",
  "Viúvo(a)",
] as const;

export const ESCOLARIDADE_OPCOES = [
  "Ensino Fundamental Incompleto",
  "Ensino Fundamental Completo",
  "Ensino Médio Incompleto",
  "Ensino Médio Completo",
  "Ensino Superior Incompleto",
  "Ensino Superior Completo",
  "Pós-Graduação",
] as const;

export const COMO_SOUBE_OPCOES = [
  "Facebook do Clube das Mães Unidas",
  "Instagram do Clube das Mães Unidas",
  "Site do Clube das Mães Unidas",
  "Whatsapp do Clube das Mães Unidas",
  "Secretaria da Mulher / CAM",
  "Amigo",
  "CRAS",
  "CREAS",
  "Jornal",
  "Programa de Rádio",
  "Programa de TV",
  "Outro",
] as const;

/** Campos com "Outro" gravam `"Outro: <texto>"` (mesmo formato do SGE). */
export function juntarOpcaoOutro(opcao: string, outro: string): string | null {
  const o = opcao.trim();
  if (!o) return null;
  if (o !== "Outro") return o;
  const texto = outro.trim();
  return texto ? `Outro: ${texto}` : "Outro";
}

/** Nota da LGPD exibida antes dos aceites. Texto igual ao do SGE. */
export const LGPD_TEXTO =
  "Conforme Lei nº 13.709, de 14 de agosto de 2018 (Lei Geral de Proteção de " +
  "Dados Pessoais), informamos:\n\n" +
  "As informações coletadas para solicitação de vaga nos cursos serão " +
  "utilizadas exclusivamente para identificação do usuário dos serviços " +
  "oferecidos pelo Clube das Mães Unidas. Os dados coletados serão " +
  "compartilhados com a Secretaria Municipal de Assistência Social da " +
  "Prefeitura de Londrina, com a finalidade específica de registro, pois, " +
  "somos contrarreferência dos serviços socioassistenciais. O Clube das Mães " +
  "Unidas é responsável pelos dados coletados.";

// ---------------------------------------------------------------------------
// Janela de inscrição
// Espelha `avaliarDisponibilidadeInscricao` do SGE (inscricaoPeriodo.ts). O
// `statusDe()` em cursos.ts responde só "está aberta?", para o selo do card;
// aqui interessa também o motivo, para explicar ao candidato.
// ---------------------------------------------------------------------------

export type Disponibilidade =
  | { disponivel: true; listaEspera: boolean }
  | {
      disponivel: false;
      motivo: "nao_configurado" | "nao_iniciou" | "encerrado";
      inicio: Date | null;
      fim: Date | null;
    };

function parseData(valor: string | null | undefined): Date | null {
  if (!valor) return null;
  const d = new Date(valor);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function avaliarDisponibilidade(
  inscricoesInicio: string | null | undefined,
  inscricoesFim: string | null | undefined,
  maxInscricoes: number | null | undefined,
  inscricoesAtuais: number,
  agora: Date = new Date()
): Disponibilidade {
  const inicio = parseData(inscricoesInicio);
  const fim = parseData(inscricoesFim);

  if (!inicio && !fim) {
    return { disponivel: false, motivo: "nao_configurado", inicio: null, fim: null };
  }
  if (inicio && agora < inicio) {
    return { disponivel: false, motivo: "nao_iniciou", inicio, fim };
  }
  if (fim && agora > fim) {
    return { disponivel: false, motivo: "encerrado", inicio, fim };
  }

  const listaEspera =
    maxInscricoes != null &&
    maxInscricoes > 0 &&
    inscricoesAtuais >= maxInscricoes;

  return { disponivel: true, listaEspera };
}

// ---------------------------------------------------------------------------
// Máscaras e validação
// ---------------------------------------------------------------------------

export function apenasDigitos(valor: string): string {
  return valor.replace(/\D/g, "");
}

export function formatCpf(valor: string): string {
  const d = apenasDigitos(valor).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

export function formatTelefone(valor: string): string {
  const d = apenasDigitos(valor).slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  const ddd = d.slice(0, 2);
  const p1 = d.length === 11 ? d.slice(2, 7) : d.slice(2, 6);
  const p2 = d.length === 11 ? d.slice(7) : d.slice(6);
  return `(${ddd}) ${p1}-${p2}`;
}

export function formatCep(valor: string): string {
  const d = apenasDigitos(valor).slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

/** Validação dos dígitos verificadores (Receita Federal). */
export function cpfValido(valor: string): boolean {
  const d = apenasDigitos(valor);
  if (d.length !== 11) return false;
  // Rejeita sequências iguais (111.111.111-11 passa no cálculo).
  if (/^(\d)\1{10}$/.test(d)) return false;

  const digito = (ate: number) => {
    let soma = 0;
    for (let i = 0; i < ate; i++) soma += Number(d[i]) * (ate + 1 - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };

  return digito(9) === Number(d[9]) && digito(10) === Number(d[10]);
}

// --- Data digitada (dd/mm/aaaa) -------------------------------------------
// O banco guarda ISO (yyyy-mm-dd), mas o campo é texto com máscara: em celular
// o `<input type="date">` abre o seletor nativo em vez do teclado numérico, o
// que trava quem quer só digitar a data de nascimento. Mesma escolha do
// `DateInput` do SGE.

/** Aplica a máscara dd/mm/aaaa conforme a pessoa digita. */
export function mascaraData(valor: string): string {
  const d = apenasDigitos(valor).slice(0, 8);
  if (d.length > 4) return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
  if (d.length > 2) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return d;
}

/** ISO (yyyy-mm-dd) → dd/mm/aaaa. Vazio quando não há data válida. */
export function dataISOparaBR(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
  return m ? `${m[3]}/${m[2]}/${m[1]}` : "";
}

/**
 * dd/mm/aaaa → ISO (yyyy-mm-dd). Devolve "" enquanto estiver incompleta ou se
 * a data não existir (31/02, mês 13). Assim o estado do formulário só guarda
 * data válida, e a validação de obrigatório pega o resto.
 */
export function dataBRparaISO(valor: string): string {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(valor);
  if (!m) return "";

  const dia = Number(m[1]);
  const mes = Number(m[2]);
  const ano = Number(m[3]);
  if (mes < 1 || mes > 12 || dia < 1) return "";

  // Round-trip pelo Date: rejeita dias que não existem no mês.
  const d = new Date(ano, mes - 1, dia);
  if (
    d.getFullYear() !== ano ||
    d.getMonth() !== mes - 1 ||
    d.getDate() !== dia
  ) {
    return "";
  }

  return `${m[3]}-${m[2]}-${m[1]}`;
}

export const EMAIL_INVALIDO_MSG = "E-mail inválido. Ex: nome@dominio.com";

/** Mesmas regras de `emailValidation.ts` no SGE: sem espaços, TLD >= 2, <= 254. */
export function emailValido(valor: string): boolean {
  const v = valor.trim();
  if (!v) return false;
  if (v.length > 254) return false;
  if (/\s/.test(v)) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
}

/**
 * Title case pt-BR para nome próprio: preposições em minúscula, hífen e
 * apóstrofo preservados (d'Ávila, Silva-Souza).
 */
export function formatNomeProprio(valor: string): string {
  const v = valor.trim().replace(/\s+/g, " ").toLocaleLowerCase("pt-BR");
  if (!v) return "";

  const menores = new Set(["da", "das", "de", "do", "dos", "e"]);

  return v
    .split(" ")
    .map((palavra, idx) => {
      if (!palavra) return palavra;
      if (idx > 0 && menores.has(palavra)) return palavra;
      return palavra
        .split("-")
        .map((parte) =>
          parte
            .split("'")
            .map((p) =>
              p ? p.charAt(0).toLocaleUpperCase("pt-BR") + p.slice(1) : p
            )
            .join("'")
        )
        .join("-");
    })
    .join(" ");
}

// ---------------------------------------------------------------------------
// CEP (ViaCEP)
// ---------------------------------------------------------------------------

export interface EnderecoCep {
  rua: string;
  bairro: string;
  cidade: string;
  estado: string;
}

/**
 * Consulta o ViaCEP. Devolve `null` quando o CEP não existe ou o serviço falha
 * — quem chama distingue pelo `throw`: erro de rede vira exceção, CEP
 * inexistente vira `null`.
 */
export async function buscarCep(cep: string): Promise<EnderecoCep | null> {
  const limpo = apenasDigitos(cep);
  if (limpo.length !== 8) return null;

  const res = await fetch(`https://viacep.com.br/ws/${limpo}/json/`);
  const data = (await res.json()) as {
    erro?: boolean | string;
    logradouro?: string;
    bairro?: string;
    localidade?: string;
    uf?: string;
  };

  if (data.erro) return null;

  return {
    rua: data.logradouro || "",
    bairro: data.bairro || "",
    cidade: data.localidade || "",
    estado: data.uf || "",
  };
}

// ---------------------------------------------------------------------------
// Consultas
// ---------------------------------------------------------------------------

/**
 * Já existe inscrição deste CPF neste curso? O índice único do SGE
 * (`idx_inscricoes_unique_cpf_curso`) ignora canceladas, então uma inscrição
 * cancelada não impede nova tentativa — a checagem aqui só antecipa o erro.
 */
export async function buscarInscricaoDoCpf(
  cpf: string,
  cursoId: string
): Promise<{ id: string; status: string } | null> {
  const limpo = apenasDigitos(cpf);
  if (limpo.length !== 11) return null;

  const { data, error } = await supabase
    .from("inscricoes")
    .select("id, status")
    .eq("cpf", limpo)
    .eq("curso_id", cursoId)
    .maybeSingle();

  if (error) {
    console.error("Erro ao verificar CPF:", error.message);
    throw new Error("Não foi possível verificar o CPF. Tente novamente.");
  }

  return data ?? null;
}

/** Inscritos que ocupam o teto (`status = 'inscrito'`), critério do SGE. */
export async function contarInscritos(cursoId: string): Promise<number> {
  const { count, error } = await supabase
    .from("inscricoes")
    .select("id", { count: "exact", head: true })
    .eq("curso_id", cursoId)
    .eq("status", "inscrito");

  if (error) {
    console.error("Erro ao contar inscritos:", error.message);
    throw new Error("Não foi possível confirmar as vagas. Tente novamente.");
  }

  return count ?? 0;
}

// ---------------------------------------------------------------------------
// Envio
// ---------------------------------------------------------------------------

/** Campos do formulário, no formato da tela (com máscara, strings vazias). */
export interface DadosInscricao {
  nome: string;
  dataNascimento: string;
  cpf: string;
  telefone: string;
  email: string;
  cep: string;
  rua: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  isMenor: boolean;
  responsavelNome: string;
  responsavelCpf: string;
  responsavelDataNascimento: string;
  responsavelTelefone: string;
  atendePreRequisitos: boolean;
  lgpdAceite: boolean;
  criteriosAceite: boolean;
  possuiCadastroUnico: boolean | null;
  estadoCivil: string;
  escolaridade: string;
  profissao: string;
  estaTrabalhando: boolean | null;
  participouOutrosCursos: boolean | null;
  comoSoube: string;
  comoSoubeOutro: string;
}

export interface CursoInscricao {
  id: string;
  max_inscricoes: number | null;
  aceita_menores_18: boolean;
}

/**
 * Cria a inscrição e devolve se ela caiu na lista de espera.
 *
 * A ocupação é recontada aqui, não na abertura da tela: alguém pode ter tomado
 * a última vaga enquanto o candidato preenchia o formulário.
 */
export async function criarInscricao(
  curso: CursoInscricao,
  dados: DadosInscricao
): Promise<{ listaEspera: boolean }> {
  const cpfLimpo = apenasDigitos(dados.cpf);

  // Menor de idade só é registrado como tal se o curso aceitar; senão os dados
  // do responsável não vão para o banco. Mesma regra do formulário do SGE.
  const menorAceito = dados.isMenor && curso.aceita_menores_18;

  // O RLS bloqueia `alunos` para a chave anon, então na prática isto devolve
  // null e a inscrição entra sem vínculo — o gestor casa o aluno no SGE. Fica
  // aqui para se corrigir sozinho caso a policy mude, como no formulário do SGE.
  const { data: aluno } = await supabase
    .from("alunos")
    .select("id, irsas")
    .eq("cpf", cpfLimpo)
    .maybeSingle();

  const inscritos = await contarInscritos(curso.id);
  const listaEspera =
    curso.max_inscricoes != null &&
    curso.max_inscricoes > 0 &&
    inscritos >= curso.max_inscricoes;

  const payload = {
    nome_completo: dados.nome.trim(),
    data_nascimento: dados.dataNascimento,
    cpf: cpfLimpo,
    telefone: dados.telefone.trim(),
    email: dados.email.trim(),
    cep: dados.cep.trim() || null,
    rua: dados.rua.trim() || null,
    numero: dados.numero.trim() || null,
    complemento: dados.complemento.trim() || null,
    bairro: dados.bairro.trim() || null,
    cidade: dados.cidade.trim() || null,
    estado: dados.estado.trim() || null,
    is_menor: menorAceito,
    responsavel_nome: menorAceito ? dados.responsavelNome.trim() : null,
    responsavel_cpf: menorAceito ? apenasDigitos(dados.responsavelCpf) : null,
    responsavel_data_nascimento: menorAceito
      ? dados.responsavelDataNascimento
      : null,
    responsavel_telefone: menorAceito ? dados.responsavelTelefone.trim() : null,
    curso_id: curso.id,
    atende_pre_requisitos: dados.atendePreRequisitos,
    lgpd_aceite: dados.lgpdAceite,
    criterios_aceite: dados.criteriosAceite,
    possui_cadastro_unico: dados.possuiCadastroUnico,
    estado_civil: dados.estadoCivil || null,
    escolaridade: dados.escolaridade || null,
    profissao: dados.profissao.trim() || null,
    esta_trabalhando: dados.estaTrabalhando,
    participou_outros_cursos: dados.participouOutrosCursos,
    como_soube_curso: juntarOpcaoOutro(dados.comoSoube, dados.comoSoubeOutro),
    status: (listaEspera ? "lista_espera" : "inscrito") satisfies StatusInscricao,
    origem: ORIGEM_SITE,
    irsas: aluno?.irsas ? String(aluno.irsas) : null,
    aluno_id: aluno?.id ?? null,
    aluno_ja_cadastrado: Boolean(aluno?.id),
  };

  const { error } = await supabase.from("inscricoes").insert(payload);

  if (error) {
    if (error.message.includes("idx_inscricoes_unique_cpf_curso")) {
      throw new Error("Você já possui uma inscrição ativa para este curso.");
    }
    throw new Error(error.message);
  }

  return { listaEspera };
}
