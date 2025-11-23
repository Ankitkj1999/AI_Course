import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { QuizService } from '@/services/quizService';
import { getQuizURL, getQuizShareURL } from '@/utils/config';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Brain,
  Calendar,
  Eye,
  Share2,
  Trash2,
  Plus,
  Loader2,
  Globe,
  Lock,
  GitFork,
  ExternalLink
} from 'lucide-react';
import type { Quiz } from '@/types/quiz';
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

interface QuizListProps {
  userId: string;
}

export const QuizList: React.FC<QuizListProps> = ({ userId }) => {
  const { toast } = useToast();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deletingQuiz, setDeletingQuiz] = useState<string | null>(null);
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'public' | 'private'>('all');

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  useEffect(() => {
    fetchQuizzes();
  }, [currentPage, visibilityFilter]);

  // Reset pagination when filter changes
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [visibilityFilter]);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const response = await QuizService.getUserQuizzes(userId, currentPage, 9, visibilityFilter);
      
      if (response.success) {
        setQuizzes(response.data);
        setTotalPages(response.totalPages);
      } else {
        setError('Failed to fetch quizzes');
      }
    } catch (err) {
      setError('An error occurred while fetching quizzes');
      console.error('Fetch quizzes error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = (quiz: Quiz) => {
    const shareUrls = getQuizShareURL(quiz);
    
    navigator.clipboard.writeText(shareUrls.copy).then(() => {
      toast({
        title: "Link Copied!",
        description: "Quiz link has been copied to clipboard.",
      });
    }).catch(() => {
      toast({
        title: "Error",
        description: "Failed to copy link to clipboard.",
        variant: "destructive",
      });
    });
  };

  const handleDelete = async (slug: string, title: string) => {
    setDeletingQuiz(slug);
    try {
      const response = await QuizService.deleteQuiz(slug, userId);

      if (response.success) {
        toast({
          title: "Deleted",
          description: `"${title}" has been deleted successfully.`,
        });

        fetchQuizzes();
      } else {
        toast({
          title: "Error",
          description: "Failed to delete quiz. Please try again.",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "An error occurred while deleting the quiz.",
        variant: "destructive",
      });
      console.error('Delete quiz error:', err);
    } finally {
      setDeletingQuiz(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">My Quizzes</h1>
            <p className="text-muted-foreground mt-1">Manage your AI-generated quizzes</p>
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
                <Skeleton className="w-16 h-5 rounded-full" />
              </CardContent>
              <CardFooter className="pt-0 flex gap-2">
                <Skeleton className="flex-1 h-8" />
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive mb-4">{error}</p>
        <Button onClick={fetchQuizzes}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Quizzes</h1>
          <p className="text-muted-foreground mt-1">Manage your AI-generated quizzes</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={visibilityFilter} onValueChange={(value: 'all' | 'public' | 'private') => setVisibilityFilter(value)}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Quizzes</SelectItem>
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
            <Link to="/dashboard/create-quiz">
              <Plus className="w-4 h-4 mr-2" />
              Create Quiz
            </Link>
          </Button>
        </div>
      </div>

      {/* Quiz Grid */}
      {quizzes.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Brain className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No quizzes yet</h3>
            <p className="text-muted-foreground mb-6">Create your first AI-generated quiz to get started</p>
            <Button asChild>
              <Link to="/dashboard/create-quiz">
                <Plus className="w-5 h-5 mr-2" />
                Create Your First Quiz
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {quizzes.map((quiz) => {
            const quizURL = getQuizURL(quiz);
            const isDeleting = deletingQuiz === quiz.slug;

            return (
              <Card key={quiz._id} className="group bg-card/50 backdrop-blur-sm border-border/40 flex flex-col">
                <CardHeader className="pb-3 pt-4">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg leading-tight line-clamp-2">{quiz.title}</CardTitle>
                      <CardDescription className="text-xs mt-1 line-clamp-1">{quiz.keyword}</CardDescription>
                    </div>
                    <Brain className="h-5 w-5 text-primary shrink-0" />
                  </div>
                </CardHeader>
                <CardContent className="pb-3 pt-0 flex-1 flex flex-col">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" />
                        {quiz.viewCount}
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(quiz.createdAt)}
                      </div>
                      {quiz.isPublic && quiz.forkCount > 0 && (
                        <>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <GitFork className="h-3.5 w-3.5" />
                            {quiz.forkCount}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4">
                    <Badge variant="secondary" className="text-xs">
                      {quiz.format}
                    </Badge>
                    {quiz.isPublic !== undefined && (
                      <Badge 
                        variant={quiz.isPublic ? 'success' : 'secondary'} 
                        className="text-xs"
                      >
                        {quiz.isPublic ? (
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
                    <Link to={quizURL}>
                      <ExternalLink className="mr-2 h-3.5 w-3.5" />
                      Take Quiz
                    </Link>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShare(quiz)}
                    className="h-8 w-8 p-0"
                    title="Share quiz"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isDeleting}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        {isDeleting ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Delete Quiz
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{quiz.title}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(quiz.slug, quiz.title)}
                          className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <Button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            variant="outline"
            size="sm"
          >
            Previous
          </Button>

          <span className="px-4 py-2 text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>

          <Button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            variant="outline"
            size="sm"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};