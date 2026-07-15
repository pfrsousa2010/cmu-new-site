# Handoff: Redesign do site + Painel Admin — Clube das Mães Unidas

## Overview
Redesign completo do site público da ONG Clube das Mães Unidas (Londrina/PR, atualmente em Wix: clubedasmaesunidas.org.br) mais um painel administrativo (CMS) para o cliente gerenciar eventos/fotos, editais/arquivos, e a visibilidade de cursos vindos do Supabase.

## About the Design Files
Os arquivos `.dc.html` neste pacote são **referências de design em HTML** — protótipos que mostram aparência e comportamento pretendidos, **não código de produção**. A tarefa é **recriar estes designs na stack alvo** definida abaixo, usando seus padrões e bibliotecas. Ignore o boilerplate do runtime (`support.js`, tags `<x-dc>`, `sc-if`/`sc-for`, `{{ holes }}`) — leia-os apenas como especificação de layout (todos os estilos são inline) e de lógica (classe `Component` no final de cada arquivo).

## Target Stack (decidida com o cliente)
- **React + Vite** (mesma stack do sistema de cursos já existente do cliente)
- **Tailwind CSS** (tokens abaixo no config)
- **React Router** — rotas públicas + `/admin` protegida
- **Supabase** (projeto já existente do cliente):
  - Tabela `cursos` — **já existe**, leitura direta (schema abaixo)
  - **Auth** — login do admin (e-mail/senha), proteger `/admin`
  - **Storage** — fotos de eventos e PDFs de editais/documentos
  - Tabelas novas a criar: `eventos`, `evento_fotos`, `arquivos` (sugestão de schema abaixo)
- **Hospedagem**: Vercel ou Netlify

## Fidelity
**High-fidelity (hifi).** Cores, tipografia, espaçamentos, raios e copy são finais. Recriar fielmente. Exceções (placeholders a substituir pelo cliente): QR code/chave PIX, dados bancários, logos de parceiros, e-mail de contato.

## Design Tokens

### Cores (das 4 cores do logo)
| Token | Hex | Uso |
|---|---|---|
| verde | `#62b32e` | primária de ação positiva (inscrever-se, salvar), status "inscrições abertas", missão |
| verde-escuro (texto) | `#4a8c20` | texto sobre fundo verde claro |
| verde hover | `#52991f` | hover de botões verdes |
| azul | `#2e6fb7` | links, nav ativa, botões primários, status "em andamento" |
| azul hover | `#245c9c` | hover de botões azuis |
| laranja | `#ee7623` | CTA "Doe aqui", status "em breve", acentos |
| laranja hover | `#d96613` | hover |
| vermelho | `#d13a41` | editais/PDF, remover, destaques |
| vermelho hover | `#b52c34` | hover |
| fundo site | `#faf8f5` | body do site público |
| fundo admin | `#f4f1ec` | body do painel |
| superfície | `#ffffff` | cards |
| fundo sutil | `#f0ede8` | trilhas de barra de progresso, hover de linha |
| escuro | `#26333f` | footer, sidebar do admin, toast |
| texto | `#2b2622` | texto principal |
| texto secundário | `#6f675f` | descrições |
| texto terciário | `#a09a91` | metadados |
| texto médio | `#5a544d` | chips, células de tabela |
| borda | `rgba(0,0,0,.07)` a `.13` | bordas de card e inputs |

### Tipografia (Google Fonts)
- **Nunito** (700–900) — títulos, botões, números de destaque. `font-family:'Nunito',sans-serif`
- **Nunito Sans** (400–700) — corpo. Base do body.
- Escala site público: h1 42–54px/900, h2 34px/900, título de card 18–20px/800, corpo 14.5–18px, metadados 12–13px.
- Admin: h1 28px/900, título de card 17px/800, corpo 14–15px.

### Raios e sombras
- Cards: 16–22px; botões/chips/pills: 999px; inputs: 11–12px; imagens: 10–14px; modais: 22px.
- Sombra de botão primário: `0 3px 10px rgba(<cor>,.3)`; hover de card: `0 8–10px 24–28px rgba(0,0,0,.08–.1)`; modal: overlay `rgba(20,25,30,.5)` + card branco.

