-- Leitura pública de conteúdos do curso (exibidos na modal de inscrição do site).
-- Sem estas policies o anon recebe arrays vazios em curso_conteudos / conteudos.

alter table public.conteudos enable row level security;
alter table public.curso_conteudos enable row level security;

drop policy if exists "conteudos_select_public" on public.conteudos;
create policy "conteudos_select_public" on public.conteudos
  for select using (true);

drop policy if exists "curso_conteudos_select_public" on public.curso_conteudos;
create policy "curso_conteudos_select_public" on public.curso_conteudos
  for select using (true);
