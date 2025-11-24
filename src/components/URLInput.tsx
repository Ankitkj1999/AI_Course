import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Link, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { serverURL } from '@/constants';
import axios from 'axios';

interface URLInputProps {
  onExtractionComplete?: (processingId: string, preview: string) => void;
  onError?: (error: string) => void;
}

type ProcessingStatus = 'idle' | 'extracting' | 'completed' | 'failed';

const URLInput: React.FC<URLInputProps> = ({ onExtractionComplete, onError }) => {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<ProcessingStatus>('idle');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const { toast } = useToast();
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const validateURL = (urlString: string): string | null => {
    if (!urlString.trim()) {
      return 'Please enter a URL';
    }

    // Check if URL starts with http:// or https://
    const urlPattern = /^https?:\/\/.+/i;
    if (!urlPattern.test(urlString)) {
      return 'URL must start with http:// or https://';
    }

    // Try to parse the URL
    try {
      new URL(urlString);
      return null;
    } catch {
      return 'Invalid URL format';
    }
  };

  const pollProcessingStatus = async (id: string) => {
    try {
      const response = await axios.get(`${serverURL}/api/document/status/${id}`, {
        withCredentials: true,
      });

      const { status: processingStatus, preview, errorMessage: error } = response.data;

      if (processingStatus === 'completed') {
        setStatus('completed');
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        
        toast({
          title: "Extraction Complete",
          description: "Web content has been successfully extracted.",
        });

        if (onExtractionComplete) {
          onExtractionComplete(id, preview);
        }
      } else if (processingStatus === 'failed') {
        setStatus('failed');
        setErrorMessage(error || 'Extraction failed');
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        
        toast({
          title: "Extraction Failed",
          description: error || 'Failed to extract content from URL',
          variant: "destructive",
        });

        if (onError) onError(error || 'Extraction failed');
      }
    } catch (error) {
      console.error('Error polling status:', error);
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      setStatus('failed');
      setErrorMessage('Failed to check processing status');
    }
  };

  const handleExtract = async () => {
    const validationError = validateURL(url);
    if (validationError) {
      toast({
        title: "Invalid URL",
        description: validationError,
        variant: "destructive",
      });
      setErrorMessage(validationError);
      if (onError) onError(validationError);
      return;
    }

    setStatus('extracting');
    setErrorMessage('');

    try {
      const response = await axios.post(
        `${serverURL}/api/document/extract-url`,
        { url: url.trim() },
        { withCredentials: true }
      );

      const { processingId: id } = response.data;
      setProcessingId(id);

      // Start polling for status
      pollingIntervalRef.current = setInterval(() => {
        pollProcessingStatus(id);
      }, 2000); // Poll every 2 seconds

    } catch (error: unknown) {
      console.error('Extraction error:', error);
      setStatus('failed');
      
      const errorMsg = (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to extract content from URL';
      setErrorMessage(errorMsg);
      
      toast({
        title: "Extraction Failed",
        description: errorMsg,
        variant: "destructive",
      });

      if (onError) onError(errorMsg);
    }
  };

  const handleReset = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setUrl('');
    setStatus('idle');
    setProcessingId(null);
    setErrorMessage('');
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'extracting':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Link className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'extracting':
        return 'Extracting content from URL...';
      case 'completed':
        return 'Extraction complete';
      case 'failed':
        return 'Extraction failed';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="url"
                  placeholder="https://example.com/article"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && status === 'idle') {
                      handleExtract();
                    }
                  }}
                  disabled={status === 'extracting'}
                  className="pl-10"
                />
              </div>
              {status === 'idle' && (
                <Button
                  type="button"
                  onClick={handleExtract}
                  disabled={!url.trim()}
                >
                  Extract
                </Button>
              )}
            </div>
            <p className="text-xs text-gray-500">
              Enter a web URL to extract its content (HTTP/HTTPS only)
            </p>
          </div>

          {status !== 'idle' && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                {getStatusIcon()}
                <div className="flex-1">
                  <p className="text-sm font-medium">{getStatusText()}</p>
                  {url && (
                    <p className="text-xs text-gray-500 truncate">{url}</p>
                  )}
                </div>
              </div>

              {status === 'extracting' && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full animate-pulse" style={{ width: '50%' }} />
                </div>
              )}

              {errorMessage && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                  <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
                </div>
              )}

              {(status === 'completed' || status === 'failed') && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  className="w-full"
                >
                  Extract Another URL
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default URLInput;
