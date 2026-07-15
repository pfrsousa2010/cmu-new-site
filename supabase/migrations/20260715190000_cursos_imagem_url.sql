-- Imagem do curso no site público (AdminCursos).
alter table public.cursos
  add column if not exists imagem_url text;

-- Bucket público para fotos de cursos.
insert into storage.buckets (id, name, public)
  values ('site-cursos', 'site-cursos', true)
  on conflict (id) do nothing;

-- Atualiza policies de Storage para incluir site-cursos.
drop policy if exists "site_storage_public_read" on storage.objects;
create policy "site_storage_public_read" on storage.objects
  for select using (bucket_id in ('site-eventos','site-arquivos','site-cursos'));

drop policy if exists "site_storage_auth_write" on storage.objects;
create policy "site_storage_auth_write" on storage.objects
  for all to authenticated
  using (bucket_id in ('site-eventos','site-arquivos','site-cursos'))
  with check (bucket_id in ('site-eventos','site-arquivos','site-cursos'));
