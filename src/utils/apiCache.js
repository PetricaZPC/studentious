// Centralized API cache and request deduplication

const cache = new Map();
const pendingRequests = new Map();

// TTL in milliseconds, default 30 seconds
export function setCachedData(key, data, ttl = 30000) {
  cache.set(key, {
    data,
    expiry: Date.now() + ttl
  });
}

export function getCachedData(key) {
  const entry = cache.get(key);
  if (entry && entry.expiry > Date.now()) {
    return entry.data;
  }
  return null;
}

export function clearCache(key) {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
}

// Smart fetch function with caching and deduplication
export async function smartFetch(url, options = {}) {
  const cacheKey = `${options.method || 'GET'}-${url}`;
  
  // Check cache first unless skipCache is true
  if (!options.skipCache) {
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return cachedData;
    }
  }
  
  // If this exact request is in progress, wait for it
  if (pendingRequests.has(cacheKey)) {
    return pendingRequests.get(cacheKey);
  }
  
  // Make the actual fetch request
  const fetchPromise = fetch(url, {
    ...options,
    headers: {
      'Cache-Control': 'no-cache',
      ...options.headers
    }
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Don't cache if skipCache is true
      if (!options.skipCache) {
        setCachedData(cacheKey, data);
      }
      
      // Remove from pending requests
      pendingRequests.delete(cacheKey);
      
      return data;
    })
    .catch(error => {
      // Clean up on error
      pendingRequests.delete(cacheKey);
      throw error;
    });
  
  // Store the promise for deduplication
  pendingRequests.set(cacheKey, fetchPromise);
  return fetchPromise;
}