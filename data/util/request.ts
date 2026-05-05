import { sleep } from "@/util/misc";

export type Params = Record<string, unknown | unknown[]>;

/** request */
type Url = string | URL;
type Options = Omit<RequestInit, "body"> & {
  params?: Params;
  body?: unknown;
  parse?: "json" | "text";
};
type Request = {
  <Parsed>(url: Url, options: Options): Promise<Parsed>;
  (url: Url, options: Options, raw: true): Promise<Response>;
};

/** generic request wrapper */
export const request: Request = async <Parsed>(
  url: Url,
  options: Options,
  /** whether to return raw response object */
  raw = false,
) => {
  /** options defaults */
  options.parse ??= "json";

  /** construct request url */
  url = new URL(url);

  /** add url params */
  for (const [key, values] of Object.entries(options.params ?? {}))
    for (const value of [values].flat())
      url.searchParams.append(key, String(value));

  /** request body */
  const body = JSON.stringify(options.body);

  /** make request */
  const request = new Request(url, { ...options, body });
  let response = await fetch(request);

  /** if rate limited, retry a few times */
  let retry = 5;
  while (response.status === 429 && retry-- > 0) {
    const timeout = parseInt(response.headers.get("retry-after") ?? "1") + 1;
    console.debug(`Retrying (${retry}) after ${timeout}s`);
    await sleep(timeout * 1000);
    response = await fetch(request.clone());
  }
  if (!response.ok)
    throw Error(
      [url, response.status, response.statusText].filter(Boolean).join(" "),
    );
  if (raw) return response;

  /** parse response */
  try {
    if (options.parse === "json") return (await response.json()) as Parsed;
    if (options.parse === "text") return (await response.text()) as Parsed;
    throw Error();
  } catch (error) {
    throw Error(`Problem parsing ${url} as ${options.parse}`, { cause: error });
  }
};
