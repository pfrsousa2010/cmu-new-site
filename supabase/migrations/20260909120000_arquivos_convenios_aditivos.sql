-- Competência mês/ano e vínculo aditivo → convênio em site_arquivos.
-- Só fazem sentido quando subcategoria = 'convenios' (validado no app).
-- Aditivo = arquivo_pai_id preenchido; convênio = arquivo_pai_id null.

alter table public.site_arquivos
  add column if not exists competencia_mes smallint;

alter table public.site_arquivos
  add column if not exists competencia_ano smallint;

alter table public.site_arquivos
  add column if not exists arquivo_pai_id uuid
    references public.site_arquivos(id) on delete cascade;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'site_arquivos_competencia_mes_check'
  ) then
    alter table public.site_arquivos
      add constraint site_arquivos_competencia_mes_check
      check (competencia_mes is null or competencia_mes between 1 and 12);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'site_arquivos_competencia_ano_check'
  ) then
    alter table public.site_arquivos
      add constraint site_arquivos_competencia_ano_check
      check (competencia_ano is null or competencia_ano between 2000 and 2100);
  end if;
end $$;

create index if not exists site_arquivos_arquivo_pai_id_idx
  on public.site_arquivos (arquivo_pai_id);

comment on column public.site_arquivos.competencia_mes is
  'Mês de competência (1–12). Usado em convênios/aditivos.';
comment on column public.site_arquivos.competencia_ano is
  'Ano de competência. Usado em convênios/aditivos.';
comment on column public.site_arquivos.arquivo_pai_id is
  'Convênio pai quando o arquivo é um aditivo (subcategoria convenios).';
