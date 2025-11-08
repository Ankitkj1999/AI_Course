/**
 * Dynamic configuration utility for AI Course
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
  
  // In production, use the current origin
  if (isProduction() && typeof window !== 'undefined') {
    return window.location.origin;
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
  
  // Fallback for non-browser environments or other cases
  return 'http://localhost:5010';
};

// Auto-detect server URL by testing connectivity
export const detectServerURL = async (): Promise<string> => {
  const startTime = performance.now();
  console.log('🔍 Starting server URL detection...');

  const baseURL = getServerURL();

  // If we have a specific URL from env, use it
  if (import.meta.env.VITE_SERVER_URL) {
    console.log(`✅ Using env-defined server URL: ${baseURL} (${performance.now() - startTime}ms)`);
    return baseURL;
  }

  // In production, the server URL is the origin, so we can test the health endpoint directly
  if (isProduction() && typeof window !== 'undefined') {
    try {
      console.log(`🔍 Testing production health endpoint: ${window.location.origin}/health`);
      const response = await fetch(`${window.location.origin}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(1000)
      });
      if (response.ok) {
        console.log(`✅ Production server detected: ${window.location.origin} (${performance.now() - startTime}ms)`);
        return window.location.origin;
      }
    } catch (error) {
      console.log(`❌ Production health check failed: ${error.message}`);
      // Fallback to the default if health check fails
    }
  }

  // In development, try to find the actual server port
  if (isDevelopment() && typeof window !== 'undefined') {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const commonPorts = [5010, 5011, 5012, 5013, 5014, 5015];

    console.log(`🔍 Testing development ports in parallel: ${commonPorts.join(', ')}`);

    // Test all ports in parallel with shorter timeout
    const portTests = commonPorts.map(async (port) => {
      try {
        const testURL = `${protocol}//${hostname}:${port}`;
        const portStartTime = performance.now();

        const response = await fetch(`${testURL}/health`, {
          method: 'GET',
          signal: AbortSignal.timeout(200) // Reduced to 200ms timeout
        });

        if (response.ok) {
          console.log(`✅ Server detected at port ${port}: ${testURL} (${(performance.now() - portStartTime).toFixed(2)}ms)`);
          return testURL;
        }
      } catch (error) {
        // Port not available, silently continue
      }
      return null;
    });

    // Wait for the first successful response using Promise.allSettled + find
    const portResults = await Promise.allSettled(portTests);
    const successfulResult = portResults.find(result =>
      result.status === 'fulfilled' && result.value !== null
    );

    if (successfulResult && successfulResult.status === 'fulfilled') {
      console.log(`🎯 Fast server detection completed: ${successfulResult.value} (${performance.now() - startTime}ms total)`);
      return successfulResult.value;
    }

    if (successfulResult && successfulResult.status === 'fulfilled') {
      console.log(`🎯 Fast server detection completed: ${successfulResult.value} (${performance.now() - startTime}ms total)`);
      return successfulResult.value;
    }

    console.log(`⚠️ No server found on common ports (${performance.now() - startTime}ms elapsed)`);
  }

  console.log(`⚠️ Using fallback server URL: ${baseURL} (${performance.now() - startTime}ms)`);
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
    name: import.meta.env.VITE_APP_NAME || 'AI Course',
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

// Quiz URL utilities
export const getQuizURL = (quiz: { slug?: string; _id: string }) => {
  if (quiz.slug) {
    return `/quiz/${quiz.slug}`;
  }
  return `/quiz/id/${quiz._id}`;
};

export const getShareableQuizURL = (quiz: { slug?: string; _id: string }) => {
  const relativePath = getQuizURL(quiz);
  return `${config.urls.website}${relativePath}`;
};

export const getQuizShareURL = (quiz: { slug?: string; _id: string; title?: string }) => {
  const baseURL = getShareableQuizURL(quiz);
  const title = encodeURIComponent(quiz.title || 'AI Generated Quiz');
  
  return {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(baseURL)}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(baseURL)}&text=${title}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(baseURL)}`,
    whatsapp: `https://wa.me/?text=${title}%20${encodeURIComponent(baseURL)}`,
    email: `mailto:?subject=${title}&body=Check out this quiz: ${baseURL}`,
    copy: baseURL
  };
};

// Log configuration in development
if (isDevelopment()) {
  console.log('🔧 AI Course Configuration:', config);
}