### Padrões recorrentes
- Cards com **borda superior de 4–6px** na cor da categoria (stats, pilares, doação).
- Cards de info com **borda esquerda de 5px** colorida (missão/visão/valores, contato).
- Chips de filtro: pill, preenchida na cor ativa (azul no site/cursos, vermelho em editais, `#26333f` no admin), branca com borda `rgba(0,0,0,.12)` quando inativa.
- Badge de status sobre imagem: pill preenchida (verde/azul/laranja).
- Toggle switch (admin): 46×26px, knob branco 20px; verde = inscrições, azul = visível.

## Screens / Views — Site público (`Site Clube das Mães Unidas.dc.html`)
SPA com header sticky (blur, `rgba(255,255,255,.94)`) + footer escuro em todas as páginas. Nav: Início, Sobre nós, Projetos, Cursos, Eventos, Parceiros, Editais, Transparência, Contato + botão laranja "Doe aqui ♥". Container: max-width 1160px, padding lateral 24px.

1. **Home** — badge verde "Inscrições abertas", h1 54px "Capacitando para um mundo melhor" (palavras coloridas), parágrafo, 2 CTAs; imagem hero 400px arredondada com card flutuante de estatísticas (+30 anos, +500 alunos, 100% gratuito); 3 pilares clicáveis (Missão/Agenda/Cursos, borda superior verde/azul/laranja); seção "Fique por dentro" com 3 cards de destaque; citação de Hélio Terzoni + CTAs finais.
2. **Sobre nós** — intro, foto grande + 3 cards (Missão/Visão/Valores) com borda esquerda colorida.
3. **Projetos** — 2 cards grandes: SCFV (azul) e Educação Socioprofissional (verde), com barra superior de 8px, kicker em caps, título e descrição.
4. **Cursos** ⚠ **dados do Supabase** — filtros por status (Todos/Inscrições abertas/Em andamento/Em breve); grid 3 col de cards: imagem com badge de status, título, "Prof. {nome}", chips (📅 dias, 🕐 período, ⏱ carga horária), datas, barra de vagas (`vagas - qtd_alunos_iniciaram`), botão "Inscreva-se" só quando inscrições abertas.
5. **Eventos** — lista vertical: bloco de data (dia grande + mês, fundo tint da cor), foto 110×74, título + descrição, hora à direita.
6. **Parceiros** — grid 4 col de slots de logo (placeholders).
7. **Editais** — 3 abas (Editais de compra / Prestação de serviços / Processo seletivo); linhas com ícone PDF vermelho, nome, data + tamanho, badge Aberto/Encerrado, link "Baixar ↓".
8. **Transparência** — grid 2 col de cards por categoria (Documentos institucionais/Convênios/Plano de trabalho/Relatórios), cada um com lista de PDFs baixáveis.
9. **Doe aqui** — card PIX (QR + chave CNPJ, borda superior verde) + card transferência bancária (borda azul) + instrução de comprovante via WhatsApp. *Somente informativo, sem gateway.*
10. **Contato** — cards de endereço/telefone/redes (borda esquerda colorida) + formulário (nome, e-mail/telefone, mensagem) com estado de sucesso "✓ Mensagem enviada!".

### Mapeamento Cursos ⇄ Supabase (tabela `cursos` existente)
Campos usados: `titulo`, `professor`, `inicio`, `fim`, `periodo` (enum manha/tarde/noite), `dia_semana` (array enum seg…sab), `vagas`, `qtd_alunos_iniciaram`, `carga_horaria_total`, `inscricoes_ativa`, `is_planejado`, `is_cancelado`.
Regra de status: `is_planejado → "Em breve"(laranja)`; senão `inscricoes_ativa → "Inscrições abertas"(verde)`; senão `"Em andamento"(azul)`. Excluir `is_cancelado=true`. Vagas restantes: `max(vagas - qtd_alunos_iniciaram, 0)`. Datas exibidas `dd/mm/aa`. Imagem do curso: não existe na tabela — sugerir coluna `imagem_url` ou bucket no Storage.

