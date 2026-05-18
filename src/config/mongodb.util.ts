/** Ensure Atlas-friendly default query params on SRV URIs. */
export function buildMongoUri(uri: string): string {
  const trimmed = uri.trim();
  if (!trimmed) return trimmed;
  if (trimmed.includes('retryWrites=')) return trimmed;
  const sep = trimmed.includes('?') ? '&' : '?';
  return `${trimmed}${sep}retryWrites=true&w=majority`;
}
