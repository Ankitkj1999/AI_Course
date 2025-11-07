import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft, 
  ChevronRight, 
  RotateCcw, 
  ArrowLeft,
  Eye,
  Calendar,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { flashcardService } from '@/services/flashcardService';
import { FlashcardSet, FlashcardType } from '@/types/flashcard';

const FlashcardViewer: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [flashcardSet, setFlashcardSet] = useState<FlashcardSet | null>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      fetchFlashcardSet();
    }
  }, [slug]);

  const fetchFlashcardSet = async () => {
    if (!slug) return;

    try {
      setIsLoading(true);
      const response = await flashcardService.getFlashcardBySlug(slug);
      
      if (response.success) {
        setFlashcardSet(response.flashcard);
      } else {
        throw new Error('Flashcard set not found');
      }
    } catch (error: unknown) {
      console.error('Error fetching flashcard set:', error);

      const getErrorMessage = (error: unknown): string => {
        if (typeof error === 'object' && error !== null) {
          const err = error as { message?: string };
          return err.message || "Failed to load flashcard set. Please try again.";
        }
        return "Failed to load flashcard set. Please try again.";
      };

      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
      navigate('/dashboard/flashcards');
    } finally {
      setIsLoading(false);
    }
  };

  const nextCard = () => {
    if (!flashcardSet) return;
    setCurrentCardIndex((prev) => (prev + 1) % flashcardSet.cards.length);
    setIsFlipped(false);
  };

  const prevCard = () => {
    if (!flashcardSet) return;
    setCurrentCardIndex((prev) => (prev - 1 + flashcardSet.cards.length) % flashcardSet.cards.length);
    setIsFlipped(false);
  };

  const flipCard = () => {
    setIsFlipped(!isFlipped);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'hard': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!flashcardSet) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Flashcard set not found
          </h1>
          <Button onClick={() => navigate('/dashboard/flashcards')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Flashcards
          </Button>
        </div>
      </div>
    );
  }

  const currentCard = flashcardSet.cards[currentCardIndex];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/dashboard/flashcards')}
          className="mb-4 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Flashcards
        </Button>
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {flashcardSet.title}
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              {flashcardSet.keyword}
            </p>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {flashcardSet.viewCount} views
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {formatDate(flashcardSet.createdAt)}
            </div>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600 dark:text-gray-300">
            Card {currentCardIndex + 1} of {flashcardSet.cards.length}
          </span>
          <Badge className={getDifficultyColor(currentCard.difficulty)}>
            {currentCard.difficulty}
          </Badge>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentCardIndex + 1) / flashcardSet.cards.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Flashcard */}
      <div className="mb-8">
        <Card
          className="min-h-[300px] cursor-pointer transition-all duration-300 hover:shadow-lg"
          onClick={flipCard}
        >
          <CardContent className="p-8 flex items-center justify-center text-center min-h-[300px]">
            <div className="w-full">
              {!isFlipped ? (
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Question
                  </div>
                  <div className="text-xl md:text-2xl font-medium text-gray-900 dark:text-white">
                    {currentCard.front}
                  </div>
                  <div className="mt-6 text-sm text-gray-500 dark:text-gray-400">
                    Click to reveal answer
                  </div>
                </div>
              ) : (
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Answer
                  </div>
                  <div className="text-lg md:text-xl text-gray-900 dark:text-white whitespace-pre-wrap">
                    {currentCard.back}
                  </div>
                  {currentCard.tags.length > 0 && (
                    <div className="mt-6 flex flex-wrap gap-2 justify-center">
                      {currentCard.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-4">
        <Button
          variant="outline"
          onClick={prevCard}
          disabled={flashcardSet.cards.length <= 1}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>
        
        <Button
          variant="outline"
          onClick={flipCard}
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Flip Card
        </Button>
        
        <Button
          variant="outline"
          onClick={nextCard}
          disabled={flashcardSet.cards.length <= 1}
        >
          Next
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default FlashcardViewer;