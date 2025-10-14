import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Eye, 
  Calendar, 
  Trash2, 
  ExternalLink, 
  Brain,
  Plus,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { flashcardService } from '@/services/flashcardService';
import { FlashcardSet } from '@/types/flashcard';
import { Link } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const FlashcardList: React.FC = () => {
  const [flashcards, setFlashcards] = useState<FlashcardSet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { toast } = useToast();

  const userId = sessionStorage.getItem('uid');

  const fetchFlashcards = async (page: number = 1) => {
    if (!userId) return;

    try {
      setIsLoading(true);
      const response = await flashcardService.getUserFlashcards(userId, page, 9);
      
      if (response.success) {
        setFlashcards(response.flashcards);
        setCurrentPage(response.pagination.currentPage);
        setTotalPages(response.pagination.totalPages);
      }
    } catch (error: any) {
      console.error('Error fetching flashcards:', error);
      toast({
        title: "Error",
        description: "Failed to load flashcards. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFlashcards();
  }, [userId]);

  const handleDelete = async (slug: string, title: string) => {
    if (!userId) return;

    setIsDeleting(slug);
    try {
      const response = await flashcardService.deleteFlashcard(slug, userId);
      
      if (response.success) {
        toast({
          title: "Deleted",
          description: `"${title}" has been deleted successfully.`,
        });
        
        // Refresh the list
        fetchFlashcards(currentPage);
      }
    } catch (error: any) {
      console.error('Error deleting flashcard:', error);
      toast({
        title: "Error",
        description: "Failed to delete flashcard set. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'hard': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            My Flashcards
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Manage and study your flashcard collections
          </p>
        </div>
        <Button asChild className="bg-gradient-to-r from-primary to-purple-600 hover:from-purple-600 hover:to-primary">
          <Link to="/dashboard/create-flashcard">
            <Plus className="mr-2 h-4 w-4" />
            Create New
          </Link>
        </Button>
      </div>

      {flashcards.length === 0 ? (
        <Card className="bg-white dark:bg-gray-800 text-center py-12">
          <CardContent>
            <Brain className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No flashcards yet
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Create your first flashcard set to start learning!
            </p>
            <Button asChild className="bg-gradient-to-r from-primary to-purple-600 hover:from-purple-600 hover:to-primary">
              <Link to="/dashboard/create-flashcard">
                <Plus className="mr-2 h-4 w-4" />
                Create Flashcards
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {flashcards.map((flashcard) => (
              <Card key={flashcard._id} className="bg-white dark:bg-gray-800 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2">
                        {flashcard.title}
                      </CardTitle>
                      <CardDescription className="text-gray-600 dark:text-gray-300 mt-1">
                        {flashcard.keyword}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" className="ml-2">
                      {flashcard.cardCount || flashcard.cards.length} cards
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {flashcard.viewCount}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(flashcard.createdAt)}
                      </div>
                    </div>

                    <div className="flex gap-2 justify-between items-center">
                      <Button asChild variant="default" size="sm" className="flex-1">
                        <Link to={`/dashboard/flashcard/${flashcard.slug}`}>
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Study
                        </Link>
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            disabled={isDeleting === flashcard.slug}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                          >
                            {isDeleting === flashcard.slug ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-white dark:bg-gray-800">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-gray-900 dark:text-white">
                              Delete Flashcard Set
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-gray-600 dark:text-gray-300">
                              Are you sure you want to delete "{flashcard.title}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600">
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(flashcard.slug, flashcard.title)}
                              className="bg-red-600 hover:bg-red-700 text-white"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <Button
                variant="outline"
                onClick={() => fetchFlashcards(currentPage - 1)}
                disabled={currentPage === 1}
                className="dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600"
              >
                Previous
              </Button>
              <span className="flex items-center px-4 text-gray-600 dark:text-gray-300">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => fetchFlashcards(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600"
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FlashcardList;