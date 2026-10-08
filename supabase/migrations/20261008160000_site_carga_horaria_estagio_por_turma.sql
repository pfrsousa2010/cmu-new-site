-- CH ajustada do site: estágio por turma.
--
-- O SGE passou a ter TURMAS de estágio (estagio_turmas). Cada aluna cumpre só a turma dela,
-- então o total do curso não pode somar o estágio de todas as turmas: um curso de 162h passou a
-- aparecer com 174h quando a T2 (12h) foi cadastrada, somando T1 (21h) + T2.
--
-- Regra (a mesma de `estagiosParaCargaDoCurso`, no SGE): entra o estágio das turmas "todas as
-- alunas" (valem para qualquer uma) + o de UMA turma de "alunas escolhidas" — a de maior CH.
-- O resto da conta (base + extras/eventos/oficinas − recessos) não muda.
--
-- Mesma assinatura da função anterior; o site continua chamando
-- supabase.rpc("site_carga_horaria_ajustada"). Para voltar atrás, reaplicar
-- 20261006120000_site_carga_horaria_ajustada.sql.

create or replace function public.site_carga_horaria_ajustada()
returns table (curso_id uuid, carga_horaria integer)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.id,
    greatest(0,
      coalesce(c.carga_horaria_total, 0)
      + coalesce((
          select sum(
            case
              when e.tipo::text in ('aula_extra', 'evento') then e.carga_horaria
              when e.tipo::text = 'oficina' then
                case when e.carga_horaria > 0 then e.carga_horaria
                     else coalesce(o.carga_horaria_total, 0) end
              when e.tipo::text = 'recesso' then
                case when e.carga_horaria = 0 then 0
                     when coalesce(c.carga_horaria_diaria, 0) > 0 then -c.carga_horaria_diaria
                     else -e.carga_horaria end
              else 0
            end)
          from curso_extra e
          left join oficinas o on o.id = e.oficina_id
          where e.curso_id = c.id
        ), 0)
      -- Estágio das turmas "todas as alunas": vale para qualquer aluna, soma inteiro.
      + coalesce((
          select sum(s.carga_horaria)
          from curso_estagio s
          join estagio_turmas t on t.id = s.turma_id
          where s.curso_id = c.id and s.carga_horaria > 0 and t.escopo = 'todas'
        ), 0)
      -- Estágio das turmas de "alunas escolhidas": a aluna faz uma só; conta a de maior CH.
      + coalesce((
          select max(por_turma.soma)
          from (
            select sum(s.carga_horaria) as soma
            from curso_estagio s
            join estagio_turmas t on t.id = s.turma_id
            where s.curso_id = c.id and s.carga_horaria > 0 and t.escopo = 'lista'
            group by t.id
          ) por_turma
        ), 0)
    )::integer
  from cursos c
  where c.carga_horaria_total > 0;
$$;

revoke all on function public.site_carga_horaria_ajustada() from public;
grant execute on function public.site_carga_horaria_ajustada() to anon, authenticated;
