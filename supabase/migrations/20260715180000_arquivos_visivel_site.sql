-- Visibilidade de arquivos no site público (editais / transparência).
alter table public.site_arquivos
  add column if not exists visivel_site boolean not null default true;
