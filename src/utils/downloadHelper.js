/**
 * Downloads a file from a URL using the Fetch API
 * This bypasses any CORS or streaming issues by using a Blob
 */
export const downloadFile = async (url, filename) => {
  try {
    console.log(`Downloading file from ${url} as ${filename}`);
    
    // Add a timestamp to bust cache
    const timestampedUrl = `${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`;
    
    // Fetch the file with proper credentials
    const response = await fetch(timestampedUrl, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Cache-Control': 'no-cache'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
    }
    
    // Get the blob data
    const blob = await response.blob();
    
    // Create a temporary URL for the blob
    const blobUrl = window.URL.createObjectURL(blob);
    
    // Create a temporary link element
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    
    // Append to body, click, and clean up
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Release the blob URL
    setTimeout(() => {
      window.URL.revokeObjectURL(blobUrl);
    }, 100);
    
    return true;
  } catch (error) {
    console.error('Error downloading file:', error);
    throw error;
  }
};