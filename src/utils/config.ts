/**
 * Dynamic configuration utility for AiCourse
 * Handles environment-based configuration and runtime detection
 */

// Get current environment
export const getEnvironment = () => {
  return import.meta.env.MODE || 'development';
};

// Check if running in development
export const isDevelopment = () => {
  return getEnvironment() === 'development';
};

// Check if running in production
export const isProduction = () => {
  return getEnvironment() === 'production';
};

// Get server URL with fallback and auto-detection
export const getServerURL = () => {
  // Try environment variable first
  if (import.meta.env.VITE_SERVER_URL) {
    return import.meta.env.VITE_SERVER_URL;
  }
  
  // In development, try to detect from current location
  if (isDevelopment() && typeof window !== 'undefined') {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    
    // Try common backend ports in order
    const commonPorts = [5010, 5011, 5012, 5013, 5014, 5015];
    const preferredPort = commonPorts[0]; // Default to 5010
    
    return `${protocol}//${hostname}:${preferredPort}`;
  }
  
  // Fallback
  return 'http://localhost:5010';
};

// Auto-detect server URL by testing connectivity
export const detectServerURL = async (): Promise<string> => {
  const baseURL = getServerURL();
  
  // If we have a specific URL from env, use it
  if (import.meta.env.VITE_SERVER_URL) {
    return baseURL;
  }
  
  // In development, try to find the actual server port
  if (isDevelopment() && typeof window !== 'undefined') {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const commonPorts = [5010, 5011, 5012, 5013, 5014, 5015];
    
    for (const port of commonPorts) {
      try {
        const testURL = `${protocol}//${hostname}:${port}`;
        const response = await fetch(`${testURL}/health`, { 
          method: 'GET',
          signal: AbortSignal.timeout(1000) // 1 second timeout
        });
        
        if (response.ok) {
          console.log(`🔍 Auto-detected server at: ${testURL}`);
          return testURL;
        }
      } catch (error) {
        // Port not available, try next
        continue;
      }
    }
  }
  
  return baseURL;
};

// Get website URL with fallback
export const getWebsiteURL = () => {
  // If running in browser, use current location
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.host}`;
  }
  
  // Try environment variable
  if (import.meta.env.VITE_WEBSITE_URL) {
    return import.meta.env.VITE_WEBSITE_URL;
  }
  
  // Fallback
  return 'http://localhost:8080';
};

// Get API base URL
export const getAPIBaseURL = () => {
  return `${getServerURL()}/api`;
};

// Configuration object
export const config = {
  app: {
    name: import.meta.env.VITE_APP_NAME || 'AiCourse',
    company: import.meta.env.VITE_COMPANY_NAME || 'Spacester',
    logo: import.meta.env.VITE_APP_LOGO || 'https://firebasestorage.googleapis.com/v0/b/aicourse-81b42.appspot.com/o/aicouse.png?alt=media&token=7175cdbe-64b4-4fe4-bb6d-b519347ad8af',
  },
  urls: {
    website: getWebsiteURL(),
    server: getServerURL(),
    api: getAPIBaseURL(),
  },
  environment: {
    mode: getEnvironment(),
    isDevelopment: isDevelopment(),
    isProduction: isProduction(),
    debug: import.meta.env.VITE_DEBUG === 'true',
  },
  features: {
    // Feature flags can be controlled via environment variables
    pwa: import.meta.env.VITE_ENABLE_PWA !== 'false',
    analytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
    errorReporting: import.meta.env.VITE_ENABLE_ERROR_REPORTING === 'true',
  }
};

// Log configuration in development
if (isDevelopment()) {
  console.log('🔧 AiCourse Configuration:', config);
}