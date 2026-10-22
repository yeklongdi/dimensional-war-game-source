/** Vite supplies '/' in development and the actual Pages base at build time. */
export function assetUrl(path: string, base = import.meta.env.BASE_URL): string {
  if (!path.startsWith('/assets/')) return path;
  return `${base.endsWith('/') ? base : `${base}/`}${path.slice(1)}`;
}

export function assetBindings(bindings: Readonly<Record<string, string>>, base = import.meta.env.BASE_URL): Record<string, string> {
  return Object.fromEntries(Object.entries(bindings).map(([id, path]) => [id, assetUrl(path, base)]));
}