## Screens / Views — Painel Admin (`Painel Admin.dc.html`)
Layout: sidebar fixa escura 240px (`#26333f`) com logo, menu (Visão geral, Eventos e fotos, Editais e arquivos, Cursos (Supabase)) e usuário logado no rodapé; conteúdo com padding 32/36px. Acesso: rota `/admin` protegida por Supabase Auth.

1. **Visão geral** — saudação, 4 stat cards (cursos visíveis, inscrições abertas, próximos eventos, arquivos publicados — borda superior verde/azul/laranja/vermelho), atividade recente (lista com dot colorido + tempo relativo), ações rápidas (3 botões tintados que navegam).
2. **Eventos e fotos** — lista de eventos (thumb 96×64, título, data · hora · nº fotos, badge Publicado/Passado, ações Editar/Remover); botão "+ Novo evento" (azul). **Modal** criar/editar: título, data, horário, descrição, grade de fotos com remover (✕ vermelho no canto) e slot "+ Adicionar" tracejado; Cancelar/Salvar (verde). Fotos → Supabase Storage.
3. **Editais e arquivos** — abas de categoria (Todos/compra/serviços/seletivo/transparência), lista com ícone PDF, nome, categoria · data · tamanho, Baixar/Remover; botão "+ Publicar arquivo" (vermelho). **Modal de upload**: dropzone tracejada (estado sucesso verde "✓ arquivo selecionado"), nome de exibição, chips de categoria, Publicar. Arquivos → Storage + registro na tabela `arquivos`.
4. **Cursos (Supabase)** — badge "● Sincronizado com Supabase"; tabela somente leitura (curso+datas, professor, período, vagas) com **2 toggles editáveis por linha**: Inscrições (verde, grava `inscricoes_ativa`) e Visível no site (azul — requer coluna nova `visivel_site boolean default true` na tabela `cursos`, ou tabela auxiliar).
5. **Toast** — pill escura centrada no rodapé, ~2.6s, para toda ação (salvo, removido, publicado, toggles).

### Schema sugerido (tabelas novas)
```sql
create table eventos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descricao text,
  data date not null,
  hora text,
  publicado boolean not null default true,
  created_at timestamptz default now()
);
create table evento_fotos (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid references eventos(id) on delete cascade,
  storage_path text not null,
  ordem int default 0
);
create table arquivos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  categoria text not null check (categoria in ('compra','servicos','seletivo','transparencia','outros')),
  storage_path text not null,
  mime text, tamanho_bytes bigint,
  publicado_em timestamptz default now()
);
-- RLS: leitura pública (anon) para tudo; escrita apenas authenticated (admin).
```

## Interactions & Behavior
- Navegação sem reload (React Router); scroll para topo ao trocar de página.
- Hovers: cards ganham sombra; botões escurecem (hexes acima); nav items com fundo `rgba(46,111,183,.08)`.
- Filtros/abas: troca instantânea de lista, sem transição.
- Modais: overlay clicável fecha; clique interno não propaga.
- Validações admin: evento exige título; upload exige arquivo; feedback sempre via toast.
- Formulário de contato: estado de sucesso inline (sem navegação). Backend sugerido: função edge do Supabase ou serviço de e-mail.
- Responsivo: desktop e mobile com igual prioridade — colapsar grids para 1 coluna, nav vira menu hambúrguer, hit targets ≥ 44px.

## Assets
- `uploads/logo-cmu.png` — logo oficial (fundo claro); `uploads/logo-dark-theme.png` — versão para footer escuro.
- Fotos: URLs do Wix atual (static.wixstatic.com) usadas como referência — **baixar e re-hospedar no Supabase Storage** na implementação.
- Placeholders a substituir: QR/chave PIX, dados bancários, logos de parceiros.

## Files
- `Site Clube das Mães Unidas.dc.html` — site público completo (10 páginas)
- `Painel Admin.dc.html` — painel admin completo (4 seções + modais)
- `uploads/` — logos
