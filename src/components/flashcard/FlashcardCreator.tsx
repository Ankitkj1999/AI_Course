import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Brain, Sparkles, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { flashcardService } from '@/services/flashcardService';
import { useNavigate } from 'react-router-dom';
import ProviderSelector from '@/components/ProviderSelector';
import { useProviderPreferences } from '@/hooks/useProviderPreferences';

const FlashcardCreator: React.FC = () => {
  const [keyword, setKeyword] = useState('');
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Use provider preferences hook for flashcard generation
  const {
    selectedProvider,
    selectedModel,
    setSelectedProvider,
    setSelectedModel
  } = useProviderPreferences('flashcard');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!keyword.trim() || !title.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in both keyword and title fields.",
        variant: "destructive",
      });
      return;
    }

    const userId = localStorage.getItem('uid');
    if (!userId) {
      toast({
        title: "Authentication Error",
        description: "Please log in to create flashcards.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await flashcardService.createFlashcardSet({
        userId,
        keyword: keyword.trim(),
        title: title.trim(),
        provider: selectedProvider,
        model: selectedModel
      });

      if (response.success) {
        toast({
          title: "Flashcards Created!",
          description: `Successfully created ${response.cards.length} flashcards.`,
        });
        
        // Navigate to the flashcard viewer
        navigate(`/dashboard/flashcard/${response.slug}`);
      } else {
        throw new Error(response.message || 'Failed to create flashcards');
      }
    } catch (error: unknown) {
      console.error('Error creating flashcards:', error);

      let errorMessage = "Failed to create flashcards. Please try again.";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string } } };
        errorMessage = axiosError.response?.data?.message || errorMessage;
      }

      toast({
        title: "Creation Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card className="bg-white dark:bg-gray-800 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            <Brain className="h-5 w-5 text-primary" />
            Create Flashcards
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-300">
            Generate AI-powered flashcards for any topic to enhance your learning
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Provider Selection */}
            <ProviderSelector
              selectedProvider={selectedProvider}
              selectedModel={selectedModel}
              onProviderChange={setSelectedProvider}
              onModelChange={setSelectedModel}
              showPerformanceIndicators={true}
              showCostInfo={true}
              className="mb-6"
            />
            <div className="space-y-2">
              <Label htmlFor="keyword" className="text-gray-700 dark:text-gray-300">
                Topic/Keyword *
              </Label>
              <Input
                id="keyword"
                type="text"
                placeholder="e.g., Photosynthesis, JavaScript Functions, World War II"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                The main topic you want to create flashcards about
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title" className="text-gray-700 dark:text-gray-300">
                Flashcard Set Title *
              </Label>
              <Input
                id="title"
                type="text"
                placeholder="e.g., Biology: Photosynthesis Basics"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                A descriptive title for your flashcard set
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-900 dark:text-blue-400 mb-1">
                    What you'll get:
                  </h4>
                  <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                    <li>• 15-20 comprehensive flashcards</li>
                    <li>• Questions covering key concepts and definitions</li>
                    <li>• Difficulty levels (easy, medium, hard)</li>
                    <li>• Organized with relevant tags</li>
                  </ul>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading || !keyword.trim() || !title.trim()}
              className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-purple-600 hover:to-primary"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Flashcards...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Flashcards
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default FlashcardCreator;