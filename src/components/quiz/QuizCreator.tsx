import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QuizService } from '@/services/quizService';
import { getQuizURL } from '@/utils/config';
import { LoadingButton } from '@/components/ui/loading';
import { useToast } from '@/hooks/use-toast';
import { Brain, Sparkles, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import ProviderSelector from '@/components/ProviderSelector';
import { useProviderPreferences } from '@/hooks/useProviderPreferences';
import { useVisibilityPreference } from '@/hooks/useVisibilityPreference';
import { CreationVisibilityToggle } from '@/components/CreationVisibilityToggle';

interface QuizCreatorProps {
  userId: string;
}

export const QuizCreator: React.FC<QuizCreatorProps> = ({ userId }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    keyword: '',
    title: '',
    format: 'mixed'
  });
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Use provider preferences hook for quiz generation
  const {
    selectedProvider,
    selectedModel,
    setSelectedProvider,
    setSelectedModel
  } = useProviderPreferences('quiz');

  // Use visibility preference hook
  const { isPublic, setIsPublic } = useVisibilityPreference('quiz', true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.keyword.trim() || !formData.title.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const response = await QuizService.createQuiz({
        userId,
        keyword: formData.keyword.trim(),
        title: formData.title.trim(),
        format: formData.format,
        provider: selectedProvider,
        model: selectedModel,
        isPublic: isPublic
      });

      if (response.success) {
        toast({
          title: "Quiz Created!",
          description: `"${response.quiz.title}" has been created as ${isPublic ? 'public' : 'private'} content.`,
        });
        const quizURL = getQuizURL({ slug: response.quiz.slug, _id: response.quiz._id });
        navigate(quizURL);
      } else {
        setError('Failed to create quiz. Please try again.');
        toast({
          title: "Error",
          description: "Failed to create quiz. Please try again.",
          variant: "destructive",
        });
      }
    } catch (err) {
      setError('An error occurred while creating the quiz.');
      toast({
        title: "Error",
        description: "An error occurred while creating the quiz.",
        variant: "destructive",
      });
      console.error('Quiz creation error:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (error) setError(null);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Create Quiz
          </CardTitle>
          <CardDescription>
            Generate AI-powered quizzes for any topic to enhance learning
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
              <Label htmlFor="keyword">
                Topic/Keyword *
              </Label>
              <Input
                id="keyword"
                type="text"
                name="keyword"
                value={formData.keyword}
                onChange={handleInputChange}
                placeholder="e.g., JavaScript fundamentals, React hooks, Node.js..."
                disabled={isCreating}
                required
              />
              <p className="text-sm text-muted-foreground">
                The main topic you want to create a quiz about
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">
                Quiz Title *
              </Label>
              <Input
                id="title"
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g., JavaScript Fundamentals Quiz"
                disabled={isCreating}
                required
              />
              <p className="text-sm text-muted-foreground">
                A descriptive title for your quiz
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="format">
                Quiz Format
              </Label>
              <select
                id="format"
                name="format"
                value={formData.format}
                onChange={handleInputChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isCreating}
              >
                <option value="mixed">Mixed Questions</option>
                <option value="multiple-choice">Multiple Choice Only</option>
                <option value="open-ended">Open-Ended Questions</option>
              </select>
              <p className="text-sm text-muted-foreground">
                Choose the type of questions for your quiz
              </p>
            </div>

            {/* Visibility Toggle */}
            <CreationVisibilityToggle
              contentType="quiz"
              isPublic={isPublic}
              onChange={setIsPublic}
            />

            {/* Error Message */}
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <p className="text-destructive text-sm">{error}</p>
              </div>
            )}

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-900 dark:text-blue-400 mb-1">
                    What you'll get:
                  </h4>
                  <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                    <li>• 15-20 comprehensive questions</li>
                    <li>• Questions with explanations for learning</li>
                    <li>• Multiple choice and open-ended formats</li>
                    <li>• Shareable quiz with unique link</li>
                  </ul>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isCreating || !formData.keyword.trim() || !formData.title.trim()}
              className="w-full"
            >
              {isCreating ? (
                <>
                  <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                  Creating Quiz...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Quiz
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};