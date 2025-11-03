import { detectServerURL } from './config';

/**
 * Dynamic API client that auto-detects server URL
 */

let cachedServerURL: string | null = null;
let serverDetectionPromise: Promise<string> | null = null;

// Get the current server URL (cached after first detection)
export const getServerURL = async (): Promise<string> => {
  if (cachedServerURL) {
    return cachedServerURL;
  }

  if (serverDetectionPromise) {
    return serverDetectionPromise;
  }

  serverDetectionPromise = detectServerURL();
  cachedServerURL = await serverDetectionPromise;
  serverDetectionPromise = null;

  console.log(`🔗 Using server URL: ${cachedServerURL}`);
  return cachedServerURL;
};

// Reset cached URL (useful for reconnection scenarios)
export const resetServerURL = () => {
  cachedServerURL = null;
  serverDetectionPromise = null;
};

// Enhanced fetch with automatic server URL detection
export const apiFetch = async (endpoint: string, options: RequestInit = {}): Promise<Response> => {
  const serverURL = await getServerURL();
  const url = `${serverURL}/api${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  // Get token from localStorage
  const token = localStorage.getItem('token');

  console.log(`🌐 API Call: ${options.method || 'GET'} ${url}`);

  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    });

    return response;
  } catch (error) {
    console.error(`❌ API Error for ${url}:`, error);

    // If request fails, try to detect server URL again
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.log('🔄 Retrying with server detection...');
      resetServerURL();
      const newServerURL = await getServerURL();
      const retryUrl = `${newServerURL}/api${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

      return fetch(retryUrl, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
          ...options.headers,
        },
        ...options,
      });
    }

    throw error;
  }
};

// Convenience methods
export const apiGet = (endpoint: string, options: RequestInit = {}) => 
  apiFetch(endpoint, { ...options, method: 'GET' });

export const apiPost = (endpoint: string, data?: any, options: RequestInit = {}) => 
  apiFetch(endpoint, {
    ...options,
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });

export const apiPut = (endpoint: string, data?: any, options: RequestInit = {}) => 
  apiFetch(endpoint, {
    ...options,
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });

export const apiDelete = (endpoint: string, options: RequestInit = {}) => 
  apiFetch(endpoint, { ...options, method: 'DELETE' });

// Health check utility
export const checkServerHealth = async (): Promise<boolean> => {
  try {
    const serverURL = await getServerURL();
    const response = await fetch(`${serverURL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000)
    });
    return response.ok;
  } catch {
    return false;
  }
};