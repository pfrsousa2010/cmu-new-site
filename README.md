# Site + Painel Admin — Clube das Mães Unidas

Site público da ONG (Londrina/PR) + painel administrativo (CMS), implementado a
partir do design em `design_handoff_site_cmu/`.

**Stack:** React + Vite + TypeScript + Tailwind CSS + React Router + Supabase.

## Rodar localmente

```bash
npm install
npm run dev
```

O app sobe em `http://localhost:5173`. O painel fica em `/admin`.

As credenciais do Supabase já vêm no `.env` (mesmo projeto do sistema de cursos,
`qnbrmgwlopirujzcgziu`). Para outro projeto, edite `.env`
(`VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`).

## Passo obrigatório: banco de dados

Antes de o painel funcionar por completo, rode as migrações no **SQL Editor do
Supabase** (ou `supabase db push`), nesta ordem:

```
supabase/migrations/20260713120000_site_cmu.sql
supabase/migrations/20260715160000_parceiros_select_public.sql
supabase/migrations/20260715170000_conteudos_select_public.sql
supabase/migrations/20260715180000_arquivos_visivel_site.sql
supabase/migrations/20260715190000_cursos_imagem_url.sql
```

A migração principal (`site_cmu`) cria:
- coluna `visivel_site` em `cursos` (default `true`);
- tabelas `site_eventos`, `site_evento_fotos`, `site_arquivos`;
- RLS (leitura pública, escrita só autenticado);
- buckets de Storage `site-eventos` e `site-arquivos` (leitura pública).

A migração `cursos_imagem_url` cria a coluna `imagem_url` em `cursos` e o bucket
`site-cursos` (fotos dos cards, gerenciadas no Admin → Cursos).

> **Projeto Supabase compartilhado:** este é o mesmo projeto do sistema de gestão
> de cursos, que já possui uma tabela `eventos` (agenda de aulas, com schema
> diferente). Por isso as tabelas do site público usam o prefixo `site_` e os
> buckets o prefixo `site-`, sem colidir com o sistema existente.

> Antes de rodar a migração, o site já funciona: os cursos aparecem (a
> visibilidade só passa a ser respeitada depois da coluna existir) e as seções de
> eventos/editais/transparência mostram estado vazio.

## Unsplash (busca de imagens no Admin)

No painel **Cursos (SGE)**, cada curso pode ter uma imagem anexada do computador
ou buscada no Unsplash. Crie um app em
[unsplash.com/developers](https://unsplash.com/developers) e adicione no `.env`:

```
VITE_UNSPLASH_ACCESS_KEY=sua_access_key_aqui
```

Reinicie o `npm run dev` após alterar o `.env`. Sem a chave, o upload local
continua disponível; a aba “Buscar na internet” mostra um aviso.

As fotos escolhidas no Unsplash são **baixadas e salvas** no bucket `site-cursos`
(não ficam hotlinkadas).

## Acesso ao painel admin

O login usa **Supabase Auth (e-mail/senha)**. Crie um usuário admin em
**Authentication → Users → Add user** no dashboard do Supabase, ou reuse um
usuário existente do sistema de cursos. Qualquer usuário autenticado tem acesso
de escrita (conforme o handoff).

## O que cada tela faz

### Site público (`/`)
Home, Sobre nós, Projetos, **Cursos** (dados ao vivo da tabela `cursos`),
Eventos, Parceiros, Editais, Transparência, Doar (PIX/banco — placeholders) e
Contato (formulário com estado de sucesso; envio real é TODO — sugerido edge
function/serviço de e-mail).

Regra de status dos cursos: `is_planejado` → **Em breve**; senão
`inscricoes_ativa` → **Inscrições abertas**; senão **Em andamento**. Cursos com
`is_cancelado = true` são excluídos e os ocultos (`visivel_site = false`) não
aparecem. Sem `imagem_url`, o card usa a logo CMU.

### Painel (`/admin`)
- **Visão geral** — stats derivados do Supabase + atividade recente + ações rápidas.
- **Eventos e fotos** — CRUD de eventos; fotos vão para o bucket `site-eventos`.
- **Editais e arquivos** — upload para o bucket `site-arquivos` + registro na tabela.
- **Cursos (SGE)** — lista sincronizada com o SGE; imagem do card (anexar ou Unsplash),
  toggles de Inscrições (`inscricoes_ativa`) e Visível no site (`visivel_site`).

## Placeholders a substituir pelo cliente
- QR code / chave PIX e dados bancários (`src/pages/Doar.tsx`).
- Logos dos parceiros (`src/pages/Parceiros.tsx`).
- Fotos de referência do Wix (`src/lib/refImages.ts`) — baixar e re-hospedar no
  Storage.
- Envio do formulário de contato.

## Build / deploy

```bash
npm run build     # gera dist/
```

Deploy em Vercel ou Netlify. Como é SPA com React Router, garanta o fallback para
`index.html` (Vercel: `vercel.json` de rewrite; Netlify: `_redirects` com
`/* /index.html 200`).

## Estrutura

```
src/
  App.tsx              rotas públicas + /admin protegida
  lib/                 supabase, cursos, eventos, arquivos, refImages
  hooks/useAuth.tsx    contexto de autenticação
  components/          PublicLayout, Modal, Toast, ScrollToTop
  pages/               10 páginas públicas
  pages/admin/         Login, AdminLayout, RequireAuth, Dashboard, ...
supabase/migrations/   SQL da migração
```
