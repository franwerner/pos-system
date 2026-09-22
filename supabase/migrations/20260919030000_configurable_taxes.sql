-- Impuestos configurables, precio sugerido y costos fijos sin porcentaje a mano.

-- ---------------------------------------------------------------------------
-- Impuestos
-- ---------------------------------------------------------------------------
-- El `type` no es una etiqueta para agrupar: dice en qué paso del cálculo entra.
-- Un impuesto sobre la ganancia no puede calcularse antes de conocerla, y uno
-- sobre la venta no puede calcularse después. El orden sale del tipo.
--
--   purchase       → ajusta el costo del insumo (se descuenta si es recuperable)
--   sale           → se descuenta del precio: esa plata no es del negocio
--   profit         → se aplica sobre lo que queda tras restar los costos
--   monthly_fixed  → un monto por mes, junto al alquiler
--   payment        → sobre lo cobrado con un medio de pago (comisión de tarjeta)

create table if not exists public.tax (
    id                 bigint generated always as identity primary key,
    name               text not null,
    type               text not null check (type in ('purchase', 'sale', 'profit', 'monthly_fixed', 'payment')),
    rate               numeric(7, 4) not null default 0,
    amount             numeric(12, 2) not null default 0,
    is_recoverable     boolean not null default false,
    payment_method_id  bigint references public.payment_method (id) on delete cascade,
    is_active          boolean not null default true,
    created_at         timestamptz not null default now(),

    -- Un monto fijo mensual no lleva porcentaje, y el resto no lleva monto.
    constraint tax_amount_only_for_monthly check (
        (type = 'monthly_fixed' and rate = 0) or (type <> 'monthly_fixed' and amount = 0)
    ),
    -- Recuperar un impuesto solo tiene sentido sobre las compras.
    constraint tax_recoverable_only_on_purchase check (
        is_recoverable = false or type = 'purchase'
    ),
    -- Un impuesto por medio de pago necesita saber cuál.
    constraint tax_payment_method_required check (
        (type = 'payment') = (payment_method_id is not null)
    )
);

create index if not exists tax_type_idx on public.tax (type);
create index if not exists tax_payment_method_idx on public.tax (payment_method_id);

alter table public.tax enable row level security;
revoke all on public.tax from anon, authenticated;

-- La condición fiscal deja de ser un enum: pasa a ser cómo están configurados
-- los impuestos. Un monotributista carga su cuota como `monthly_fixed`; un
-- responsable inscripto carga IVA de compras recuperable y de ventas.
insert into public.tax (name, type, rate, is_recoverable)
select 'IVA compras', 'purchase', c.purchase_vat_rate, true
from public.app_config c
where c.tax_condition = 'responsable_inscripto'
  and not exists (select 1 from public.tax where name = 'IVA compras');

insert into public.tax (name, type, rate)
select 'IVA ventas', 'sale', c.sales_vat_rate
from public.app_config c
where c.tax_condition = 'responsable_inscripto'
  and not exists (select 1 from public.tax where name = 'IVA ventas');

alter table public.app_config
    drop column if exists tax_condition,
    drop column if exists sales_vat_rate,
    drop column if exists purchase_vat_rate;

-- ---------------------------------------------------------------------------
-- Precio sugerido
-- ---------------------------------------------------------------------------
-- El precio lo pone el usuario. La app calcula cuánto debería cobrar para
-- alcanzar este margen, como guía.

alter table public.app_config
    add column if not exists target_margin_percentage numeric(5, 2) not null default 65;

do $$
begin
    if not exists (select 1 from pg_constraint where conname = 'app_config_target_margin_check') then
        alter table public.app_config
            add constraint app_config_target_margin_check
            check (target_margin_percentage >= 0 and target_margin_percentage < 100);
    end if;
end $$;

-- ---------------------------------------------------------------------------
-- Costos fijos: sin porcentaje a mano
-- ---------------------------------------------------------------------------
-- Los conceptos cargados ya dicen cuánto se gasta. El reparto sale de dividir
-- los del último mes CERRADO por las unidades vendidas en ese mes: un mes
-- completo y real, que no se mueve mientras el mes en curso avanza.

alter table public.app_config drop column if exists fixed_cost_percentage;

-- ---------------------------------------------------------------------------
-- Tarifas: el descuento por efectivo es un porcentaje negativo
-- ---------------------------------------------------------------------------
-- El precio de lista es uno solo e incluye el costo de cobrar con tarjeta; el
-- efectivo lleva descuento. Por eso `tax` admite negativos.

alter table public.payment_method
    drop constraint if exists payment_method_tax_check;

do $$
begin
    if not exists (select 1 from pg_constraint where conname = 'payment_method_tax_range_check') then
        alter table public.payment_method
            add constraint payment_method_tax_range_check
            check (tax > -100 and tax <= 100);
    end if;
end $$;
