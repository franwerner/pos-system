-- Usuarios, órdenes pendientes, pago dividido, y cierre del acceso directo a la base.

-- ---------------------------------------------------------------------------
-- Usuarios
-- ---------------------------------------------------------------------------

create table if not exists public.app_user (
    id             bigint generated always as identity primary key,
    username       text not null unique,
    password_hash  text not null,
    created_at     timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Órdenes: pendientes, cobradas y canceladas
-- ---------------------------------------------------------------------------

alter table public.sale
    add column if not exists status text not null default 'paid',
    add column if not exists paid_at timestamptz;

do $$
begin
    if not exists (
        select 1 from pg_constraint where conname = 'sale_status_check'
    ) then
        alter table public.sale
            add constraint sale_status_check
            check (status in ('pending', 'paid', 'cancelled'));
    end if;
end $$;

-- Un pedido pendiente todavía no tiene cómo se pagó.
alter table public.sale alter column payment_method_id drop not null;

update public.sale set paid_at = created_at where paid_at is null;

create index if not exists sale_status_idx on public.sale (status);

-- ---------------------------------------------------------------------------
-- Pago dividido: una venta puede cobrarse con varios métodos a la vez
-- ---------------------------------------------------------------------------

create table if not exists public.sale_payment (
    id                bigint generated always as identity primary key,
    sale_id           bigint not null references public.sale (id) on delete cascade,
    payment_method_id bigint not null references public.payment_method (id) on delete restrict,
    amount            numeric(12, 2) not null check (amount > 0),
    surcharge_amount  numeric(12, 2) not null default 0 check (surcharge_amount >= 0),
    created_at        timestamptz not null default now()
);
create index if not exists sale_payment_sale_id_idx on public.sale_payment (sale_id);
create index if not exists sale_payment_method_id_idx on public.sale_payment (payment_method_id);

-- Las ventas que ya existían pasan a tener su pago único explícito.
insert into public.sale_payment (sale_id, payment_method_id, amount, surcharge_amount)
select s.id, s.payment_method_id, s.sub_total, s.tax
from public.sale s
where s.payment_method_id is not null
  and not exists (select 1 from public.sale_payment p where p.sale_id = s.id);

-- ---------------------------------------------------------------------------
-- Cierre del acceso directo: solo la API (service key) escribe y lee
-- ---------------------------------------------------------------------------

do $$
declare t text;
begin
    foreach t in array array[
        'category', 'payment_method', 'product', 'supply', 'product_supply',
        'supply_component', 'employee', 'cash_session', 'sale', 'sale_item',
        'purchase', 'purchase_item', 'production', 'stock_movement',
        'fixed_cost', 'app_config'
    ]
    loop
        execute format('drop policy if exists %I on public.%I', t || '_anon_all', t);
        execute format('revoke all on public.%I from anon, authenticated', t);
    end loop;
end $$;

alter table public.app_user enable row level security;
alter table public.sale_payment enable row level security;
revoke all on public.app_user from anon, authenticated;
revoke all on public.sale_payment from anon, authenticated;
revoke all on public.supply_stock from anon, authenticated;
