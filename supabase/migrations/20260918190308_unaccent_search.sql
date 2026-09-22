-- Búsqueda sin acentos para productos e insumos.

create extension if not exists unaccent with schema extensions;

-- unaccent() es STABLE porque depende del diccionario instalado; una columna
-- generada exige IMMUTABLE, y este envoltorio fija el diccionario para poder
-- prometerlo.
create or replace function public.immutable_unaccent(value text)
returns text
language sql
immutable
strict
parallel safe
set search_path = ''
as $$
    select extensions.unaccent('extensions.unaccent'::regdictionary, value)
$$;

-- Columna almacenada en vez de índice funcional: PostgREST solo filtra por
-- columnas, así que el `ilike` del cliente necesita una donde apoyarse.
alter table public.product
    add column search_name text
    generated always as (public.immutable_unaccent(lower(name))) stored;

alter table public.supply
    add column search_name text
    generated always as (public.immutable_unaccent(lower(name))) stored;

create index product_search_name_idx on public.product (search_name);
create index supply_search_name_idx on public.supply (search_name);
