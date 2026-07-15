-- =============================================================
-- Redesign do site + Painel Admin — Clube das Mães Unidas
-- Rode este script no SQL Editor do Supabase (projeto qnbrmgwlopirujzcgziu)
-- ou via `supabase db push`.
--
-- IMPORTANTE: o projeto Supabase é COMPARTILHADO com o sistema de gestão de
-- cursos, que já possui uma tabela `eventos` (agenda de aulas — schema
-- totalmente diferente). Por isso as tabelas do SITE PÚBLICO usam o prefixo
-- `site_` e os buckets usam o prefixo `site-`, evitando qualquer colisão.
-- =============================================================

-- ---------- 1. Coluna nova na tabela `cursos` já existente ----------
alter table public.cursos
  add column if not exists visivel_site boolean not null default true;

-- ---------- 2. Tabelas novas (site público) ----------
create table if not exists public.site_eventos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descricao text,
  data date not null,
  hora text,
  publicado boolean not null default true,
  created_at timestamptz default now()
);

create table if not exists public.site_evento_fotos (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid references public.site_eventos(id) on delete cascade,
  storage_path text not null,
  ordem int default 0
);

create table if not exists public.site_arquivos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  categoria text not null
    check (categoria in ('compra','servicos','seletivo','transparencia','outros')),
  -- Agrupamento na página Transparência (só usado quando categoria = 'transparencia')
  subcategoria text
    check (subcategoria in ('institucionais','convenios','plano','relatorios')),
  -- Badge Aberto/Encerrado nos editais (compra/servicos/seletivo)
  encerrado boolean not null default false,
  storage_path text not null,
  mime text,
  tamanho_bytes bigint,
  publicado_em timestamptz default now()
);

create index if not exists idx_site_evento_fotos_evento on public.site_evento_fotos(evento_id);
create index if not exists idx_site_arquivos_categoria on public.site_arquivos(categoria);

-- ---------- 3. Row Level Security ----------
-- Leitura pública (anon); escrita apenas para usuários autenticados (admin).
alter table public.site_eventos       enable row level security;
alter table public.site_evento_fotos  enable row level security;
alter table public.site_arquivos      enable row level security;

-- site_eventos
drop policy if exists "site_eventos_select_public" on public.site_eventos;
create policy "site_eventos_select_public" on public.site_eventos
  for select using (true);
drop policy if exists "site_eventos_write_auth" on public.site_eventos;
create policy "site_eventos_write_auth" on public.site_eventos
  for all to authenticated using (true) with check (true);

-- site_evento_fotos
drop policy if exists "site_evento_fotos_select_public" on public.site_evento_fotos;
create policy "site_evento_fotos_select_public" on public.site_evento_fotos
  for select using (true);
drop policy if exists "site_evento_fotos_write_auth" on public.site_evento_fotos;
create policy "site_evento_fotos_write_auth" on public.site_evento_fotos
  for all to authenticated using (true) with check (true);

-- site_arquivos
drop policy if exists "site_arquivos_select_public" on public.site_arquivos;
create policy "site_arquivos_select_public" on public.site_arquivos
  for select using (true);
drop policy if exists "site_arquivos_write_auth" on public.site_arquivos;
create policy "site_arquivos_write_auth" on public.site_arquivos
  for all to authenticated using (true) with check (true);

-- ---------- 4. Storage buckets ----------
insert into storage.buckets (id, name, public)
  values ('site-eventos', 'site-eventos', true)
  on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
  values ('site-arquivos', 'site-arquivos', true)
  on conflict (id) do nothing;

-- Leitura pública dos objetos; upload/remoção apenas autenticado.
drop policy if exists "site_storage_public_read" on storage.objects;
create policy "site_storage_public_read" on storage.objects
  for select using (bucket_id in ('site-eventos','site-arquivos'));

drop policy if exists "site_storage_auth_write" on storage.objects;
create policy "site_storage_auth_write" on storage.objects
  for all to authenticated
  using (bucket_id in ('site-eventos','site-arquivos'))
  with check (bucket_id in ('site-eventos','site-arquivos'));
