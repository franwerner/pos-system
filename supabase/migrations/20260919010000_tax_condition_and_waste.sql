-- Condición fiscal e IVA, y merma estimada por tipo de insumo.

-- ---------------------------------------------------------------------------
-- Condición fiscal
-- ---------------------------------------------------------------------------
-- Cambia la aritmética del costeo: un responsable inscripto recupera el IVA de
-- sus compras (su costo real es el neto) y el precio que cobra incluye un IVA
-- que no es suyo. Un monotributista no discrimina: lo que paga es su costo.

alter table public.app_config
    add column if not exists tax_condition text not null default 'monotributo',
    add column if not exists sales_vat_rate numeric(5, 2) not null default 21,
    add column if not exists purchase_vat_rate numeric(5, 2) not null default 21;

do $$
begin
    if not exists (select 1 from pg_constraint where conname = 'app_config_tax_condition_check') then
        alter table public.app_config
            add constraint app_config_tax_condition_check
            check (tax_condition in ('monotributo', 'responsable_inscripto'));
    end if;
end $$;

-- ---------------------------------------------------------------------------
-- Merma por tipo de insumo
-- ---------------------------------------------------------------------------
-- Se pierde comida; no se pierden latas ni servilletas. Un porcentaje único
-- sobrecostea las bebidas y subcostea la carne.

alter table public.app_config
    add column if not exists waste_percentage_food numeric(5, 2) not null default 0,
    add column if not exists waste_percentage_drink numeric(5, 2) not null default 0,
    add column if not exists waste_percentage_packaging numeric(5, 2) not null default 0;

-- El porcentaje único que había era, en los hechos, el de la comida.
update public.app_config
set waste_percentage_food = waste_percentage
where waste_percentage_food = 0;

alter table public.app_config drop column if exists waste_percentage;

do $$
begin
    if not exists (select 1 from pg_constraint where conname = 'app_config_waste_percentage_check') then
        alter table public.app_config
            add constraint app_config_waste_percentage_check
            check (
                waste_percentage_food between 0 and 100
                and waste_percentage_drink between 0 and 100
                and waste_percentage_packaging between 0 and 100
            );
    end if;
end $$;
