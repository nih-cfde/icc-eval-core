import { sleep } from "@/util/misc";

export type Params = Record<string, unknown | unknown[]>;

/**
 * Per-domain rate limits in requests per second.
 * Domains not listed here are not rate-limited.
 */
export const requestRateLimits: Record<string, number> = {
  "eutils.ncbi.nlm.nih.gov": 10,
};

type RateLimitState = {
  nextAllowedAt: number;
  queue: Promise<void>;
};

const rateLimitStateByDomain = new Map<string, RateLimitState>();

/** wait for domain-specific rate limit slot, if configured */
const waitForRateLimitSlot = async (url: URL) => {
  const requestsPerSecond = requestRateLimits[url.hostname];
  if (!requestsPerSecond || requestsPerSecond <= 0) return;

  const intervalMs = Math.ceil(1000 / requestsPerSecond);
  const state =
    rateLimitStateByDomain.get(url.hostname) ??
    ({ nextAllowedAt: 0, queue: Promise.resolve() } as RateLimitState);

  const wait = async () => {
    const now = Date.now();
    const waitMs = Math.max(0, state.nextAllowedAt - now);
    if (waitMs > 0) await sleep(waitMs);
    state.nextAllowedAt = Date.now() + intervalMs;
  };

  state.queue = state.queue.then(wait, wait);
  rateLimitStateByDomain.set(url.hostname, state);
  await state.queue;
};

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
  await waitForRateLimitSlot(url);
  let response = await fetch(request);

  /** if rate limited, retry a few times */
  let retry = 5;
  while (response.status === 429 && retry-- > 0) {
    const timeout = parseInt(response.headers.get("retry-after") ?? "1") + 1;
    console.debug(`Retrying (${retry}) after ${timeout}s`);
    await sleep(timeout * 1000);
    await waitForRateLimitSlot(url);
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
