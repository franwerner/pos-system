-- POS restaurante — schema inicial.
-- Convención: snake_case, bigint identity, timestamptz, numeric para plata y cantidades.

-- ---------------------------------------------------------------------------
-- Catálogo de venta
-- ---------------------------------------------------------------------------

create table public.category (
    id          bigint generated always as identity primary key,
    name        text not null,
    parent_id   bigint references public.category (id) on delete set null,
    created_at  timestamptz not null default now()
);
create index category_parent_id_idx on public.category (parent_id);

create table public.payment_method (
    id          bigint generated always as identity primary key,
    name        text not null,
    tax         numeric(5, 2) not null default 0,   -- recargo en %
    is_active   boolean not null default true
);

create table public.product (
    id           bigint generated always as identity primary key,
    name         text not null,
    description  text,
    price        numeric(12, 2) not null,
    img_url      text,
    is_active    boolean not null default true,
    category_id  bigint references public.category (id) on delete set null,
    created_at   timestamptz not null default now(),
    updated_at   timestamptz not null default now()
);
create index product_category_id_idx on public.product (category_id);

-- ---------------------------------------------------------------------------
-- Insumos y composición
-- ---------------------------------------------------------------------------

create table public.supply (
    id              bigint generated always as identity primary key,
    name            text not null,
    type            text not null check (type in ('food', 'packaging', 'drink')),
    origin          text not null default 'purchased' check (origin in ('purchased', 'produced')),
    unit            text not null check (unit in ('u', 'gr', 'ml')),
    purchase_price  numeric(12, 2) not null default 0,   -- por `unit`
    yield_factor    numeric(5, 3) not null default 1,    -- 1 kg de papa rinde 0.750
    min_stock       numeric(12, 3) not null default 0,
    is_active       boolean not null default true,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now(),
    constraint supply_yield_factor_positive check (yield_factor > 0)
);

-- Lo que consume un producto al venderse.
create table public.product_supply (
    id          bigint generated always as identity primary key,
    product_id  bigint not null references public.product (id) on delete cascade,
    supply_id   bigint not null references public.supply (id) on delete restrict,
    quantity    numeric(12, 3) not null check (quantity > 0),
    unique (product_id, supply_id)
);
create index product_supply_supply_id_idx on public.product_supply (supply_id);

-- Lo que consume un insumo preparado al producirse.
create table public.supply_component (
    id                 bigint generated always as identity primary key,
    parent_supply_id   bigint not null references public.supply (id) on delete cascade,
    component_supply_id bigint not null references public.supply (id) on delete restrict,
    quantity           numeric(12, 3) not null check (quantity > 0),
    unique (parent_supply_id, component_supply_id),
    constraint supply_component_not_self check (parent_supply_id <> component_supply_id)
);
create index supply_component_component_idx on public.supply_component (component_supply_id);

-- ---------------------------------------------------------------------------
-- Personal y caja
-- ---------------------------------------------------------------------------

create table public.employee (
    id          uuid primary key,   -- espeja auth.users.id cuando haya login
    name        text not null,
    lastname    text,
    role        text not null default 'user' check (role in ('admin', 'user')),
    is_active   boolean not null default true
);

create table public.cash_session (
    id              bigint generated always as identity primary key,
    employee_id     uuid not null references public.employee (id) on delete restrict,
    opened_at       timestamptz not null default now(),
    opening_amount  numeric(12, 2) not null default 0,
    closed_at       timestamptz,
    counted_amount  numeric(12, 2),
    note            text
);
create index cash_session_employee_id_idx on public.cash_session (employee_id);
-- Una sola caja abierta a la vez.
create unique index cash_session_single_open_idx on public.cash_session ((closed_at is null)) where closed_at is null;

-- ---------------------------------------------------------------------------
-- Ventas
-- ---------------------------------------------------------------------------

create table public.sale (
    id                bigint generated always as identity primary key,
    employee_id       uuid not null references public.employee (id) on delete restrict,
    payment_method_id bigint not null references public.payment_method (id) on delete restrict,
    cash_session_id   bigint references public.cash_session (id) on delete restrict,
    sub_total         numeric(12, 2) not null,
    tax               numeric(12, 2) not null default 0,
    total             numeric(12, 2) not null,
    created_at        timestamptz not null default now()
);
create index sale_employee_id_idx on public.sale (employee_id);
create index sale_payment_method_id_idx on public.sale (payment_method_id);
create index sale_cash_session_id_idx on public.sale (cash_session_id);
create index sale_created_at_idx on public.sale (created_at);

