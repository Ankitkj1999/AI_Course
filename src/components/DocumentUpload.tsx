import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, File, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { serverURL } from '@/constants';
import axios from 'axios';

interface DocumentUploadProps {
  onExtractionComplete?: (processingId: string, preview: string) => void;
  onError?: (error: string) => void;
}

type ProcessingStatus = 'idle' | 'uploading' | 'processing' | 'completed' | 'failed';

const DocumentUpload: React.FC<DocumentUploadProps> = ({ onExtractionComplete, onError }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [status, setStatus] = useState<ProcessingStatus>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
  const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.txt'];

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `File size exceeds 10MB limit. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB.`;
    }

    // Check file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_TYPES.includes(file.type) && !ALLOWED_EXTENSIONS.includes(fileExtension)) {
      return `Invalid file type. Only PDF, DOCX, and TXT files are allowed.`;
    }

    return null;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelection(files[0]);
    }
  };

  const handleFileSelection = (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      toast({
        title: "Invalid File",
        description: validationError,
        variant: "destructive",
      });
      setErrorMessage(validationError);
      if (onError) onError(validationError);
      return;
    }

    setSelectedFile(file);
    setErrorMessage('');
    setStatus('idle');
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelection(files[0]);
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
        setUploadProgress(100);
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        
        toast({
          title: "Extraction Complete",
          description: "Document text has been successfully extracted.",
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
          description: error || 'Failed to extract text from document',
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

  const handleUpload = async () => {
    if (!selectedFile) return;

    setStatus('uploading');
    setUploadProgress(0);
    setErrorMessage('');

    const formData = new FormData();
    formData.append('document', selectedFile);

    try {
      const response = await axios.post(`${serverURL}/api/document/upload`, formData, {
        withCredentials: true,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(progress);
          }
        },
      });

      const { processingId: id } = response.data;
      setProcessingId(id);
      setStatus('processing');

      // Start polling for status
      pollingIntervalRef.current = setInterval(() => {
        pollProcessingStatus(id);
      }, 2000); // Poll every 2 seconds

    } catch (error: unknown) {
      console.error('Upload error:', error);
      setStatus('failed');
      
      const errorMsg = (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to upload document';
      setErrorMessage(errorMsg);
      
      toast({
        title: "Upload Failed",
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
    setSelectedFile(null);
    setStatus('idle');
    setUploadProgress(0);
    setProcessingId(null);
    setErrorMessage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <File className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'uploading':
        return `Uploading... ${uploadProgress}%`;
      case 'processing':
        return 'Extracting text...';
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
      <Card
        className={`border-2 border-dashed transition-colors ${
          isDragging ? 'border-primary bg-primary/5' : 'border-gray-300'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CardContent className="p-6">
          {!selectedFile ? (
            <div className="text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-sm text-gray-600 mb-2">
                Drag and drop your document here, or click to browse
              </p>
              <p className="text-xs text-gray-500 mb-4">
                Supported formats: PDF, DOCX, TXT (Max 10MB)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={handleFileInputChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                Select File
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {getStatusIcon()}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                {status === 'idle' && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleReset}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {status !== 'idle' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{getStatusText()}</span>
                    {status === 'uploading' && (
                      <span className="text-gray-500">{uploadProgress}%</span>
                    )}
                  </div>
                  {(status === 'uploading' || status === 'processing') && (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${status === 'uploading' ? uploadProgress : 50}%` }}
                      />
                    </div>
                  )}
                </div>
              )}

              {errorMessage && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                  <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
                </div>
              )}

              <div className="flex gap-2">
                {status === 'idle' && (
                  <Button
                    type="button"
                    onClick={handleUpload}
                    className="flex-1"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload & Extract
                  </Button>
                )}
                {(status === 'completed' || status === 'failed') && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleReset}
                    className="flex-1"
                  >
                    Upload Another File
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentUpload;
