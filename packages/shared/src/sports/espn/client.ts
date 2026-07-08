const ESPN_BASE_URL = "https://site.api.espn.com/apis/site/v2";

const MIN_REQUEST_INTERVAL_MS = 200;

let lastRequestAt = 0;

export class EspnApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly url?: string,
  ) {
    super(message);
    this.name = "EspnApiError";
  }
}

async function throttle(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastRequestAt;
  if (elapsed < MIN_REQUEST_INTERVAL_MS) {
    await new Promise((resolve) => setTimeout(resolve, MIN_REQUEST_INTERVAL_MS - elapsed));
  }
  lastRequestAt = Date.now();
}

export interface EspnFetchOptions {
  /** Override fetch for testing */
  fetchFn?: typeof fetch;
}

export async function espnFetch<T>(
  path: string,
  params: Record<string, string | number | undefined> = {},
  options: EspnFetchOptions = {},
): Promise<T> {
  const fetchFn = options.fetchFn ?? fetch;
  const url = new URL(`${ESPN_BASE_URL}${path}`);

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  }

  await throttle();

  let response: Response;
  try {
    response = await fetchFn(url.toString(), {
      headers: { Accept: "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Network error";
    throw new EspnApiError(`ESPN request failed: ${message}`, undefined, url.toString());
  }

  if (!response.ok) {
    throw new EspnApiError(
      `ESPN API returned ${response.status}`,
      response.status,
      url.toString(),
    );
  }

  return (await response.json()) as T;
}

/** Reset rate limiter state (for tests). */
export function resetEspnClientState(): void {
  lastRequestAt = 0;
}
