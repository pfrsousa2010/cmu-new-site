# ARCHITECTURE.md

Arquitetura do site + painel admin do **Clube das Mães Unidas**. Documento de
orientação: o que existe, por quê, e onde encostar. Para convenções de trabalho
e armadilhas, veja [CLAUDE.md](CLAUDE.md); para operação (migrar banco, criar
admin, deploy), veja [README.md](README.md).

## 1. Visão geral

SPA React servida como arquivos estáticos, falando direto com o Supabase. **Não
existe backend próprio, API intermediária nem SSR.**

```
Navegador (SPA React + Vite)
      │
      │  supabase-js (HTTPS)
      ▼
Supabase  ├── Postgres  — tabelas do site (site_*) + tabelas do SGE (leitura)
          ├── Auth      — e-mail/senha, sessão em localStorage (PKCE)
          └── Storage   — buckets site-eventos / site-arquivos / site-cursos / site-hero
```

Consequência central: **a fronteira de segurança é o RLS do Postgres**, não o
código React. Tudo que o cliente pode fazer com a chave `anon` está definido nas
policies em `supabase/migrations/`. Checagens no front (role admin, rota
protegida) são conveniência de UI.

Escala do código: ~6.000 linhas de TS/TSX, 10 páginas públicas, 5 telas de
admin, 4 módulos de dados.

## 2. Stack e decisões

| Peça | Escolha | Motivo |
|---|---|---|
| Build | Vite 5 + `@vitejs/plugin-react-swc` | SPA estática, HMR rápido |
| UI | React 18 + TypeScript strict | — |
| Rotas | React Router 6 (`BrowserRouter`) | rotas aninhadas via `Outlet` |
| Estilo | Tailwind 3, tokens no config | design vindo do handoff em `design_handoff_site_cmu/` |
| Backend | Supabase (Postgres + Auth + Storage) | projeto já existente do SGE |
| Estado | `useState` + 2 contextos | volume de dados pequeno; sem lib de estado |
| Deploy | Vercel/Netlify, estático | `vercel.json` / `public/_redirects` para fallback SPA |

Ausências deliberadas: sem testes, sem lib de formulários, sem cache de servidor
(React Query), sem i18n (o site é só pt-BR), sem UI kit — os componentes
(`Modal`, `Toast`, `LoadingLogo`) são caseiros e minúsculos.

## 3. Camadas

```
src/main.tsx          BrowserRouter + StrictMode
  └── src/App.tsx     AuthProvider > ToastProvider > ScrollToTop > Routes
        ├── PublicLayout (Outlet)   →  src/pages/*.tsx        (10 páginas)
        └── RequireAuth > AdminLayout (Outlet)
                                    →  src/pages/admin/*.tsx  (5 telas)

src/lib/*.ts     ÚNICA camada que fala com Supabase (+ src/hooks/useAuth.tsx)
src/hooks/       contexto de autenticação
src/components/  UI compartilhada e layout público
```

A regra que sustenta tudo: **componentes nunca importam `supabase`
diretamente** — só funções tipadas de `src/lib/`. Isso concentra os nomes de
tabela, filtros e regras de negócio em três arquivos, e é o que permite as
mudanças de schema tolerantes descritas adiante.

### `src/lib/` — o núcleo

**[supabase.ts](src/lib/supabase.ts)** — cria o client único (sessão em
`localStorage`, `autoRefreshToken`, `flowType: "pkce"`), exporta os nomes dos
buckets e o helper `publicUrl(bucket, path)`. URL e anon key vêm de
`import.meta.env`, com fallback hardcoded para o projeto de produção.

**[cursos.ts](src/lib/cursos.ts)** (615 linhas, o módulo mais denso) — lê a
tabela `cursos` do SGE e concentra as regras do domínio:

- `fetchCursos()` — listagem pública. Filtra no servidor: não cancelado, não
  planejado, sem `percurso_id`, `inicio` dentro do ano corrente e `fim >= hoje`.
  Depois faz uma segunda query em `inscricoes` para contar inscritos por curso.
  Deduplica chamadas concorrentes com uma promise *in-flight* (StrictMode
  dispara o efeito duas vezes no dev).
