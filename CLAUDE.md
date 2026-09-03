# CLAUDE.md

Guia para agentes de IA trabalhando neste repositório. Para a visão de
arquitetura (camadas, fluxo de dados, modelo do banco), veja
[ARCHITECTURE.md](ARCHITECTURE.md). Para instruções de operação do produto
(rodar migrações, criar usuário admin, placeholders do cliente), veja
[README.md](README.md).

## O que é este projeto

Site público + painel administrativo do **Clube das Mães Unidas** (ONG de
Londrina/PR). SPA em React + Vite + TypeScript + Tailwind, com Supabase como
backend (Postgres + Auth + Storage). Não há backend próprio: o navegador fala
direto com o Supabase, e a segurança é feita por **RLS**.

Idioma: **todo o código, comentários, nomes de variáveis, tipos e UI estão em
português**. Mantenha essa convenção — `fetchCursos`, `statusDe`,
`vagasRestantes`, `CursoRow`, `EventoInput`. Nomes de funções misturam verbo em
inglês (`fetch`, `set`) com substantivo em português quando é padrão de acesso a
dados; siga o arquivo que você está editando.

## Comandos

```bash
npm run dev
```

```bash
npm run build
```

- `npm run dev` — Vite em `http://localhost:5173`; painel em `/admin`.
- `npm run build` — `tsc -b && vite build && node scripts/admin-shell.js`; é o
  único gate de qualidade do projeto (não há testes). **Rode antes de
  considerar uma mudança pronta.**
- `npm run preview` — serve o `dist/`.
- `npm run icones-pwa` — regera `public/icons/` a partir do `logo-cmu.png`. Só
  precisa rodar se a logo mudar; os PNGs são versionados.
- `npm run lint` — **quebrado**: o script chama `eslint .`, mas ESLint não está
  nas dependências e não há arquivo de config. Não use como verificação; se for
  consertar, instale o ESLint e adicione a config no mesmo commit.

Não há suíte de testes. Verificação de mudanças = `npm run build` + conferir a
tela afetada no `npm run dev`.

## Convenções que importam

**Imports.** Use o alias `@/` para tudo dentro de `src/` (`@/lib/cursos`,
`@/components/Modal`). Está configurado em [vite.config.ts](vite.config.ts) e
[tsconfig.app.json](tsconfig.app.json). Caminhos relativos aparecem só em
[src/App.tsx](src/App.tsx) — não replique isso em código novo.

**Nada de CSS solto.** Toda a estilização é Tailwind inline no JSX. O único CSS
é [src/index.css](src/index.css) (base layer). Cores, sombras, radii, fontes e
animações vêm dos tokens de [tailwind.config.ts](tailwind.config.ts) —
`verde`/`azul`/`laranja`/`vermelho`, `ink`/`ink-2`/`ink-mid`, `site-bg`,
`admin-bg`, `rounded-card`, `shadow-card-hover`, `font-display`, `max-w-container`.
Prefira estender o config a escrever valores arbitrários repetidos.

**Regra de ouro do acesso a dados:** componentes não chamam `supabase`
diretamente. Toda query/mutação mora em [src/lib/](src/lib/) (`cursos.ts`,
`eventos.ts`, `arquivos.ts`) ou em [src/hooks/useAuth.tsx](src/hooks/useAuth.tsx).
Páginas importam funções tipadas e formatadores desses módulos. Ao adicionar uma
entidade nova, crie o módulo em `src/lib/` primeiro.

**Formatação e regras de negócio ficam em `src/lib/`, não no JSX.** Datas
(`fmtDataCurta`, `fmtDataBR`, `fmtDiaMes`), status (`statusDe`,
`inscricoesAbertas`), visibilidade (`isVisivel`, `isArquivoVisivel`), rótulos
(`DIAS_LABEL`, `PERIODOS_LABEL`, `STATUS_META`, `CATEGORIA_LABEL`). Se você
precisou de um `if` sobre regra de negócio dentro de um `.tsx`, provavelmente
ele pertence ao `lib`.

