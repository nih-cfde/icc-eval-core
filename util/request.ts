import { log } from "./log";

/** generic request wrapper */
export const request = async <Response>(
  path: string,
  options: Omit<RequestInit, "body"> & {
    params?: Record<string, unknown | unknown[]>;
    body?: unknown;
    parse?: "json" | "text";
  }
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
  console.log(options);
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