- `statusDe()` — precedência: `fim < hoje` → **Finalizado**; senão
  `inscricoesAbertas()` (janela `inscricoes_inicio`/`inscricoes_fim` vigente) →
  **Inscrições abertas**; senão `inicio > hoje` → **Em breve**; senão **Em
  andamento**. Atenção: **Em breve** vem da data de início futura, não de
  `is_planejado` — cursos com `is_planejado = true` (não aprovados no SGE) são
  excluídos ainda na query. A janela é a mesma condição que o SGE avalia em
  `avaliarDisponibilidadeInscricao`, então os dois sistemas abrem e fecham a
  inscrição juntos, sem sincronização manual.
- `limiteInscricoes()` / `vagasRestantes()` / `emListaEspera()` — ocupação da
  inscrição. **`vagas` é o tamanho da turma; `max_inscricoes` é o teto de
  inscrições** configurado pelo gestor no SGE (na prática ~3× a turma, porque há
  seleção depois). O site conta as linhas de `inscricoes` com status `inscrito`
  contra esse teto; atingido o teto, o SGE continua aceitando e o candidato vai
  para a **lista de espera** — mesma regra de `avaliarDisponibilidadeInscricao`.
  `max_inscricoes` null/0 significa sem limite.
- `isVisivel()` / `isAtivoNoSite()` — visibilidade e janela de exibição.
- `selecionarDestaquesHome()` — escolhe até 3 cursos para a Home, preferindo um
  de cada status e completando com os mais próximos de iniciar
  (`compararProximidadeInicio`).
- `fetchCursoDivulgacao()` — monta o material do modal de inscrição juntando
  `cursos` + `unidades` + `pre_requisitos_atividade` + `curso_conteudos`.
- Escritas do admin: `setVisivelSite`, `setCursoImagem`,
  `removerCursoImagem` (upload no bucket `site-cursos` com rollback do objeto se
  o update falhar).
- Formatadores e rótulos: `fmtDataCurta`, `formatDiasSemana`,
  `formatCargaHoraria`, `DIAS_LABEL`, `PERIODOS_LABEL`, `STATUS_META`.

**[hero.ts](src/lib/hero.ts)** — fotos do carrossel da Home
(`site_hero_imagens` + bucket `site-hero`): CRUD, publicação, reordenação por
troca de `ordem` e `HERO_FALLBACK`, a lista original em `/public` usada
enquanto ninguém publicar foto no painel.

**[eventos.ts](src/lib/eventos.ts)** — CRUD de `site_eventos` +
`site_evento_fotos`, upload/remoção no bucket `site-eventos`, ordenação da
agenda (`ordenarEventosAgenda`, futuros primeiro) e conversão de datas BR ↔ ISO.

**[arquivos.ts](src/lib/arquivos.ts)** — editais e transparência em
`site_arquivos`: categorias (`compra`, `servicos`, `seletivo`, `transparencia`,
`outros`), subcategorias da página Transparência, badge Aberto/Encerrado, upload
no bucket `site-arquivos`, `fmtTamanho`/`tipoArquivo`.

**[unsplash.ts](src/lib/unsplash.ts)** — único serviço externo além do Supabase.
Busca fotos e as **baixa e re-hospeda** no bucket `site-cursos` (nada fica
hotlinkado). Degrada sozinho: sem `VITE_UNSPLASH_ACCESS_KEY`,
`unsplashConfigured()` retorna `false` e a UI mostra aviso, mantendo o upload
local.

**[refImages.ts](src/lib/refImages.ts)** — URLs do Wix antigo usadas como
placeholder visual (dívida técnica assumida, ver §7) e `CURSO_FALLBACK`, a logo
usada quando o curso não tem imagem.

### Contextos globais

**[useAuth.tsx](src/hooks/useAuth.tsx)** — sessão do Supabase Auth + perfil
(`public.profiles`) + flag `isAdmin`. `applySession()` carrega o perfil a cada
mudança de sessão e faz `signOut()` automático se `role !== 'admin'`; `signIn()`
repete a validação e devolve mensagem de erro em vez de lançar. O callback de
`onAuthStateChange` chama `void applySession(s)` sem `await` — awaitar dentro
dele causa deadlock no supabase-js.

**[Toast.tsx](src/components/Toast.tsx)** — `useToast()` global, pill escuro no
rodapé por ~2,6s. É o canal padrão de feedback de escrita no admin.

## 4. Rotas

Definidas inteiramente em [src/App.tsx](src/App.tsx).

**Públicas** — dentro de `<PublicLayout>` (header sticky, nav, CTA de doação,
footer): `/`, `/sobre`, `/projetos`, `/cursos`, `/eventos`, `/parceiros`,
`/editais`, `/transparencia`, `/doar`, `/contato`.

