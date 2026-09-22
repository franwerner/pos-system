-- Los costos fijos se reparten con un porcentaje ajustable a mano, no con un
-- prorrateo por unidades estimadas.
--
-- El prorrateo real (fijos del mes ÷ unidades vendidas) es exacto a fin de mes e
-- inservible durante el mes: el día 3 el mes tiene los costos fijos completos y
-- sesenta ventas, así que cada plato cargaba miles de pesos de alquiler. El
-- porcentaje no se mueve solo, y la medición real queda al lado como referencia
-- para ajustarlo.

alter table public.app_config
    add column if not exists fixed_cost_percentage numeric(5, 2) not null default 35;

alter table public.app_config drop column if exists estimated_monthly_units;

do $$
begin
    if not exists (select 1 from pg_constraint where conname = 'app_config_fixed_cost_percentage_check') then
        alter table public.app_config
            add constraint app_config_fixed_cost_percentage_check
            check (fixed_cost_percentage >= 0);
    end if;
end $$;
