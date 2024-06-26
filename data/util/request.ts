export type Params = Record<string, unknown | unknown[]>;

/** generic request wrapper */
export const request = async <Response>(
  path: string | URL,
  options: Omit<RequestInit, "body"> & {
    params?: Params;
    body?: unknown;
    parse?: "json" | "text";
  },
) => {
  /** options defaults */
  options.parse ??= "json";

  /** construct request url */
  const url = new URL(path);

  /** add url params */
  for (const [key, values] of Object.entries(options.params ?? {}))
    for (const value of [values].flat())
      url.searchParams.append(key, String(value));

  /** make request */
  const request = new Request(url, {
    ...options,
    body: JSON.stringify(options.body),
  });
  const response = await fetch(request);
  if (!response.ok) throw Error(`Response for ${url.href} not OK`);

  /** parse response */
  try {
    if (options.parse === "json") return (await response.json()) as Response;
    if (options.parse === "text") return (await response.text()) as Response;
    throw Error();
  } catch (error) {
    throw Error(`Couldn't parse ${url.pathname} as ${options.parse}`);
  }
};
