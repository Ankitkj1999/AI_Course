import React, { createContext, useContext, useEffect, useState } from 'react';
import { detectServerURL } from '@/utils/config';
import { checkServerHealth } from '@/utils/api';

interface ServerContextType {
  serverURL: string;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  reconnect: () => void;
}

const ServerContext = createContext<ServerContextType | undefined>(undefined);

export const useServer = () => {
  const context = useContext(ServerContext);
  if (!context) {
    throw new Error('useServer must be used within a ServerProvider');
  }
  return context;
};

interface ServerProviderProps {
  children: React.ReactNode;
}

export const ServerProvider: React.FC<ServerProviderProps> = ({ children }) => {
  const [serverURL, setServerURL] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const detectAndConnect = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('🔍 Detecting server URL...');
      const detectedURL = await detectServerURL();
      setServerURL(detectedURL);
      
      console.log(`🔗 Testing connection to: ${detectedURL}`);
      const healthy = await checkServerHealth();
      setIsConnected(healthy);

      if (healthy) {
        console.log('✅ Server connection established');
      } else {
        setError(`Server at ${detectedURL} is not responding`);
        console.error('❌ Server health check failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect to server';
      setError(errorMessage);
      setIsConnected(false);
      console.error('❌ Server detection failed:', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const reconnect = () => {
    console.log('🔄 Reconnecting to server...');
    detectAndConnect();
  };

  useEffect(() => {
    detectAndConnect();
  }, []);

  // Show connection status in development
  useEffect(() => {
    if (import.meta.env.DEV) {
      const status = isLoading ? 'CONNECTING' : isConnected ? 'CONNECTED' : 'DISCONNECTED';
      console.log(`🌐 Server Status: ${status} ${serverURL ? `(${serverURL})` : ''}`);
    }
  }, [serverURL, isConnected, isLoading]);

  return (
    <ServerContext.Provider
      value={{
        serverURL,
        isConnected,
        isLoading,
        error,
        reconnect,
      }}
    >
      {children}
    </ServerContext.Provider>
  );
};