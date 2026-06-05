type SearchParams = Record<string, string | undefined>;

export function buildPath(path: string, searchParams?: SearchParams) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams ?? {})) {
    if (value) {
      params.set(key, value);
    }
  }

  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

export function buildModalPath(
  path: string,
  searchParams: SearchParams | undefined,
  modal: string,
  id?: string,
) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams ?? {})) {
    if (value && key !== "modal" && key !== "id" && key !== "error") {
      params.set(key, value);
    }
  }

  params.set("modal", modal);

  if (id) {
    params.set("id", id);
  }

  return `${path}?${params.toString()}`;
}
