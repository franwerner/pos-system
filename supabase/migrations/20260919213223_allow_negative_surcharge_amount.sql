-- El ajuste por método de pago pasa a admitir descuentos (porcentajes negativos),
-- así que lo cobrado en una parte puede ser menor a su monto.
alter table public.sale_payment
    drop constraint if exists sale_payment_surcharge_amount_check;

comment on column public.sale_payment.surcharge_amount is
    'Ajuste sobre el monto de la parte: positivo recargo, negativo descuento.';

comment on column public.payment_method.tax is
    'Ajuste en %: positivo recargo, negativo descuento (ej. -10 = 10% off por efectivo).';
