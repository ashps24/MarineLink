/** Case-insensitive "does any of these fields contain the query" helper. */
export function matchesSearch(query: string | undefined, ...fields: (string | undefined)[]): boolean {
  if (!query || !query.trim()) return true;
  const needle = query.trim().toLowerCase();
  return fields.some((field) => field?.toLowerCase().includes(needle));
}
