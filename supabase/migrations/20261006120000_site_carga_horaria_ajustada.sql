-- CH ajustada dos cursos, igual à exibida no SGE (calcularCargaHorariaAjustada):
-- base + aulas extras/eventos/oficinas + estágios - recessos (1 dia de CH diária cada;
-- recesso de 0h não desconta). curso_extra/curso_estagio não são legíveis pelo anon,
-- então o site lê o resultado por esta função (somente leitura, só devolve números).

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
      + coalesce((
          select sum(s.carga_horaria)
          from curso_estagio s
          where s.curso_id = c.id and s.carga_horaria > 0
        ), 0)
    )::integer
  from cursos c
  where c.carga_horaria_total > 0;
$$;

revoke all on function public.site_carga_horaria_ajustada() from public;
grant execute on function public.site_carga_horaria_ajustada() to anon, authenticated;
