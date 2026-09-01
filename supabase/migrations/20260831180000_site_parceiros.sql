-- Logos dos parceiros exibidos na página /parceiros, gerenciados pelo painel.
-- Antes disso a página mostrava oito quadrados de placeholder em
-- src/pages/Parceiros.tsx. Enquanto a tabela estiver vazia esses placeholders
-- continuam aparecendo, para a página nunca ficar em branco.
--
-- Por que tabela própria e não uma coluna em `parceiros`: a tabela `parceiros`
-- é do SGE e cadastra parceiros de CURSO (quem oferta a turma, exibido como
-- "Em parceria com X" no card). A página institucional mostra quem apoia o
-- Clube, que nem sempre é parceiro de curso — e este repositório não escreve
-- em tabelas do SGE sem combinar com quem as mantém.

create table if not exists public.site_parceiros (
  id uuid primary key default gen_random_uuid(),
  -- Nome da instituição; vira o alt do logo (acessibilidade) e a legenda.
  nome text not null,
  storage_path text not null,
  ordem int not null default 0,
  -- Toggle do painel: false tira o logo do site sem apagar o arquivo.
  ativo boolean not null default true,
  created_at timestamptz default now()
);

create index if not exists idx_site_parceiros_ordem
  on public.site_parceiros(ordem);

-- ---------- RLS: leitura pública, escrita só autenticado ----------
alter table public.site_parceiros enable row level security;

drop policy if exists "site_parceiros_select_public" on public.site_parceiros;
create policy "site_parceiros_select_public" on public.site_parceiros
  for select using (true);

drop policy if exists "site_parceiros_write_auth" on public.site_parceiros;
create policy "site_parceiros_write_auth" on public.site_parceiros
  for all to authenticated using (true) with check (true);

-- ---------- Storage ----------
insert into storage.buckets (id, name, public)
  values ('site-parceiros', 'site-parceiros', true)
  on conflict (id) do nothing;

-- As policies de storage listam os buckets explicitamente, então são recriadas
-- por inteiro a cada bucket novo.
drop policy if exists "site_storage_public_read" on storage.objects;
create policy "site_storage_public_read" on storage.objects
  for select using (
    bucket_id in ('site-eventos','site-arquivos','site-cursos','site-hero','site-parceiros')
  );

drop policy if exists "site_storage_auth_write" on storage.objects;
create policy "site_storage_auth_write" on storage.objects
  for all to authenticated
  using (
    bucket_id in ('site-eventos','site-arquivos','site-cursos','site-hero','site-parceiros')
  )
  with check (
    bucket_id in ('site-eventos','site-arquivos','site-cursos','site-hero','site-parceiros')
  );
