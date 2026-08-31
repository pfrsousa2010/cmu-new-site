import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import CampoData from "@/components/CampoData";
import LoadingLogo from "@/components/LoadingLogo";
import { useToast } from "@/components/Toast";
import {
  fetchCursoDivulgacao,
  formatDiasSemana,
  formatLocalUnidade,
  fmtDataCurta,
  fmtDataHora,
  sliceHhmm,
  type CursoDivulgacao,
} from "@/lib/cursos";
import {
  COMO_SOUBE_OPCOES,
  ESCOLARIDADE_OPCOES,
  ESTADO_CIVIL_OPCOES,
  EMAIL_INVALIDO_MSG,
  LGPD_TEXTO,
  apenasDigitos,
  avaliarDisponibilidade,
  buscarCep,
  buscarInscricaoDoCpf,
  cpfValido,
  criarInscricao,
  emailValido,
  formatCep,
  formatCpf,
  formatNomeProprio,
  formatTelefone,
  type DadosInscricao,
} from "@/lib/inscricoes";

/**
 * Formulário de inscrição no próprio site (antes o botão abria o formulário
 * público do SGE em outra aba).
 *
 * Réplica de `InscricaoPublica.tsx` no repo do SGE: mesmos campos, mesmas
 * validações e as mesmas três travas em cascata — o CPF libera o formulário,
 * o CEP libera o endereço, a declaração de pré-requisitos libera o envio.
 * A diferença é a coluna `origem`, gravada como `site_cmu`.
 */
