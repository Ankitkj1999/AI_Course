import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Eye, 
  Calendar, 
  Trash2, 
  ExternalLink, 
  Brain,
  Plus,
  Loader2,
  Globe,
  Lock,
  GitFork
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

const FlashcardList: React.FC = () => {
  const [flashcards, setFlashcards] = useState<FlashcardSet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'public' | 'private'>('all');
  const { toast } = useToast();

  const userId = localStorage.getItem('uid');

  const fetchFlashcards = async (page: number = 1) => {
    if (!userId) return;

    try {
      setIsLoading(true);
      const response = await flashcardService.getUserFlashcards(userId, page, 9, visibilityFilter);
      
      if (response.success) {
        setFlashcards(response.flashcards);
        setCurrentPage(response.pagination.currentPage);
        setTotalPages(response.pagination.totalPages);
      }
    } catch (error: unknown) {
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
  }, [userId, visibilityFilter]);

  // Reset pagination when filter changes
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [visibilityFilter]);

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
        
        fetchFlashcards(currentPage);
      }
    } catch (error: unknown) {
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

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              My Flashcards
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage and study your flashcard collections
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="w-[140px] h-9" />
            <Skeleton className="w-32 h-10" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="overflow-hidden border-border/40 bg-card/50">
              <CardHeader className="pb-3 pt-4">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <Skeleton className="w-3/4 h-5 mb-2" />
                    <Skeleton className="w-1/2 h-3" />
                  </div>
                  <Skeleton className="h-5 w-5 rounded" />
                </div>
              </CardHeader>
              <CardContent className="pb-3 pt-0">
                <div className="flex items-center gap-3 mb-4">
                  <Skeleton className="w-12 h-3" />
                  <Skeleton className="w-16 h-3" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="w-16 h-5 rounded-full" />
                  <Skeleton className="w-16 h-5 rounded-full" />
                </div>
              </CardContent>
              <CardFooter className="pt-0 flex gap-2">
                <Skeleton className="flex-1 h-8" />
                <Skeleton className="h-8 w-8" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            My Flashcards
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage and study your flashcard collections
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={visibilityFilter} onValueChange={(value: 'all' | 'public' | 'private') => setVisibilityFilter(value)}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Flashcards</SelectItem>
              <SelectItem value="public">
                <div className="flex items-center">
                  <Globe className="h-3.5 w-3.5 mr-2" />
                  Public
                </div>
              </SelectItem>
              <SelectItem value="private">
                <div className="flex items-center">
                  <Lock className="h-3.5 w-3.5 mr-2" />
                  Private
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <Button asChild>
            <Link to="/dashboard/create-flashcard">
              <Plus className="mr-2 h-4 w-4" />
              Create New
            </Link>
          </Button>
        </div>
      </div>

      {flashcards.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Brain className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              No flashcards yet
            </h3>
            <p className="text-muted-foreground mb-6">
              Create your first flashcard set to start learning!
            </p>
            <Button asChild>
              <Link to="/dashboard/create-flashcard">
                <Plus className="mr-2 h-4 w-4" />
                Create Flashcards
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {flashcards.map((flashcard) => (
              <Card key={flashcard._id} className="group bg-card/50 backdrop-blur-sm border-border/40 flex flex-col">
                <CardHeader className="pb-3 pt-4">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg leading-tight line-clamp-2">{flashcard.title}</CardTitle>
                      <CardDescription className="text-xs mt-1 line-clamp-1">{flashcard.keyword}</CardDescription>
                    </div>
                    <Brain className="h-5 w-5 text-primary shrink-0" />
                  </div>
                </CardHeader>
                <CardContent className="pb-3 pt-0 flex-1 flex flex-col">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" />
                        {flashcard.viewCount}
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(flashcard.createdAt)}
                      </div>
                      {flashcard.isPublic && flashcard.forkCount > 0 && (
                        <>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <GitFork className="h-3.5 w-3.5" />
                            {flashcard.forkCount}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4">
                    <Badge variant="secondary" className="text-xs">
                      {flashcard.cardCount || flashcard.cards.length} cards
                    </Badge>
                    {flashcard.isPublic !== undefined && (
                      <Badge 
                        variant={flashcard.isPublic ? 'success' : 'secondary'} 
                        className="text-xs"
                      >
                        {flashcard.isPublic ? (
                          <>
                            <Globe className="h-3 w-3 mr-1" />
                            Public
                          </>
                        ) : (
                          <>
                            <Lock className="h-3 w-3 mr-1" />
                            Private
                          </>
                        )}
                      </Badge>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="pt-0 flex gap-2">
                  <Button asChild variant="outline" size="sm" className="flex-1 bg-accent/10 border border-border/50 group-hover:bg-accent transition-colors text-xs h-8">
                    <Link to={`/dashboard/flashcard/${flashcard.slug}`}>
                      <ExternalLink className="mr-2 h-3.5 w-3.5" />
                      Study
                    </Link>
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isDeleting === flashcard.slug}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        {isDeleting === flashcard.slug ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Delete Flashcard Set
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{flashcard.title}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(flashcard.slug, flashcard.title)}
                          className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardFooter>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <Button
                variant="outline"
                onClick={() => fetchFlashcards(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="flex items-center px-4 text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => fetchFlashcards(currentPage + 1)}
                disabled={currentPage === totalPages}
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