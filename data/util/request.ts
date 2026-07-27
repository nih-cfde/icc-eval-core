import { formatDuration, log } from "@/util/log";
import { sleep } from "@/util/misc";

/** max number of request attempts */
const maxAttempts = 3;
/** multiply retry wait time for extra safety */
const waitFactor = 1.1;
/** max retry time, in ms */
const maxWait = 60 * 1000;

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
  for (let attempt = 1; response.status === 429; attempt++) {
    log(`RateLimit on ${url}`, "warn");

    /** check attempts */
    log(`Attempt ${attempt}`, "warn");
    if (attempt >= maxAttempts) throw log("Exceeded max attempts", "error");

    /** check wait */
    const wait = parseInt(response.headers.get("retry-after") || "") || 1;
    log(`Waiting ${formatDuration(wait * 1000)}`, "warn");
    if (wait > maxWait) throw log("Exceeded max wait", "error");

    /** wait */
    await sleep(wait * waitFactor * 1000);
    /** retry */
    response = await fetch(request.clone());
  }

  if (!response.ok)
    throw Error(
      [url, response.status, response.statusText].filter(Boolean).join(" "),
    );

  /** parse response */
  if (raw) return response;
  try {
    if (options.parse === "json") return (await response.json()) as Parsed;
    if (options.parse === "text") return (await response.text()) as Parsed;
    throw Error();
  } catch (error) {
    throw Error(`Problem parsing ${url} as ${options.parse}`, { cause: error });
  }
};