export default function Inscricao() {
  const { cursoId } = useParams<{ cursoId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [curso, setCurso] = useState<CursoDivulgacao | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [concluido, setConcluido] = useState<null | { listaEspera: boolean }>(
    null
  );

  // --- travas -------------------------------------------------------------
  const [formularioLiberado, setFormularioLiberado] = useState(false);
  const [enderecoLiberado, setEnderecoLiberado] = useState(false);
  const [inscricaoDuplicada, setInscricaoDuplicada] = useState(false);
  const [verificandoCpf, setVerificandoCpf] = useState(false);
  const [verificandoCep, setVerificandoCep] = useState(false);
  const [cpfErro, setCpfErro] = useState<string | null>(null);
  const [cepErro, setCepErro] = useState<string | null>(null);
  const [emailErro, setEmailErro] = useState<string | null>(null);
  const numeroRef = useRef<HTMLInputElement | null>(null);

  // --- campos -------------------------------------------------------------
  const [cpf, setCpf] = useState("");
  const [nome, setNome] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [possuiCadastroUnico, setPossuiCadastroUnico] = useState<boolean | null>(
    null
  );
  const [cep, setCep] = useState("");
  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [estadoCivil, setEstadoCivil] = useState("");
  const [escolaridade, setEscolaridade] = useState("");
  const [profissao, setProfissao] = useState("");
  const [estaTrabalhando, setEstaTrabalhando] = useState<boolean | null>(null);
  const [participouOutrosCursos, setParticipouOutrosCursos] = useState<
    boolean | null
  >(null);
  const [comoSoube, setComoSoube] = useState("");
  const [comoSoubeOutro, setComoSoubeOutro] = useState("");
  const [isMenor, setIsMenor] = useState(false);
  const [responsavelNome, setResponsavelNome] = useState("");
  const [responsavelCpf, setResponsavelCpf] = useState("");
  const [responsavelDataNascimento, setResponsavelDataNascimento] = useState("");
  const [responsavelTelefone, setResponsavelTelefone] = useState("");
  const [atendePreRequisitos, setAtendePreRequisitos] = useState(false);
  const [lgpdAceite, setLgpdAceite] = useState(false);
  const [criteriosAceite, setCriteriosAceite] = useState(false);

  useEffect(() => {
    if (!cursoId) return;
    let ativo = true;
    setCarregando(true);
    fetchCursoDivulgacao(cursoId).then((data) => {
      if (!ativo) return;
      setCurso(data);
      setCarregando(false);
    });
    return () => {
      ativo = false;
    };
  }, [cursoId]);

  const preReqObrigatorios = useMemo(
    () => (curso?.criterios ?? []).filter((c) => c.obrigatorio),
    [curso]
  );

  const disponibilidade = useMemo(
    () =>
      curso
        ? avaliarDisponibilidade(
            curso.inscricoes_inicio,
            curso.inscricoes_fim,
            curso.max_inscricoes,
            curso.qtd_inscritos
          )
        : null,
    [curso]
  );

  /** 11 dígitos digitados — só então o OK fica clicável. */
  const cpfCompleto = apenasDigitos(cpf).length === 11;

  /** Trocar o CPF invalida tudo o que foi preenchido depois dele. */
  const limparDadosInscricao = () => {
    setNome("");
    setDataNascimento("");
    setTelefone("");
    setEmail("");
    setEmailErro(null);
    setPossuiCadastroUnico(null);
    setCep("");
    setRua("");
    setNumero("");
    setComplemento("");
    setBairro("");
    setCidade("");
    setEstado("");
    setEnderecoLiberado(false);
    setCepErro(null);
    setEstadoCivil("");
    setEscolaridade("");
    setProfissao("");
    setEstaTrabalhando(null);
    setParticipouOutrosCursos(null);
    setComoSoube("");
    setComoSoubeOutro("");
    setIsMenor(false);
    setResponsavelNome("");
    setResponsavelCpf("");
    setResponsavelDataNascimento("");
    setResponsavelTelefone("");
    setLgpdAceite(false);
    setCriteriosAceite(false);
  };

  const handleCpfChange = (valor: string) => {
    setCpf(formatCpf(valor));
    setCpfErro(null);
    if (formularioLiberado || inscricaoDuplicada) {
      limparDadosInscricao();
      setFormularioLiberado(false);
      setInscricaoDuplicada(false);
    }
  };

  /** Limpa o CPF e tudo o que ele destravou. */
  const limparCampoCpf = () => {
    if (formularioLiberado) limparDadosInscricao();
    setCpf("");
    setFormularioLiberado(false);
    setInscricaoDuplicada(false);
    setCpfErro(null);
  };

  /**
   * Verificação disparada pelo botão OK ou pelo Enter — nunca no blur: a
   * consulta só acontece quando a pessoa confirma o CPF, como no SGE.
   */
  const verificarCpf = async () => {
    if (!cursoId) return;
    const limpo = apenasDigitos(cpf);
    if (limpo.length !== 11) {
      if (limpo.length > 0) setCpfErro("CPF incompleto. Deve conter 11 dígitos.");
      return;
    }
    if (!cpfValido(limpo)) {
      setCpfErro("CPF inválido. Verifique os números digitados.");
      return;
    }

    setCpfErro(null);
    setVerificandoCpf(true);
    try {
      const existente = await buscarInscricaoDoCpf(limpo, cursoId);
      if (existente) {
        setInscricaoDuplicada(true);
        setFormularioLiberado(false);
        return;
      }
      setInscricaoDuplicada(false);
      setFormularioLiberado(true);
    } catch (e) {
      setFormularioLiberado(false);
      toast((e as Error).message);
    } finally {
      setVerificandoCpf(false);
    }
  };

  const handleCepChange = (valor: string) => {
    setCep(formatCep(valor));
    setCepErro(null);
    setEnderecoLiberado(false);
    setRua("");
    setNumero("");
    setComplemento("");
    setBairro("");
    setCidade("");
    setEstado("");
  };

  const handleCepOk = async () => {
    const limpo = apenasDigitos(cep);
    if (limpo.length !== 8) {
      setCepErro("CEP incompleto. Deve conter 8 dígitos.");
      setEnderecoLiberado(false);
      return;
    }
    setCepErro(null);
    setVerificandoCep(true);
    try {
      const endereco = await buscarCep(limpo);
      if (!endereco) {
        setEnderecoLiberado(false);
        setCepErro("CEP não encontrado. Verifique e tente novamente.");
        return;
      }
      setRua(endereco.rua);
      setBairro(endereco.bairro);
      setCidade(endereco.cidade);
      setEstado(endereco.estado);
      setEnderecoLiberado(true);
      setTimeout(() => numeroRef.current?.focus(), 0);
    } catch {
      setEnderecoLiberado(false);
      setCepErro("Não foi possível consultar o CEP. Tente novamente.");
    } finally {
      setVerificandoCep(false);
    }
  };

  /** Mesma ordem de validação do formulário do SGE. */
  const validar = (): string | null => {
    if (!formularioLiberado) {
      return "Informe um CPF válido e aguarde a verificação para continuar.";
    }
    if (inscricaoDuplicada) {
      return "Você já possui uma inscrição ativa para este curso.";
    }
    if (!nome || !dataNascimento || !cpf || !telefone || !email) {
      return "Preencha todos os campos obrigatórios.";
    }
    if (!cpfValido(cpf)) return "Informe um CPF válido.";
    if (!emailValido(email)) return "Informe um e-mail válido.";
    if (!lgpdAceite) {
      return "É necessário aceitar a nota sobre a LGPD para continuar.";
    }
    if (!criteriosAceite) {
      return "É necessário declarar que leu e atende aos critérios para a inscrição.";
    }
    if (possuiCadastroUnico === null) {
      return "Informe se você possui Cadastro Único.";
    }
    if (!enderecoLiberado || !cep.trim() || !bairro.trim() || !rua.trim()) {
      return "Consulte o CEP e confirme o endereço para continuar.";
    }
    if (!estadoCivil) return "Selecione o seu estado civil.";
    if (!escolaridade) return "Selecione a sua escolaridade.";
    if (estaTrabalhando === null) return "Informe se você está trabalhando.";
    if (participouOutrosCursos === null) {
      return "Informe se você já participou de outros cursos no Clube das Mães Unidas.";
    }
    if (!comoSoube) return "Informe como você soube do curso.";
    if (comoSoube === "Outro" && !comoSoubeOutro.trim()) {
      return "Descreva como você soube do curso.";
    }
    if (
      isMenor &&
      curso?.aceita_menores_18 &&
      (!responsavelNome || !responsavelCpf || !responsavelDataNascimento)
    ) {
      return "Preencha os dados do responsável.";
    }
    if (
      isMenor &&
      curso?.aceita_menores_18 &&
      responsavelCpf &&
      !cpfValido(responsavelCpf)
    ) {
      return "O CPF do responsável é inválido.";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!curso || enviando) return;

    const erro = validar();
    if (erro) {
      toast(erro);
      return;
    }

    const dados: DadosInscricao = {
      nome,
      dataNascimento,
      cpf,
      telefone,
      email,
      cep,
      rua,
      numero,
      complemento,
      bairro,
      cidade,
      estado,
      isMenor,
      responsavelNome,
      responsavelCpf,
      responsavelDataNascimento,
      responsavelTelefone,
      atendePreRequisitos,
      lgpdAceite,
      criteriosAceite,
      possuiCadastroUnico,
      estadoCivil,
      escolaridade,
      profissao,
      estaTrabalhando,
      participouOutrosCursos,
      comoSoube,
      comoSoubeOutro,
    };

    setEnviando(true);
    try {
      const resultado = await criarInscricao(
        {
          id: curso.id,
          max_inscricoes: curso.max_inscricoes,
          aceita_menores_18: curso.aceita_menores_18,
        },
        dados
      );
      setConcluido({ listaEspera: resultado.listaEspera });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      toast((err as Error).message);
    } finally {
      setEnviando(false);
    }
  };

  // --- telas de contorno --------------------------------------------------

  if (carregando) {
    return (
      <div className="mx-auto max-w-[860px] px-6 pb-20 pt-14">
        <LoadingLogo label="Carregando inscrição…" />
      </div>
    );
  }

  if (!curso || !disponibilidade) {
    return (
      <Aviso
        titulo="Curso não encontrado"
        texto="O link pode estar incorreto ou o curso saiu do ar."
      />
    );
  }

  if (concluido) {
    return <Sucesso curso={curso} listaEspera={concluido.listaEspera} />;
  }

  if (!disponibilidade.disponivel) {
    return (
      <Aviso
        titulo="Inscrição não disponível"
        texto={mensagemIndisponivel(curso, disponibilidade)}
      />
    );
  }

  const listaEspera = disponibilidade.listaEspera;
  const diasLabel = formatDiasSemana(curso.dia_semana);
  const hIni = sliceHhmm(curso.horario_aula_inicio);
  const hFim = sliceHhmm(curso.horario_aula_fim);
  const horario =
    hIni && hFim ? `${hIni}h às ${hFim}h` : hIni ? `${hIni}h` : hFim ? `${hFim}h` : "";
  const envioBloqueado =
    enviando || inscricaoDuplicada ||
    (preReqObrigatorios.length > 0 && !atendePreRequisitos);

  return (
    <div className="mx-auto max-w-[860px] px-6 pb-20 pt-10">
      <button
        type="button"
        onClick={() => navigate("/cursos")}
        className="mb-6 text-[14px] font-bold text-azul transition-colors hover:text-laranja"
      >
        ← Voltar para os cursos
      </button>

      <div className="rounded-card bg-white p-7 shadow-card sm:p-9">
        <span className="inline-block rounded-full bg-azul/[.1] px-3 py-1 text-[12px] font-extrabold uppercase tracking-[.04em] text-azul">
          Pré-inscrição
        </span>
        <h1 className="mb-2 mt-3 font-display text-[30px] font-black leading-tight text-ink sm:text-[36px]">
          {curso.titulo}
        </h1>
        <p className="m-0 text-[14.5px] text-ink-2">
          Curso: {fmtDataCurta(curso.inicio)} a {fmtDataCurta(curso.fim)}
          {diasLabel || horario
            ? ` · ${[diasLabel, horario].filter(Boolean).join(", ")}`
            : ""}
        </p>
        <p className="mt-1 text-[14.5px] text-ink-2">
          Local: {formatLocalUnidade(curso.localAula)}
        </p>
        {curso.inscricoes_fim && (
          <p className="mt-1 text-[14.5px] text-ink-2">
            Inscrições até {fmtDataHora(curso.inscricoes_fim)}
          </p>
        )}

        <p className="mt-5 rounded-2xl bg-subtle px-5 py-4 text-[14.5px] leading-[1.6] text-ink-2">
          Esta <b>pré-inscrição não garante a sua vaga</b>. Depois de enviá-la,
          você precisa comparecer ao atendimento presencial para a entrevista de
          seleção.
        </p>

        {listaEspera && (
          <div className="mt-4 rounded-2xl bg-laranja/[.1] px-5 py-4 text-[14.5px] leading-[1.6] text-ink">
            <b>Vagas esgotadas — lista de espera.</b> Sua inscrição continua
            sendo aceita e será registrada na lista de espera. Se uma vaga for
            liberada, a equipe entra em contato.
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6" noValidate>
        {/* 1. Pré-requisitos ------------------------------------------------ */}
        {curso.criterios.length > 0 && (
          <Secao
            titulo="Pré-requisitos"
            descricao="Confira se você atende aos requisitos abaixo."
          >
            <ul className="m-0 space-y-2 p-0">
              {curso.criterios.map((c) => (
                <li
                  key={c.descricao}
                  className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl bg-subtle px-4 py-3 text-[14.5px] text-ink"
                >
                  <span>{c.descricao}</span>
                  {c.obrigatorio && (
                    <span className="rounded-full bg-laranja/[.14] px-2 py-[2px] text-[11px] font-bold uppercase tracking-[.03em] text-laranja">
                      Obrigatório
                    </span>
                  )}
                </li>
              ))}
            </ul>
            {preReqObrigatorios.length > 0 && (
              <Aceite
                id="atende-prerequisitos"
                checked={atendePreRequisitos}
                onChange={setAtendePreRequisitos}
              >
                Declaro que atendo a todos os pré-requisitos obrigatórios. *
              </Aceite>
            )}
          </Secao>
        )}

        {/* 2. CPF ----------------------------------------------------------- */}
        <Secao
          titulo="Dados pessoais"
          descricao={
            formularioLiberado
              ? "CPF verificado. Preencha seus dados abaixo."
              : "Informe seu CPF para iniciar a inscrição. Os demais campos aparecem em seguida."
          }
        >
          <div className="max-w-sm">
            <Campo
              id="cpf"
              label="CPF"
              obrigatorio
              erro={
                cpfErro ??
                (inscricaoDuplicada
                  ? "Este CPF já possui uma inscrição para este curso."
                  : null)
              }
            >
              <div className="flex gap-2">
                <div className="relative min-w-0 flex-1">
                  <input
                    id="cpf"
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={14}
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={(e) => handleCpfChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && cpfCompleto) {
                        e.preventDefault();
                        void verificarCpf();
                      }
                    }}
                    aria-invalid={Boolean(cpfErro) || inscricaoDuplicada}
                    className={`${inputCls(Boolean(cpfErro) || inscricaoDuplicada)} pr-11`}
                  />
                  {cpf.length > 0 && (
                    <button
                      type="button"
                      onClick={limparCampoCpf}
                      disabled={verificandoCpf}
                      aria-label="Limpar CPF"
                      className="absolute right-0 top-0 flex h-full w-11 items-center justify-center text-[18px] leading-none text-ink-3 transition-colors hover:text-ink disabled:opacity-40"
                    >
                      ×
                    </button>
                  )}
                </div>
                {!formularioLiberado && (
                  <button
                    type="button"
                    onClick={() => void verificarCpf()}
                    disabled={!cpfCompleto || verificandoCpf}
                    className="shrink-0 rounded-xl bg-azul px-6 py-3 font-display text-sm font-extrabold text-white transition-colors hover:bg-azul-hover disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {verificandoCpf ? "…" : "OK"}
                  </button>
                )}
              </div>
            </Campo>
            {verificandoCpf && (
              <p className="mt-2 text-[13px] text-ink-2">Verificando CPF…</p>
            )}
          </div>

          {inscricaoDuplicada && (
            <div className="rounded-2xl bg-vermelho/[.08] px-5 py-4 text-[14.5px] leading-[1.6] text-ink">
              <b>Inscrição já realizada.</b> Não é possível fazer uma nova
              inscrição neste curso com este CPF. Se você acha que houve um
              engano, fale com a equipe pela página de{" "}
              <Link to="/contato" className="font-bold text-azul underline">
                contato
              </Link>
              .
            </div>
          )}

          {formularioLiberado && (
            <>
              <div className="rounded-2xl bg-subtle px-5 py-4">
                <p className="m-0 whitespace-pre-line text-[13px] leading-[1.6] text-ink-2">
                  {LGPD_TEXTO}
                </p>
                <div className="mt-3 space-y-2">
                  <Aceite
                    id="lgpd-aceite"
                    checked={lgpdAceite}
                    onChange={setLgpdAceite}
                  >
                    Declaro que li a nota sobre a LGPD e estou de acordo com a
                    coleta dos dados. *
                  </Aceite>
                  <Aceite
                    id="criterios-aceite"
                    checked={criteriosAceite}
                    onChange={setCriteriosAceite}
                  >
                    Declaro que li os critérios para a inscrição e que atendo a
                    estes requisitos. *
                  </Aceite>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Campo id="nome" label="Nome completo" obrigatorio className="sm:col-span-2">
                  <input
                    id="nome"
                    autoComplete="name"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    onBlur={() => setNome(formatNomeProprio(nome))}
                    className={inputCls(false)}
                  />
                </Campo>
                <Campo id="data-nascimento" label="Data de nascimento" obrigatorio>
                  <CampoData
                    id="data-nascimento"
                    value={dataNascimento}
                    onChange={setDataNascimento}
                    semFuturo
                  />
                </Campo>
                <Campo id="telefone" label="Telefone/celular" obrigatorio>
                  <input
                    id="telefone"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="(43) 99999-9999"
                    value={telefone}
                    onChange={(e) => setTelefone(formatTelefone(e.target.value))}
                    className={inputCls(false)}
                  />
                </Campo>
                <Campo
                  id="email"
                  label="E-mail"
                  obrigatorio
                  erro={emailErro}
                  className="sm:col-span-2"
                >
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    value={email}
                    onChange={(e) => {
                      // E-mail não diferencia maiúsculas; o teclado do celular
                      // capitaliza a primeira letra sozinho e gera "Maria@...".
                      setEmail(e.target.value.toLowerCase());
                      setEmailErro(null);
                    }}
                    onBlur={() =>
                      setEmailErro(
                        !email.trim() || emailValido(email)
                          ? null
                          : EMAIL_INVALIDO_MSG
                      )
                    }
                    className={inputCls(Boolean(emailErro))}
                  />
                </Campo>
                <Campo id="cadastro-unico" label="Possui Cadastro Único?" obrigatorio grupo>
                  <SimNao
                    id="cadastro-unico"
                    valor={possuiCadastroUnico}
                    onChange={setPossuiCadastroUnico}
                  />
                </Campo>
              </div>
            </>
          )}
        </Secao>

        {/* 3. Endereço ------------------------------------------------------ */}
        {formularioLiberado && (
          <Secao
            titulo="Endereço"
            descricao="Informe o CEP e clique em buscar para preencher o endereço."
          >
            <div className="max-w-xs">
              <Campo id="cep" label="CEP" obrigatorio erro={cepErro}>
                <div className="flex gap-2">
                  <input
                    id="cep"
                    inputMode="numeric"
                    autoComplete="postal-code"
                    placeholder="00000-000"
                    value={cep}
                    onChange={(e) => handleCepChange(e.target.value)}
                    className={inputCls(Boolean(cepErro))}
                  />
                  <button
                    type="button"
                    onClick={() => void handleCepOk()}
                    disabled={verificandoCep}
                    className="shrink-0 rounded-xl bg-azul px-5 py-3 font-display text-sm font-extrabold text-white transition-colors hover:bg-azul-hover disabled:opacity-50"
                  >
                    {verificandoCep ? "…" : "Buscar"}
                  </button>
                </div>
              </Campo>
            </div>

            {enderecoLiberado && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-6">
                <Campo id="rua" label="Rua" obrigatorio className="sm:col-span-4">
                  <input
                    id="rua"
                    value={rua}
                    onChange={(e) => setRua(e.target.value)}
                    className={inputCls(false)}
                  />
                </Campo>
                <Campo id="numero" label="Número" className="sm:col-span-2">
                  <input
                    id="numero"
                    ref={numeroRef}
                    inputMode="numeric"
                    value={numero}
                    onChange={(e) => setNumero(e.target.value)}
                    className={inputCls(false)}
                  />
                </Campo>
                <Campo id="complemento" label="Complemento" className="sm:col-span-3">
                  <input
                    id="complemento"
                    value={complemento}
                    onChange={(e) => setComplemento(e.target.value)}
                    className={inputCls(false)}
                  />
                </Campo>
                <Campo id="bairro" label="Bairro" obrigatorio className="sm:col-span-3">
                  <input
                    id="bairro"
                    value={bairro}
                    onChange={(e) => setBairro(e.target.value)}
                    className={inputCls(false)}
                  />
                </Campo>
                <Campo id="cidade" label="Cidade" className="sm:col-span-4">
                  <input
                    id="cidade"
                    value={cidade}
                    onChange={(e) => setCidade(e.target.value)}
                    className={inputCls(false)}
                  />
                </Campo>
                <Campo id="estado" label="Estado" className="sm:col-span-2">
                  <input
                    id="estado"
                    value={estado}
                    onChange={(e) => setEstado(e.target.value)}
                    className={inputCls(false)}
                  />
                </Campo>
              </div>
            )}
          </Secao>
        )}

        {/* 4. Perfil -------------------------------------------------------- */}
        {formularioLiberado && (
          <Secao titulo="Sobre você">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Campo id="estado-civil" label="Estado civil" obrigatorio>
                <select
                  id="estado-civil"
                  value={estadoCivil}
                  onChange={(e) => setEstadoCivil(e.target.value)}
                  className={inputCls(false)}
                >
                  <option value="">Selecione</option>
                  {ESTADO_CIVIL_OPCOES.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </Campo>
              <Campo id="escolaridade" label="Escolaridade" obrigatorio>
                <select
                  id="escolaridade"
                  value={escolaridade}
                  onChange={(e) => setEscolaridade(e.target.value)}
                  className={inputCls(false)}
                >
                  <option value="">Selecione</option>
                  {ESCOLARIDADE_OPCOES.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </Campo>
              <Campo id="profissao" label="Profissão" className="sm:col-span-2">
                <input
                  id="profissao"
                  value={profissao}
                  onChange={(e) => setProfissao(e.target.value)}
                  className={inputCls(false)}
                />
              </Campo>
              <Campo id="esta-trabalhando" label="Está trabalhando?" obrigatorio grupo>
                <SimNao
                  id="esta-trabalhando"
                  valor={estaTrabalhando}
                  onChange={setEstaTrabalhando}
                />
              </Campo>
              <Campo
                id="participou-cursos"
                label="Já participou de outros cursos no CMU?"
                obrigatorio
                grupo
              >
                <SimNao
                  id="participou-cursos"
                  valor={participouOutrosCursos}
                  onChange={setParticipouOutrosCursos}
                />
              </Campo>
              <Campo
                id="como-soube"
                label="Como você soube do curso?"
                obrigatorio
                className="sm:col-span-2"
              >
                <select
                  id="como-soube"
                  value={comoSoube}
                  onChange={(e) => {
                    setComoSoube(e.target.value);
                    if (e.target.value !== "Outro") setComoSoubeOutro("");
                  }}
                  className={inputCls(false)}
                >
                  <option value="">Selecione</option>
                  {COMO_SOUBE_OPCOES.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
                {comoSoube === "Outro" && (
                  <input
                    aria-label="Descreva como soube do curso"
                    placeholder="Descreva"
                    value={comoSoubeOutro}
                    onChange={(e) => setComoSoubeOutro(e.target.value)}
                    className={`mt-2 ${inputCls(false)}`}
                  />
                )}
              </Campo>
            </div>
          </Secao>
        )}

        {/* 5. Responsável --------------------------------------------------- */}
        {formularioLiberado && curso.aceita_menores_18 && (
          <Secao titulo="Menor de idade">
            <Aceite id="is-menor" checked={isMenor} onChange={setIsMenor}>
              Sou menor de idade
            </Aceite>

            {isMenor && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Campo
                  id="responsavel-nome"
                  label="Nome do responsável"
                  obrigatorio
                  className="sm:col-span-2"
                >
                  <input
                    id="responsavel-nome"
                    value={responsavelNome}
                    onChange={(e) => setResponsavelNome(e.target.value)}
                    onBlur={() =>
                      setResponsavelNome(formatNomeProprio(responsavelNome))
                    }
                    className={inputCls(false)}
                  />
                </Campo>
                <Campo id="responsavel-cpf" label="CPF do responsável" obrigatorio>
                  <input
                    id="responsavel-cpf"
                    inputMode="numeric"
                    placeholder="000.000.000-00"
                    value={responsavelCpf}
                    onChange={(e) =>
                      setResponsavelCpf(formatCpf(e.target.value))
                    }
                    className={inputCls(false)}
                  />
                </Campo>
                <Campo id="responsavel-nascimento" label="Nascimento do responsável" obrigatorio>
                  <CampoData
                    id="responsavel-nascimento"
                    value={responsavelDataNascimento}
                    onChange={setResponsavelDataNascimento}
                    semFuturo
                  />
                </Campo>
                <Campo id="responsavel-telefone" label="Telefone do responsável">
                  <input
                    id="responsavel-telefone"
                    inputMode="tel"
                    placeholder="(43) 99999-9999"
                    value={responsavelTelefone}
                    onChange={(e) =>
                      setResponsavelTelefone(formatTelefone(e.target.value))
                    }
                    className={inputCls(false)}
                  />
                </Campo>
              </div>
            )}
          </Secao>
        )}

        {/* 6. Envio --------------------------------------------------------- */}
        {formularioLiberado && (
          <div className="rounded-card bg-white p-7 shadow-card sm:p-9">
            <button
              type="submit"
              disabled={envioBloqueado}
              className="w-full rounded-full bg-verde px-7 py-4 font-display text-base font-extrabold text-white shadow-[0_3px_10px_rgba(98,179,46,.3)] transition-colors hover:bg-verde-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {enviando
                ? "Enviando…"
                : listaEspera
                  ? "Entrar na lista de espera"
                  : "Confirmar inscrição"}
            </button>
            {preReqObrigatorios.length > 0 && !atendePreRequisitos && (
              <p className="mt-3 text-center text-[13.5px] text-ink-2">
                Marque a declaração de pré-requisitos para liberar o envio.
              </p>
            )}
          </div>
        )}
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Telas
// ---------------------------------------------------------------------------

function mensagemIndisponivel(
  curso: CursoDivulgacao,
  d: Extract<ReturnType<typeof avaliarDisponibilidade>, { disponivel: false }>
): string {
  if (d.motivo === "nao_iniciou") {
    const ini = curso.inscricoes_inicio ? fmtDataHora(curso.inscricoes_inicio) : "";
    const fim = curso.inscricoes_fim ? fmtDataHora(curso.inscricoes_fim) : "";
    let texto = `As inscrições para ${curso.titulo} ainda não iniciaram.`;
    if (ini && fim) texto += ` O período começa em ${ini} e termina em ${fim}.`;
    else if (ini) texto += ` O período começa em ${ini}.`;
    return texto;
  }
  if (d.motivo === "encerrado") {
    const fim = curso.inscricoes_fim ? fmtDataHora(curso.inscricoes_fim) : "";
    return fim
      ? `As inscrições para ${curso.titulo} foram encerradas em ${fim}.`
      : `As inscrições para ${curso.titulo} não estão mais abertas.`;
  }
  return `As inscrições para ${curso.titulo} não estão disponíveis no momento.`;
}

function Aviso({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="mx-auto max-w-[720px] px-6 pb-20 pt-14">
      <div className="rounded-card bg-white p-9 shadow-card">
        <h1 className="m-0 font-display text-[28px] font-black text-ink">
          {titulo}
        </h1>
        <p className="mt-3 text-[15px] leading-[1.65] text-ink-2">{texto}</p>
        <Link
          to="/cursos"
          className="mt-6 inline-block rounded-full border-[1.5px] border-black/[.12] bg-white px-6 py-3 font-display text-sm font-extrabold text-ink transition-colors hover:border-azul hover:text-azul"
        >
          Ver outros cursos
        </Link>
      </div>
    </div>
  );
}

function Sucesso({
  curso,
  listaEspera,
}: {
  curso: CursoDivulgacao;
  listaEspera: boolean;
}) {
  const data = curso.data_selecao ? fmtDataCurta(curso.data_selecao) : "";
  const hora = sliceHhmm(curso.horario_atendimento_inicio);
  const quando = data && hora ? `${data} às ${hora}` : data || hora;

  return (
    <div className="mx-auto max-w-[720px] px-6 pb-20 pt-14">
      {/* No celular o cartão inteiro fica centrado; a partir de sm volta ao
          alinhamento à esquerda das demais páginas. */}
      <div className="rounded-card bg-white p-7 text-center shadow-card sm:p-9 sm:text-left">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-verde/[.14] text-[28px] text-verde sm:mx-0">
          ✓
        </div>
        <h1 className="m-0 font-display text-[30px] font-black leading-tight text-ink">
          {listaEspera
            ? "Você entrou na lista de espera"
            : "Pré-inscrição realizada!"}
        </h1>
        <p className="mt-3 text-[15px] leading-[1.65] text-ink-2">
          {listaEspera ? (
            <>
              As vagas de <b>{curso.titulo.trim()}</b> estão esgotadas, então
              sua inscrição ficou registrada na lista de espera. Se uma vaga for
              liberada, a equipe entra em contato.
            </>
          ) : (
            <>
              Sua inscrição em <b>{curso.titulo.trim()}</b> foi registrada. Ela{" "}
              <b>não garante a vaga</b>: a seleção acontece no atendimento
              presencial.
            </>
          )}
        </p>

        {quando && (
          <div className="mt-6 rounded-2xl bg-laranja/[.1] px-6 py-5">
            <p className="m-0 text-[13px] font-extrabold uppercase tracking-[.04em] text-laranja">
              Salve esta data — atendimento presencial
            </p>
            <p className="mt-2 text-[19px] font-bold leading-[1.4] text-ink">
              {quando}
            </p>
            <p className="mt-1 text-[14.5px] leading-[1.55] text-ink-2">
              {formatLocalUnidade(curso.localAtendimento)}
            </p>
          </div>
        )}

        {/* Lado a lado sempre: no celular cada botão ocupa metade da linha (os
            rótulos não cabem lado a lado no tamanho natural); a partir de sm
            voltam ao tamanho do conteúdo, alinhados à direita. */}
        <div className="mt-7 flex gap-3 sm:justify-end">
          <Link
            to="/"
            className="flex-1 whitespace-nowrap rounded-full border-[1.5px] border-black/[.12] bg-white px-4 py-3 text-center font-display text-[13.5px] font-extrabold text-ink transition-colors hover:border-azul hover:text-azul sm:flex-none sm:px-6 sm:text-sm"
          >
            Página inicial
          </Link>
          <Link
            to="/cursos"
            className="flex-1 whitespace-nowrap rounded-full bg-verde px-4 py-3 text-center font-display text-[13.5px] font-extrabold text-white transition-colors hover:bg-verde-hover sm:flex-none sm:px-6 sm:text-sm"
          >
            Ver outros cursos
          </Link>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Peças do formulário
// ---------------------------------------------------------------------------

function inputCls(erro: boolean): string {
  return [
    "w-full rounded-xl border-[1.5px] bg-white px-4 py-3 text-[15px] text-ink outline-none transition-colors placeholder:text-ink-2/60",
    erro ? "border-vermelho" : "border-black/[.12] focus:border-azul",
  ].join(" ");
}

function Secao({
  titulo,
  descricao,
  children,
}: {
  titulo: string;
  descricao?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-card bg-white p-7 shadow-card sm:p-9">
      <h2 className="m-0 font-display text-[20px] font-extrabold text-ink">
        {titulo}
      </h2>
      {descricao && (
        <p className="mt-1.5 text-[14.5px] leading-[1.55] text-ink-2">
          {descricao}
        </p>
      )}
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  );
}

/**
 * Rótulo + campo. `grupo` troca o <label for> por um <span id>, para os
 * conjuntos de botões (Sim/Não), que não são elementos rotuláveis: nesses o
 * grupo aponta para o rótulo via aria-labelledby.
 */
function Campo({
  id,
  label,
  obrigatorio,
  erro,
  grupo,
  className = "",
  children,
}: {
  id: string;
  label: string;
  obrigatorio?: boolean;
  erro?: string | null;
  grupo?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const conteudoLabel = (
    <>
      {label}
      {obrigatorio && (
        <span className="ml-1 text-vermelho" aria-hidden="true">
          *
        </span>
      )}
    </>
  );

  return (
    <div className={className}>
      {grupo ? (
        <span
          id={`${id}-label`}
          className="mb-1.5 block text-[13.5px] font-bold text-ink"
        >
          {conteudoLabel}
        </span>
      ) : (
        <label
          htmlFor={id}
          className="mb-1.5 block text-[13.5px] font-bold text-ink"
        >
          {conteudoLabel}
        </label>
      )}
      {children}
      {erro && (
        <p id={`${id}-erro`} role="alert" className="mt-1.5 text-[13px] text-vermelho">
          {erro}
        </p>
      )}
    </div>
  );
}

function SimNao({
  id,
  valor,
  onChange,
}: {
  id: string;
  valor: boolean | null;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex gap-2" role="group" aria-labelledby={`${id}-label`}>
      {[true, false].map((opcao) => (
        <button
          key={String(opcao)}
          type="button"
          onClick={() => onChange(opcao)}
          aria-pressed={valor === opcao}
          className={[
            "rounded-full border-[1.5px] px-6 py-[11px] text-[14px] font-bold transition-colors",
            valor === opcao
              ? "border-azul bg-azul text-white"
              : "border-black/[.12] bg-white text-ink-mid hover:border-azul",
          ].join(" ")}
        >
          {opcao ? "Sim" : "Não"}
        </button>
      ))}
    </div>
  );
}

function Aceite({
  id,
  checked,
  onChange,
  children,
}: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  children: ReactNode;
}) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-start gap-3 text-[14.5px] leading-[1.55] text-ink"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-[3px] h-[18px] w-[18px] shrink-0 accent-verde"
      />
      <span>{children}</span>
    </label>
  );
}
