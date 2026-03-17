const DISCOGS_BASE_URL = 'https://api.discogs.com';
const USER_AGENT = 'VinylStacker/1.0';

interface DiscogsRequestOptions {
  path: string;
  params?: Record<string, string>;
}

interface DiscogsResponse<T> {
  data?: T;
  error?: { message: string; status: number };
}

export async function discogsFetch<T>(options: DiscogsRequestOptions): Promise<DiscogsResponse<T>> {
  const token = process.env.DISCOGS_PERSONAL_TOKEN;
  if (!token) {
    return { error: { message: 'Discogs API token not configured', status: 500 } };
  }

  const url = new URL(`${DISCOGS_BASE_URL}${options.path}`);
  url.searchParams.set('token', token);
  if (options.params) {
    for (const [key, value] of Object.entries(options.params)) {
      url.searchParams.set(key, value);
    }
  }

  const response = await fetch(url.toString(), {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept': 'application/json',
    },
    next: { revalidate: 300 },
  });

  if (response.status === 429) {
    return { error: { message: 'Discogs rate limit exceeded. Please try again in a moment.', status: 429 } };
  }

  if (response.status === 404) {
    return { error: { message: 'Not found on Discogs', status: 404 } };
  }

  if (!response.ok) {
    return { error: { message: `Discogs API error: ${response.statusText}`, status: 502 } };
  }

  const data = await response.json();
  return { data: data as T };
}
