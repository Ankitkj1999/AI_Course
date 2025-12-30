import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileUp, Link as LinkIcon, FileText } from 'lucide-react';
import DocumentUpload from '@/components/DocumentUpload';
import URLInput from '@/components/URLInput';
import TextInput from '@/components/TextInput';
import ExtractionPreview from '@/components/ExtractionPreview';

interface DocumentBasedCreationProps {
  onGenerateContent?: (contentType: 'course' | 'quiz' | 'flashcard', source: { processingId?: string; text?: string }) => void;
}

const DocumentBasedCreation: React.FC<DocumentBasedCreationProps> = ({ onGenerateContent }) => {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [directText, setDirectText] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('upload');

  const handleExtractionComplete = (id: string, previewText: string) => {
    setProcessingId(id);
    setPreview(previewText);
  };

  const handleTextReady = (text: string) => {
    setDirectText(text);
  };

  const handleGenerateContent = (contentType: 'course' | 'quiz' | 'flashcard', id: string) => {
    if (onGenerateContent) {
      onGenerateContent(contentType, { processingId: id });
    }
  };

  const handleGenerateFromText = (contentType: 'course' | 'quiz' | 'flashcard') => {
    if (onGenerateContent && directText) {
      onGenerateContent(contentType, { text: directText });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create from Document</CardTitle>
          <CardDescription>
            Upload a document, provide a URL, or paste text to generate educational content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <FileUp className="h-4 w-4" />
                <span className="hidden sm:inline">Upload File</span>
                <span className="sm:hidden">File</span>
              </TabsTrigger>
              <TabsTrigger value="url" className="flex items-center gap-2">
                <LinkIcon className="h-4 w-4" />
                <span className="hidden sm:inline">From URL</span>
                <span className="sm:hidden">URL</span>
              </TabsTrigger>
              <TabsTrigger value="text" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Paste Text</span>
                <span className="sm:hidden">Text</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="mt-6">
              <DocumentUpload onExtractionComplete={handleExtractionComplete} />
            </TabsContent>

            <TabsContent value="url" className="mt-6">
              <URLInput onExtractionComplete={handleExtractionComplete} />
            </TabsContent>

            <TabsContent value="text" className="mt-6">
              <TextInput onTextReady={handleTextReady} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Show preview for file/URL extractions */}
      {processingId && preview && (activeTab === 'upload' || activeTab === 'url') && (
        <ExtractionPreview
          processingId={processingId}
          preview={preview}
          onGenerateContent={handleGenerateContent}
        />
      )}

      {/* Show generation options for direct text */}
      {directText && activeTab === 'text' && (
        <ExtractionPreview
          processingId=""
          preview={directText.substring(0, 500)}
          onGenerateContent={handleGenerateFromText}
        />
      )}
    </div>
  );
};

export default DocumentBasedCreation;
