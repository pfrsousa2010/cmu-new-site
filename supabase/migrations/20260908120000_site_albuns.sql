-- Álbuns de fotos do site. Independentes dos eventos da agenda: um álbum
-- agrupa várias fotos (festa, ação, encerramento etc.) e aparece na aba
-- "Álbuns de fotos" de /eventos. Fotos de capa = primeira por ordem.

create table if not exists public.site_albuns (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descricao text,
  data date,
  publicado boolean not null default true,
  created_at timestamptz default now()
);

create table if not exists public.site_album_fotos (
  id uuid primary key default gen_random_uuid(),
  album_id uuid not null references public.site_albuns(id) on delete cascade,
  storage_path text not null,
  ordem int default 0
);

create index if not exists idx_site_album_fotos_album
  on public.site_album_fotos(album_id);

-- ---------- RLS: leitura pública, escrita só autenticado ----------
alter table public.site_albuns enable row level security;

drop policy if exists "site_albuns_select_public" on public.site_albuns;
create policy "site_albuns_select_public" on public.site_albuns
  for select using (true);

drop policy if exists "site_albuns_write_auth" on public.site_albuns;
create policy "site_albuns_write_auth" on public.site_albuns
  for all to authenticated using (true) with check (true);

alter table public.site_album_fotos enable row level security;

drop policy if exists "site_album_fotos_select_public" on public.site_album_fotos;
create policy "site_album_fotos_select_public" on public.site_album_fotos
  for select using (true);

drop policy if exists "site_album_fotos_write_auth" on public.site_album_fotos;
create policy "site_album_fotos_write_auth" on public.site_album_fotos
  for all to authenticated using (true) with check (true);

-- ---------- Storage ----------
insert into storage.buckets (id, name, public)
  values ('site-albuns', 'site-albuns', true)
  on conflict (id) do nothing;

-- As policies de storage listam os buckets explicitamente, então são recriadas
-- por inteiro a cada bucket novo.
drop policy if exists "site_storage_public_read" on storage.objects;
create policy "site_storage_public_read" on storage.objects
  for select using (
    bucket_id in (
      'site-eventos','site-arquivos','site-cursos','site-hero',
      'site-parceiros','site-depoimentos','site-albuns'
    )
  );

drop policy if exists "site_storage_auth_write" on storage.objects;
create policy "site_storage_auth_write" on storage.objects
  for all to authenticated
  using (
    bucket_id in (
      'site-eventos','site-arquivos','site-cursos','site-hero',
      'site-parceiros','site-depoimentos','site-albuns'
    )
  )
  with check (
    bucket_id in (
      'site-eventos','site-arquivos','site-cursos','site-hero',
      'site-parceiros','site-depoimentos','site-albuns'
    )
  );
