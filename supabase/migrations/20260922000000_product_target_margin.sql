-- Margen objetivo por producto.
--
-- Un número único para todo el local no refleja cómo se fija precio: las bebidas
-- se venden con márgenes mucho más altos que la comida, y un plato gancho puede
-- ir a propósito con margen bajo. `null` significa "usar el de la configuración",
-- así no hay que cargarlo producto por producto.

alter table public.product
    add column if not exists target_margin_percentage numeric(5, 2);

do $$
begin
    if not exists (select 1 from pg_constraint where conname = 'product_target_margin_check') then
        alter table public.product
            add constraint product_target_margin_check
            check (
                target_margin_percentage is null
                or (target_margin_percentage >= 0 and target_margin_percentage < 100)
            );
    end if;
end $$;
