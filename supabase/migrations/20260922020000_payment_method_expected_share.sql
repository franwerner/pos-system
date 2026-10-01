-- Mezcla esperada de medios de pago.
--
-- El costeo necesita saber cuánto retienen en promedio por cobrar, y eso depende
-- de con qué le pagan. Mirarlo de las ventas reales haría que el precio se mueva
-- solo: el porcentaje se declara y la medición real queda al lado, para adoptarla
-- cuando el usuario quiera.

alter table public.payment_method
    add column if not exists expected_share numeric(5, 2) not null default 0;

do $$
begin
    if not exists (select 1 from pg_constraint where conname = 'payment_method_expected_share_check') then
        alter table public.payment_method
            add constraint payment_method_expected_share_check
            check (expected_share >= 0 and expected_share <= 100);
    end if;
end $$;
