import { useState, useEffect } from 'react';
import { detectServerURL } from '@/utils/config';

interface ServerConfig {
  serverURL: string;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  retryConnection: () => void;
}

export const useServerConfig = (): ServerConfig => {
  const [serverURL, setServerURL] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const checkConnection = async (url: string): Promise<boolean> => {
    try {
      const response = await fetch(`${url}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000)
      });
      return response.ok;
    } catch {
      return false;
    }
  };

  const discoverServer = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const detectedURL = await detectServerURL();
      setServerURL(detectedURL);

      const connected = await checkConnection(detectedURL);
      setIsConnected(connected);

      if (!connected) {
        setError(`Cannot connect to server at ${detectedURL}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to discover server');
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  const retryConnection = () => {
    discoverServer();
  };

  useEffect(() => {
    discoverServer();
  }, []);

  return {
    serverURL,
    isConnected,
    isLoading,
    error,
    retryConnection
  };
};