-- El margen objetivo es una decisión por producto: no hay un valor global que lo
-- supla. Un producto sin margen propio no tiene precio sugerido, igual que uno
-- sin composición no tiene costo.

alter table public.app_config drop column if exists target_margin_percentage;
