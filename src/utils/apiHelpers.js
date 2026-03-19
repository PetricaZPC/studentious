const inFlightRequests = new Map();

/**
 * Performs a fetch request while deduplicating simultaneous calls to the same URL/method.
 *
 * @param {string} url - Endpoint to request.
 * @param {RequestInit} options - Fetch configuration.
 * @returns {Promise<any>} Parsed JSON response.
 */
export async function fetchWithDedup(url, options = {}) {
  const cacheKey = `${options.method || 'GET'}-${url}`;

  if (inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey);
  }

  const promise = fetch(url, {
    ...options,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
      ...(options.headers || {}),
    },
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      return response.json();
    })
    .finally(() => {
      inFlightRequests.delete(cacheKey);
    });

  inFlightRequests.set(cacheKey, promise);
  return promise;
}
