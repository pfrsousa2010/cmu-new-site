-- Leitura pública de parceiros (nome exibido nos cards de curso do site).
-- Sem esta policy o anon recebe rows vazias / join null em `parceiros`.

alter table public.parceiros enable row level security;

drop policy if exists "parceiros_select_public" on public.parceiros;
create policy "parceiros_select_public" on public.parceiros
  for select using (true);