**Admin** — `/admin/login` fora da proteção; `/admin` envolvida por `RequireAuth`
(mostra "Carregando…" enquanto `loading`, redireciona para o login se faltar
sessão **ou** role admin) e por `AdminLayout` (sidebar + Outlet): `/admin`
(Dashboard), `/admin/eventos`, `/admin/arquivos`, `/admin/cursos`,
`/admin/hero`.

Qualquer outra rota cai em `<Navigate to="/" replace />`. `ScrollToTop` sobe a
página a cada navegação. A página `/cursos` persiste a busca em query string
(`?busca=`), então links compartilhados preservam o filtro.

## 5. Modelo de dados

O projeto Supabase é **compartilhado com o SGE** (sistema de gestão de cursos).
Daí toda a nomenclatura:

| Origem | Objetos | Acesso deste repo |
|---|---|---|
| Site (criados aqui) | `site_eventos`, `site_evento_fotos`, `site_arquivos`, `site_hero_imagens` | leitura + escrita |
| SGE (preexistentes) | `cursos` | leitura + escrita restrita a `visivel_site` e `imagem_url` |
| SGE | `inscricoes` | leitura + **insert** (formulário de inscrição do site) |
| SGE | `parceiros`, `unidades`, `conteudos`, `curso_conteudos`, `pre_requisitos_atividade`, `profiles` | somente leitura |
| Storage | `site-eventos`, `site-arquivos`, `site-cursos`, `site-hero` | leitura pública, escrita autenticada |

O prefixo `site_`/`site-` existe porque o SGE **já tem uma tabela `eventos`** com
schema completamente diferente (agenda de aulas). Colisão evitada por convenção,
não por schema separado.

### Migrações (`supabase/migrations/`, ordem cronológica)

1. `20260713120000_site_cmu.sql` — coluna `cursos.visivel_site`; tabelas
   `site_eventos`, `site_evento_fotos`, `site_arquivos`; índices; RLS; buckets
   `site-eventos` e `site-arquivos`.
2. `20260715160000_parceiros_select_public.sql` — sem essa policy o join
   `parceiros(id, nome)` volta null para o anon.
3. `20260715170000_conteudos_select_public.sql` — idem para
   `conteudos`/`curso_conteudos` no modal de inscrição.
4. `20260715180000_arquivos_visivel_site.sql` — `site_arquivos.visivel_site`.
5. `20260715190000_cursos_imagem_url.sql` — `cursos.imagem_url`, bucket
   `site-cursos`, e **recriação completa** das duas policies de
   `storage.objects` (elas listam os buckets explicitamente).
6. `20260829120000_site_hero_imagens.sql` — tabela `site_hero_imagens`, bucket
   `site-hero` e nova recriação das policies de `storage.objects`.

Padrão RLS em toda tabela do site: `select using (true)` para qualquer um;
`for all to authenticated using (true) with check (true)` para escrita. Ou seja,
**qualquer usuário autenticado do projeto Supabase pode escrever** — a restrição
a admins vive só no front (`useAuth`). Se isso precisar virar garantia real, o
caminho é uma policy checando `profiles.role`.

### Evolução tolerante de schema

`visivel_site` e `imagem_url` são declaradas opcionais nos tipos TS e tratadas
como ausentes-igual-a-visível (`c.visivel_site !== false`). O site funciona
contra um banco onde as migrações ainda não rodaram: os cursos aparecem, a
visibilidade só passa a ser respeitada depois da coluna existir. Preserve esse
comportamento ao adicionar colunas novas.

## 6. Fluxos representativos

**Listagem pública de cursos.** `Cursos.tsx` chama `fetchCursos()` num
`useEffect` com flag de cancelamento → filtra por `isVisivel` e `isAtivoNoSite`
→ filtros de status/busca em `useMemo` → cada card usa `statusDe()`,
`vagasRestantes()`, `imagem_url` (ou `CURSO_FALLBACK`). "Inscreva-se" abre
`InscricaoModal` (material de divulgação, via `fetchCursoDivulgacao()`), cujo
botão leva a `/cursos/:cursoId/inscricao`.

**Inscrição em curso.** `Inscricao.tsx` + `src/lib/inscricoes.ts` gravam direto
em `inscricoes` com a chave anon (policy `inscricoes_insert_public` do SGE),
com `origem = 'site_cmu'` — que o SGE exibe como "Site CMU", distinto de "Link"
(`inscricao_publica`, a página pública do próprio SGE, que continua no ar para
oficinas, eventos e links já distribuídos).

