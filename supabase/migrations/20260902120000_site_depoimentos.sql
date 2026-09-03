-- Depoimentos da Home, gerenciados pelo painel. Antes eram seis registros fixos
-- em src/components/Depoimentos.tsx, com as fotos em public/depoimento/.
-- Sem nenhum depoimento ativo, a seção inteira some da Home.
--
-- Cada depoimento é foto OU vídeo. Para vídeo, `poster_path` guarda um quadro
-- extraído no upload: é o que aparece na miniatura de navegação e como capa do
-- player, senão o vídeo ficaria um retângulo preto na lista.

create table if not exists public.site_depoimentos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  texto text not null,
  midia_tipo text not null check (midia_tipo in ('foto', 'video')),
  midia_path text not null,
  -- Só para vídeo; foto usa a própria imagem como miniatura.
  poster_path text,
  ordem int not null default 0,
  ativo boolean not null default true,
  created_at timestamptz default now()
);

create index if not exists idx_site_depoimentos_ordem
  on public.site_depoimentos(ordem);

-- ---------- RLS: leitura pública, escrita só autenticado ----------
alter table public.site_depoimentos enable row level security;

drop policy if exists "site_depoimentos_select_public" on public.site_depoimentos;
create policy "site_depoimentos_select_public" on public.site_depoimentos
  for select using (true);

drop policy if exists "site_depoimentos_write_auth" on public.site_depoimentos;
create policy "site_depoimentos_write_auth" on public.site_depoimentos
  for all to authenticated using (true) with check (true);

-- ---------- Storage ----------
insert into storage.buckets (id, name, public)
  values ('site-depoimentos', 'site-depoimentos', true)
  on conflict (id) do nothing;

-- As policies de storage listam os buckets explicitamente, então são recriadas
-- por inteiro a cada bucket novo.
drop policy if exists "site_storage_public_read" on storage.objects;
create policy "site_storage_public_read" on storage.objects
  for select using (
    bucket_id in (
      'site-eventos','site-arquivos','site-cursos','site-hero',
      'site-parceiros','site-depoimentos'
    )
  );

drop policy if exists "site_storage_auth_write" on storage.objects;
create policy "site_storage_auth_write" on storage.objects
  for all to authenticated
  using (
    bucket_id in (
      'site-eventos','site-arquivos','site-cursos','site-hero',
      'site-parceiros','site-depoimentos'
    )
  )
  with check (
    bucket_id in (
      'site-eventos','site-arquivos','site-cursos','site-hero',
      'site-parceiros','site-depoimentos'
    )
  );