**Erros.** As funções de leitura logam com `console.error` e devolvem `[]` (a
página nunca quebra por falha de rede). As de escrita fazem `throw` do
`error.message`; quem chama captura e mostra `useToast()`. Mantenha esse
contrato ao escrever funções novas.

**Estado é local.** Não há Redux/Zustand/React Query. Só `useState`/`useEffect`
por página, mais dois contextos globais: `AuthProvider` e `ToastProvider`. Não
introduza uma lib de estado sem necessidade real.

**React 18 StrictMode está ligado** — efeitos rodam duas vezes no dev.
`fetchCursos()` deduplica chamadas concorrentes por causa disso
([src/lib/cursos.ts:266](src/lib/cursos.ts:266)); efeitos que buscam dados usam
uma flag `ativo`/`cancelled` no cleanup. Siga o padrão.

## Armadilhas específicas deste projeto

**O projeto Supabase é COMPARTILHADO** com o sistema de gestão de cursos (SGE).
Consequências:

- Tabelas do site usam prefixo `site_` (`site_eventos`, `site_evento_fotos`,
  `site_arquivos`) e buckets usam `site-`. Já existe uma tabela `eventos` no
  projeto, com schema totalmente diferente (agenda de aulas) — **nunca** escreva
  nela.
- Tabelas sem prefixo (`cursos`, `inscricoes`, `parceiros`, `unidades`,
  `profiles`, `conteudos`, `curso_conteudos`, `pre_requisitos_atividade`)
  pertencem ao SGE. Este repositório **lê** todas elas e escreve em apenas duas:
  em `cursos`, só nas colunas `visivel_site` e `imagem_url`; e em `inscricoes`,
  só `insert`, pelo formulário de inscrição do site
  ([src/lib/inscricoes.ts](src/lib/inscricoes.ts)). Não altere outras colunas de
  `cursos`, não atualize nem apague linhas de `inscricoes`, e não crie/apague
  linhas das demais tabelas do SGE.

**O formulário de inscrição é uma réplica do formulário público do SGE**
(`cmu-cursos-planner/src/modules/inscricoes/pages/InscricaoPublica.tsx`). Campos,
validações, máscaras, listas de opções (`fichaOpcoes.ts`), regra de lista de
espera e o payload do insert precisam continuar iguais aos de lá — os dois
alimentam a mesma tabela e a mesma triagem. Ao mexer em um, replique no outro.
A única diferença deliberada é `origem`: `site_cmu` aqui, `inscricao_publica` lá.

**Colunas opcionais.** `visivel_site` e `imagem_url` foram adicionadas por
migração e podem não existir em um banco desatualizado. Por isso os tipos as
declaram opcionais e `isVisivel()` trata `undefined`/`null` como visível — só
`false` esconde. Preserve essa tolerância.

**Chaves do Supabase têm fallback hardcoded** em
[src/lib/supabase.ts](src/lib/supabase.ts) (URL + anon key do projeto de
produção). É a chave `anon`, protegida por RLS, mas continua sendo credencial de
produção comprometida no fonte. Não adicione novas chaves ali, e **nunca**
coloque a `service_role` no cliente. `.env` está no `.gitignore`.

**Migrações não são aplicadas automaticamente.** Ao criar uma migração em
`supabase/migrations/`, siga o padrão `YYYYMMDDHHMMSS_descricao.sql`, escreva
SQL idempotente (`if not exists`, `drop policy if exists` antes de `create
policy`) e avise que ela precisa ser rodada no SQL Editor do Supabase. Toda
tabela nova precisa de RLS: `select` público, escrita só para `authenticated`.
Bucket novo exige atualizar as duas policies em `storage.objects` — elas listam
os buckets explicitamente e são recriadas por inteiro a cada migração (veja
[20260715190000_cursos_imagem_url.sql](supabase/migrations/20260715190000_cursos_imagem_url.sql)).

