-- Fotos do carrossel da Home, gerenciadas pelo painel admin.
-- Antes disso as imagens eram uma lista fixa em src/pages/Home.tsx apontando
-- para /public. Enquanto a tabela estiver vazia o site continua usando aquela
-- lista como fallback.

create table if not exists public.site_hero_imagens (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null,
  -- Texto alternativo da foto (acessibilidade).
  legenda text,
  ordem int not null default 0,
  publicado boolean not null default true,
  created_at timestamptz default now()
);

create index if not exists idx_site_hero_imagens_ordem
  on public.site_hero_imagens(ordem);

-- ---------- RLS: leitura pública, escrita só autenticado ----------
alter table public.site_hero_imagens enable row level security;

drop policy if exists "site_hero_imagens_select_public" on public.site_hero_imagens;
create policy "site_hero_imagens_select_public" on public.site_hero_imagens
  for select using (true);

drop policy if exists "site_hero_imagens_write_auth" on public.site_hero_imagens;
create policy "site_hero_imagens_write_auth" on public.site_hero_imagens
  for all to authenticated using (true) with check (true);

-- ---------- Storage ----------
insert into storage.buckets (id, name, public)
  values ('site-hero', 'site-hero', true)
  on conflict (id) do nothing;

-- As policies de storage listam os buckets explicitamente, então são recriadas
-- por inteiro a cada bucket novo.
drop policy if exists "site_storage_public_read" on storage.objects;
create policy "site_storage_public_read" on storage.objects
  for select using (bucket_id in ('site-eventos','site-arquivos','site-cursos','site-hero'));

drop policy if exists "site_storage_auth_write" on storage.objects;
create policy "site_storage_auth_write" on storage.objects
  for all to authenticated
  using (bucket_id in ('site-eventos','site-arquivos','site-cursos','site-hero'))
  with check (bucket_id in ('site-eventos','site-arquivos','site-cursos','site-hero'));
