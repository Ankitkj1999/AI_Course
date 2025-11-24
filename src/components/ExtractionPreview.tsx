import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  FileText, 
  Eye, 
  EyeOff, 
  BookOpen, 
  Brain, 
  Sparkles, 
  FileQuestion,
  Loader2 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { serverURL } from '@/constants';
import axios from 'axios';

interface ExtractionPreviewProps {
  processingId: string;
  preview: string;
  onGenerateContent?: (contentType: 'course' | 'quiz' | 'flashcard' | 'guide', processingId: string) => void;
}

const ExtractionPreview: React.FC<ExtractionPreviewProps> = ({
  processingId,
  preview,
  onGenerateContent,
}) => {
  const [showFullText, setShowFullText] = useState(false);
  const [fullText, setFullText] = useState<string>('');
  const [isLoadingFullText, setIsLoadingFullText] = useState(false);
  const { toast } = useToast();

  const fetchFullText = async () => {
    if (fullText) {
      // Already loaded, just toggle
      setShowFullText(!showFullText);
      return;
    }

    setIsLoadingFullText(true);
    try {
      const response = await axios.get(
        `${serverURL}/api/document/text/${processingId}`,
        { withCredentials: true }
      );

      setFullText(response.data.text);
      setShowFullText(true);
    } catch (error: unknown) {
      console.error('Error fetching full text:', error);
      toast({
        title: "Failed to Load Full Text",
        description: (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Could not retrieve the full extracted text',
        variant: "destructive",
      });
    } finally {
      setIsLoadingFullText(false);
    }
  };

  const handleGenerateContent = (contentType: 'course' | 'quiz' | 'flashcard' | 'guide') => {
    if (onGenerateContent) {
      onGenerateContent(contentType, processingId);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Extracted Text Preview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {showFullText ? fullText : preview}
              {!showFullText && preview.length >= 500 && '...'}
            </p>
          </div>

          <div className="flex justify-between items-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={fetchFullText}
              disabled={isLoadingFullText}
            >
              {isLoadingFullText ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : showFullText ? (
                <>
                  <EyeOff className="mr-2 h-4 w-4" />
                  Show Preview Only
                </>
              ) : (
                <>
                  <Eye className="mr-2 h-4 w-4" />
                  Show Full Text
                </>
              )}
            </Button>
            <span className="text-xs text-gray-500">
              {showFullText && fullText
                ? `${fullText.length.toLocaleString()} characters`
                : `Preview: ${preview.length} characters`}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Generate Content</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2"
              onClick={() => handleGenerateContent('course')}
            >
              <BookOpen className="h-6 w-6 text-blue-500" />
              <div className="text-center">
                <div className="font-semibold">Course</div>
                <div className="text-xs text-gray-500">Structured learning path</div>
              </div>
            </Button>

            <Button
              type="button"
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2"
              onClick={() => handleGenerateContent('quiz')}
            >
              <FileQuestion className="h-6 w-6 text-green-500" />
              <div className="text-center">
                <div className="font-semibold">Quiz</div>
                <div className="text-xs text-gray-500">Multiple choice questions</div>
              </div>
            </Button>

            <Button
              type="button"
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2"
              onClick={() => handleGenerateContent('flashcard')}
            >
              <Brain className="h-6 w-6 text-purple-500" />
              <div className="text-center">
                <div className="font-semibold">Flashcards</div>
                <div className="text-xs text-gray-500">Question-answer pairs</div>
              </div>
            </Button>

            <Button
              type="button"
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2"
              onClick={() => handleGenerateContent('guide')}
            >
              <Sparkles className="h-6 w-6 text-orange-500" />
              <div className="text-center">
                <div className="font-semibold">Guide</div>
                <div className="text-xs text-gray-500">Comprehensive study material</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExtractionPreview;
