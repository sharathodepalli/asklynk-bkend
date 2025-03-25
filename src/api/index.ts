// src/api/index.ts
import { handleAPIRequest } from './handler';

// API endpoint base path
const API_BASE_PATH = '/api';

// Export the API setup function to be used in main.tsx
export function setupAPI() {
  // Set up a fetch interceptor for API requests
  const originalFetch = window.fetch;
  
  window.fetch = async function(input, init) {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    
    // Check if this is an API request
    if (typeof url === 'string' && url.includes(API_BASE_PATH)) {
      try {
        // Use our API handler
        const request = new Request(input, init);
        return handleAPIRequest(request);
      } catch (error) {
        console.error('API Request Error:', error);
        throw error;
      }
    }
    
    // For non-API requests, use the original fetch
    return originalFetch.call(this, input, init);
  };
  
  // Only set up extension message listener if in a Chrome extension context
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    try {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'API_REQUEST') {
          const { method, path, body, headers } = message.data;
          
          // Create a new request
          const url = `${window.location.origin}${API_BASE_PATH}${path}`;
          const request = new Request(url, {
            method,
            headers: new Headers(headers || {}),
            body: body ? JSON.stringify(body) : undefined
          });
          
          // Handle the request
          handleAPIRequest(request)
            .then(async (response: Response) => {
              const data = await response.json();
              sendResponse({
                success: response.ok,
                status: response.status,
                data
              });
            })
            .catch((error: Error) => {
              sendResponse({
                success: false,
                error: error.message
              });
            });
          
          // Return true to indicate that the response will be sent asynchronously
          return true;
        }
      });
    } catch (error) {
      console.error('Chrome extension APIs not available in this context');
    }
  }
}

// Export a helper function to get the API URL
export function getAPIURL(path: string): string {
  return `${window.location.origin}${API_BASE_PATH}${path}`;
}