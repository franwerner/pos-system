-- Ingresos y egresos de caja que no son ventas: un aporte de cambio, un retiro,
-- el pago de un flete. Afectan el arqueo pero no pasan por `sale`.

create table if not exists public.cash_movement (
    id               bigint generated always as identity primary key,
    cash_session_id  bigint not null references public.cash_session (id) on delete cascade,
    type             text not null check (type in ('deposit', 'withdrawal')),
    amount           numeric(12, 2) not null check (amount > 0),
    concept          text not null,
    created_at       timestamptz not null default now()
);

create index if not exists cash_movement_session_idx on public.cash_movement (cash_session_id);

alter table public.cash_movement enable row level security;
revoke all on public.cash_movement from anon, authenticated;