O formulário é uma **réplica** de
`cmu-cursos-planner/src/modules/inscricoes/pages/InscricaoPublica.tsx`: mesmos
campos, mesmas validações e as mesmas três travas em cascata — o CPF válido e
sem inscrição duplicada libera o formulário; o ViaCEP libera o endereço; a
declaração de pré-requisitos libera o envio. `status` (`inscrito` vs
`lista_espera`) é recalculado no envio, não na abertura da tela, porque a última
vaga pode ser ocupada enquanto o candidato preenche. Mudou a regra em um dos
repos? Replique no outro.

**Upload de imagem de curso (admin).** `AdminCursos` valida
(`validarImagemCurso`, máx. 2 MB) → `setCursoImagem()` sobe para `site-cursos` →
`update` em `cursos.imagem_url` → se o update falhar, remove o objeto recém-
subido; se havia imagem anterior, remove a antiga. Pela aba Unsplash, a foto é
baixada e re-hospedada pelo mesmo caminho.

**Publicação de um edital.** `AdminArquivos` → `publicarArquivo()` sobe para
`site-arquivos` e insere em `site_arquivos` (categoria, subcategoria, mime,
tamanho). A página pública `Editais`/`Transparencia` lê via `fetchArquivos()`,
que já filtra publicados/visíveis, e monta o link com `urlArquivo()`.

**Login.** `Login.tsx` → `signIn()` → `signInWithPassword` → carrega `profiles` →
se não for admin, `signOut()` e mensagem de acesso restrito; se for, a sessão
persiste em `localStorage` e `RequireAuth` libera `/admin`.

**Contrato de erro.** Leituras: `console.error` + retorno vazio (a página nunca
quebra). Escritas: `throw new Error(error.message)`, capturado na tela e exibido
via `useToast()`.

## 7. Estado atual e limites conhecidos

Assumidos e documentados, não descuidos:

- **Sem testes e sem lint funcional.** `npm run lint` chama `eslint .` sem ESLint
  instalado nem config. O gate real é `npm run build` (`tsc -b`).
- **Credenciais de produção no fonte.** [supabase.ts](src/lib/supabase.ts) tem
  URL e anon key hardcoded como fallback. É chave `anon` sob RLS, mas ainda assim
  é credencial de produção versionada.
- **Escrita liberada a qualquer autenticado** no RLS (ver §5).
- **Imagens hotlinkadas do Wix** em [refImages.ts](src/lib/refImages.ts) —
  precisam ser baixadas e re-hospedadas antes do go-live.
- **Formulário de contato não envia**
  ([Contato.tsx:42](src/pages/Contato.tsx:42)); o caminho previsto é edge
  function ou serviço de e-mail.
- **Placeholders do cliente**: PIX/dados bancários em
  [Doar.tsx](src/pages/Doar.tsx), logos em
  [Parceiros.tsx](src/pages/Parceiros.tsx).
- **Sem cache entre navegações**: cada página refaz suas queries a cada mount (só
  o `fetchCursos` in-flight evita duplicatas simultâneas). Aceitável no volume
  atual.

## 8. Onde mexer

| Objetivo | Comece por |
|---|---|
| Nova página pública | `src/pages/`, registrar rota em `App.tsx`, item em `NAV` no `PublicLayout` |
| Nova tela de admin | `src/pages/admin/`, rota filha de `/admin` em `App.tsx`, link no `AdminLayout` |
| Nova entidade de dados | migração em `supabase/migrations/` (tabela `site_*` + RLS + bucket se precisar) → módulo em `src/lib/` → só então a UI |
| Fotos do carrossel da Home | `src/lib/hero.ts` + `src/pages/admin/AdminHero.tsx` |
| Mudar regra de status/visibilidade de curso | `src/lib/cursos.ts` (`statusDe`, `inscricoesAbertas`, `isVisivel`, `isAtivoNoSite`) |
| Mexer no formulário de inscrição | `src/lib/inscricoes.ts` + `src/pages/Inscricao.tsx` — e replique no SGE |
| Ajustar cores, sombras, fontes | `tailwind.config.ts` (não CSS solto) |
| Autenticação / autorização | `src/hooks/useAuth.tsx` + `src/pages/admin/RequireAuth.tsx` |
| Config de deploy | `vercel.json`, `public/_redirects` |