create table public.sale_item (
    id          bigint generated always as identity primary key,
    sale_id     bigint not null references public.sale (id) on delete cascade,
    product_id  bigint not null references public.product (id) on delete restrict,
    quantity    numeric(12, 3) not null check (quantity > 0),
    unit_price  numeric(12, 2) not null   -- precio al momento de la venta
);
create index sale_item_sale_id_idx on public.sale_item (sale_id);
create index sale_item_product_id_idx on public.sale_item (product_id);

-- ---------------------------------------------------------------------------
-- Compras y producción
-- ---------------------------------------------------------------------------

create table public.purchase (
    id            bigint generated always as identity primary key,
    supplier_name text,
    total         numeric(12, 2) not null default 0,
    purchased_at  timestamptz not null default now(),
    note          text,
    created_at    timestamptz not null default now()
);

create table public.purchase_item (
    id           bigint generated always as identity primary key,
    purchase_id  bigint not null references public.purchase (id) on delete cascade,
    supply_id    bigint not null references public.supply (id) on delete restrict,
    quantity     numeric(12, 3) not null check (quantity > 0),
    unit_price   numeric(12, 2) not null
);
create index purchase_item_purchase_id_idx on public.purchase_item (purchase_id);
create index purchase_item_supply_id_idx on public.purchase_item (supply_id);

create table public.production (
    id           bigint generated always as identity primary key,
    supply_id    bigint not null references public.supply (id) on delete restrict,
    quantity     numeric(12, 3) not null check (quantity > 0),
    unit_cost    numeric(12, 4) not null default 0,   -- lo consumido ÷ quantity
    produced_at  timestamptz not null default now(),
    note         text
);
create index production_supply_id_idx on public.production (supply_id);

-- ---------------------------------------------------------------------------
-- Stock
-- ---------------------------------------------------------------------------

-- El stock actual es la suma de estos movimientos. `quantity` es positiva al
-- entrar y negativa al salir.
create table public.stock_movement (
    id             bigint generated always as identity primary key,
    supply_id      bigint not null references public.supply (id) on delete restrict,
    type           text not null check (type in ('purchase', 'sale', 'production_in', 'production_out', 'waste', 'adjustment')),
    quantity       numeric(12, 3) not null,
    unit_cost      numeric(12, 4) not null default 0,
    sale_id        bigint references public.sale (id) on delete set null,
    purchase_id    bigint references public.purchase (id) on delete set null,
    production_id  bigint references public.production (id) on delete set null,
    note           text,
    created_at     timestamptz not null default now()
);
create index stock_movement_supply_id_idx on public.stock_movement (supply_id);
create index stock_movement_sale_id_idx on public.stock_movement (sale_id);
create index stock_movement_purchase_id_idx on public.stock_movement (purchase_id);
create index stock_movement_production_id_idx on public.stock_movement (production_id);
create index stock_movement_created_at_idx on public.stock_movement (created_at);

create view public.supply_stock with (security_invoker = true) as
select
    s.id as supply_id,
    s.name,
    s.unit,
    s.min_stock,
    coalesce(sum(m.quantity), 0) as current_stock
from public.supply s
left join public.stock_movement m on m.supply_id = s.id
group by s.id, s.name, s.unit, s.min_stock;

-- ---------------------------------------------------------------------------
-- Costos y configuración
-- ---------------------------------------------------------------------------

create table public.fixed_cost (
    id          bigint generated always as identity primary key,
    concept     text not null,
    amount      numeric(12, 2) not null,
    period      date not null,   -- primer día del mes al que corresponde
    created_at  timestamptz not null default now()
);
create index fixed_cost_period_idx on public.fixed_cost (period);

create table public.app_config (
    id                       bigint generated always as identity primary key,
    default_payment_id       bigint references public.payment_method (id) on delete set null,
    default_employee_id      uuid references public.employee (id) on delete set null,
    waste_percentage         numeric(5, 2) not null default 0,
    estimated_monthly_units  integer not null default 0,
    updated_at               timestamptz not null default now(),
    constraint app_config_singleton check (id = 1)
);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
-- La app no tiene login: opera con la publishable key como `anon`. Se habilita
-- RLS en todas las tablas y se abre el acceso a `anon` explícitamente. Cuando
-- haya login, estas políticas se reemplazan por unas que miren auth.uid().

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
        execute format('alter table public.%I enable row level security', t);
        execute format('create policy %I on public.%I for all to anon using (true) with check (true)', t || '_anon_all', t);
    end loop;
end $$;
