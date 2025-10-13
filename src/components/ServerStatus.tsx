import React from 'react';
import { useServer } from '@/providers/ServerProvider';
import { AlertCircle, CheckCircle, Loader2, RefreshCw } from 'lucide-react';

export const ServerStatus: React.FC = () => {
  const { serverURL, isConnected, isLoading, error, reconnect } = useServer();

  // Don't show in production
  if (import.meta.env.PROD) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="fixed bottom-4 left-4 bg-blue-100 border border-blue-300 rounded-lg p-3 flex items-center space-x-2 text-sm">
        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
        <span className="text-blue-800">Connecting to server...</span>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="fixed bottom-4 left-4 bg-red-100 border border-red-300 rounded-lg p-3 flex items-center space-x-2 text-sm">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <div className="flex-1">
          <div className="text-red-800 font-medium">Server Disconnected</div>
          <div className="text-red-600 text-xs">{error || 'Cannot reach server'}</div>
        </div>
        <button
          onClick={reconnect}
          className="text-red-600 hover:text-red-800 p-1"
          title="Retry connection"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 bg-green-100 border border-green-300 rounded-lg p-3 flex items-center space-x-2 text-sm">
      <CheckCircle className="h-4 w-4 text-green-600" />
      <div className="text-green-800">
        <div className="font-medium">Server Connected</div>
        <div className="text-xs text-green-600">{serverURL}</div>
      </div>
    </div>
  );
};