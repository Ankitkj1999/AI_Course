import { detectServerURL } from './config';

/**
 * Dynamic API client that auto-detects server URL
 */

let cachedServerURL: string | null = null;
let serverDetectionPromise: Promise<string> | null = null;
let lastDetectionTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Get the current server URL (cached after first detection)
export const getServerURL = async (): Promise<string> => {
  const now = Date.now();

  // Check if we have a valid cached URL that's not too old
  if (cachedServerURL && (now - lastDetectionTime) < CACHE_DURATION) {
    return cachedServerURL;
  }

  if (serverDetectionPromise) {
    return serverDetectionPromise;
  }

  console.log('🔄 Server URL cache expired or empty, detecting...');
  serverDetectionPromise = detectServerURL();
  cachedServerURL = await serverDetectionPromise;
  lastDetectionTime = now;
  serverDetectionPromise = null;

  console.log(`🔗 Using server URL: ${cachedServerURL}`);
  return cachedServerURL;
};

// Reset cached URL (useful for reconnection scenarios)
export const resetServerURL = () => {
  cachedServerURL = null;
  serverDetectionPromise = null;
  lastDetectionTime = 0;
};

// Enhanced fetch with automatic server URL detection
export const apiFetch = async (endpoint: string, options: RequestInit = {}): Promise<Response> => {
  const startTime = performance.now();
  const serverURL = await getServerURL();
  const url = `${serverURL}/api${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  console.log(`🌐 API Call: ${options.method || 'GET'} ${url}`);

  try {
    const fetchStartTime = performance.now();
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Include cookies in requests
      ...options,
    });

    const fetchEndTime = performance.now();
    console.log(`✅ API Response: ${response.status} ${response.statusText} (${(fetchEndTime - fetchStartTime).toFixed(2)}ms)`);

    return response;
  } catch (error) {
    const errorTime = performance.now();
    console.error(`❌ API Error for ${url}:`, error, `(${errorTime - startTime}ms elapsed)`);

    // If request fails, try to detect server URL again
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.log('🔄 Retrying with server detection...');
      resetServerURL();
      const newServerURL = await getServerURL();
      const retryUrl = `${newServerURL}/api${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

      const retryStartTime = performance.now();
      const retryResponse = await fetch(retryUrl, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        credentials: 'include', // Include cookies in requests
        ...options,
      });

      const retryEndTime = performance.now();
      console.log(`🔄 Retry Response: ${retryResponse.status} ${retryResponse.statusText} (${(retryEndTime - retryStartTime).toFixed(2)}ms)`);

      return retryResponse;
    }

    throw error;
  }
};

// Convenience methods
export const apiGet = (endpoint: string, options: RequestInit = {}) =>
  apiFetch(endpoint, { ...options, method: 'GET' });

export const apiPost = (endpoint: string, data?: unknown, options: RequestInit = {}) =>
  apiFetch(endpoint, {
    ...options,
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });

export const apiPut = (endpoint: string, data?: unknown, options: RequestInit = {}) =>
  apiFetch(endpoint, {
    ...options,
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });

export const apiPatch = (endpoint: string, data?: unknown, options: RequestInit = {}) =>
  apiFetch(endpoint, {
    ...options,
    method: 'PATCH',
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