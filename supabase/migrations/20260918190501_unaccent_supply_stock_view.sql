-- La pantalla de stock busca insumos por nombre sobre esta vista, así que
-- necesita la misma columna sin acentos que `supply`.

create or replace view public.supply_stock with (security_invoker = true) as
select
    s.id as supply_id,
    s.name,
    s.unit,
    s.min_stock,
    coalesce(sum(m.quantity), 0) as current_stock,
    s.search_name
from public.supply s
left join public.stock_movement m on m.supply_id = s.id
group by s.id, s.name, s.unit, s.min_stock, s.search_name;
