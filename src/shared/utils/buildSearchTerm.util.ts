// Espeja lo que la columna generada `search_name` guarda en Postgres
// (`immutable_unaccent(lower(name))`): sin esto el patrón llevaría acentos que
// la columna ya no tiene.
export default function buildSearchTerm(search: string): string {
    return search
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toLowerCase()
}