**Autorização não é só "estar logado".** O RLS libera escrita para qualquer
usuário `authenticated`, mas o app exige `profiles.role === 'admin'`:
`useAuth` carrega o perfil e faz `signOut()` automático se a role não for admin
([src/hooks/useAuth.tsx](src/hooks/useAuth.tsx)). Isso é uma trava de UI — não
confie nela como fronteira de segurança nem enfraqueça o check.

**`onAuthStateChange` não pode fazer `await` no callback** (deadlock do
supabase-js). O código dispara `void applySession(s)` de propósito; mantenha
assim.

**Storage e banco não são transacionais.** Os deletes fazem best-effort:
removem o objeto do bucket e depois a linha (`removerEvento`, `removerArquivo`,
`setCursoImagem` fazendo rollback do upload em caso de erro). Ao escrever fluxos
novos de upload, limpe o objeto órfão quando o insert/update falhar.

**Fallback SPA.** Rotas do React Router dependem de rewrite para
`index.html`: [vercel.json](vercel.json) na Vercel,
[public/_redirects](public/_redirects) na Netlify. Se adicionar outra plataforma,
configure o fallback. Atenção: `/admin` e `/admin/*` têm rewrite **próprio**,
antes do catch-all — veja abaixo.

**Só o painel é instalável (PWA).** [scripts/admin-shell.js](scripts/admin-shell.js)
roda no fim do `npm run build` e gera dois arquivos que não existem no `src/`:

- `dist/admin/index.html` — a mesma aplicação React, mas com o manifesto e as
  metas do iOS. O painel precisa de um HTML próprio porque o manifesto **não
  pode** aparecer nas páginas do site: quem visita o site não deve receber
  convite para instalar nada. Esse HTML é montado do zero, e não filtrado a
  partir do `index.html` — assim nenhuma meta nova do site vaza para o painel.
- `dist/admin/sw.js` — o service worker. Mora dentro de `/admin/` de propósito:
  um service worker só controla o diretório onde está, e é isso que impede o
  site público de virar parte do aplicativo. A lista de precache e o nome do
  cache saem dos nomes hasheados do Vite, então não há versão para bumpar na mão.

Consequências ao mexer aqui: `start_url` e `scope` em
[public/admin-manifest.json](public/admin-manifest.json) precisam **os dois**
terminar em barra (`/admin/`) — se o `start_url` cair fora do `scope`, o
navegador descarta o `scope` declarado e adota o diretório do `start_url`, que
para `/admin` seria `/`, ou seja, o site inteiro. O service worker só é
registrado em produção e só sob `/admin`
([src/lib/pwa.ts](src/lib/pwa.ts)); no `npm run dev` não existe nenhum. E o
painel esconde o link "Voltar ao site" quando está instalado
([AdminLayout.tsx](src/pages/admin/AdminLayout.tsx)), porque sair do `scope`
abriria uma barra de navegador por cima do app.

## Pendências conhecidas (não são bugs)

- Formulário de contato não envia nada — só mostra estado de sucesso
  ([src/pages/Contato.tsx:42](src/pages/Contato.tsx:42)).
- PIX, dados bancários e logos dos parceiros já são os reais. O QR do PIX é
  [public/pix-qrcode.png](public/pix-qrcode.png), extraído do PDF do banco; se
  a chave mudar, o QR precisa ser trocado junto — um não valida o outro.
- [src/lib/refImages.ts](src/lib/refImages.ts) faz hotlink de imagens do Wix
  antigo; precisam ser re-hospedadas no Storage antes do go-live.
- Unsplash (`VITE_UNSPLASH_ACCESS_KEY`) é opcional; sem a chave o Admin → Cursos
  mantém o upload local e avisa na aba de busca.
