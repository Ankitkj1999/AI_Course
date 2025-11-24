import React, { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TextInputProps {
  onTextReady?: (text: string) => void;
  onError?: (error: string) => void;
}

const MAX_CHARACTERS = 50000;

const TextInput: React.FC<TextInputProps> = ({ onTextReady, onError }) => {
  const [text, setText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const { toast } = useToast();

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    
    if (newText.length > MAX_CHARACTERS) {
      const error = `Text exceeds maximum length of ${MAX_CHARACTERS.toLocaleString()} characters`;
      setErrorMessage(error);
      toast({
        title: "Text Too Long",
        description: error,
        variant: "destructive",
      });
      if (onError) onError(error);
      return;
    }

    setText(newText);
    setErrorMessage('');

    // Notify parent when text is ready (has content)
    if (newText.trim() && onTextReady) {
      onTextReady(newText.trim());
    }
  };

  const characterCount = text.length;
  const isNearLimit = characterCount > MAX_CHARACTERS * 0.9;
  const isOverLimit = characterCount > MAX_CHARACTERS;

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Direct Text Input</span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs ${
                    isOverLimit
                      ? 'text-red-600 font-semibold'
                      : isNearLimit
                      ? 'text-yellow-600 font-medium'
                      : 'text-gray-500'
                  }`}
                >
                  {characterCount.toLocaleString()} / {MAX_CHARACTERS.toLocaleString()}
                </span>
              </div>
            </div>

            <Textarea
              placeholder="Paste or type your text here..."
              value={text}
              onChange={handleTextChange}
              className="min-h-[200px] resize-y"
              rows={10}
            />

            <p className="text-xs text-gray-500">
              Enter text directly to generate content without uploading a file
            </p>
          </div>

          {errorMessage && (
            <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
            </div>
          )}

          {isNearLimit && !isOverLimit && (
            <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
              <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                Approaching character limit. You have {(MAX_CHARACTERS - characterCount).toLocaleString()} characters remaining.
              </p>
            </div>
          )}

          {text.trim() && !isOverLimit && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
              <p className="text-sm text-green-600 dark:text-green-400">
                ✓ Text ready for content generation
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TextInput;
