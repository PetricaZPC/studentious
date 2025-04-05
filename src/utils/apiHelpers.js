// Create a new utility file for API call management

// Map to track ongoing API requests
const pendingRequests = new Map();

/**
 * Makes a fetch request with built-in protection against duplicate requests
 * @param {string} url - The URL to fetch
 * @param {Object} options - Fetch options
 * @returns {Promise<any>} The response data
 */
export async function safeFetch(url, options = {}) {
  const requestKey = `${options.method || 'GET'}-${url}`;
  
  // If this exact request is already in progress, wait for it to complete
  if (pendingRequests.has(requestKey)) {
    return pendingRequests.get(requestKey);
  }
  
  // Create a new request and store its promise
  const fetchPromise = fetch(url, {
    ...options,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      ...(options.headers || {})
    }
  })
    .then(response => {
      // Clone the response to allow multiple reads
      const clonedResponse = response.clone();
      
      // Once completed, remove from pending requests
      pendingRequests.delete(requestKey);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return clonedResponse.json();
    })
    .catch(error => {
      // Also remove on error
      pendingRequests.delete(requestKey);
      throw error;
    });
  
  // Store the promise so other calls can wait for it
  pendingRequests.set(requestKey, fetchPromise);
  
  return fetchPromise;
}