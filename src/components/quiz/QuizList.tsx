import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { QuizService } from '@/services/quizService';
import { getQuizURL, getQuizShareURL } from '@/utils/config';
import { InlineLoader } from '@/components/ui/loading';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Brain,
  Calendar,
  Eye,
  Share2,
  Trash2,
  Plus,
  Clock,
  BarChart3,
  Loader2,
  Globe,
  Lock,
  GitFork
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
    
    // Simple implementation - copy to clipboard
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

        // Refresh the list
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
    return <InlineLoader message="Loading your quizzes..." />;
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Quizzes</h1>
          <p className="text-gray-600 dark:text-gray-300">Manage your AI-generated quizzes</p>
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
        <div className="text-center py-12">
          <Brain className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No quizzes yet</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">Create your first AI-generated quiz to get started</p>
          <Button asChild>
            <Link to="/dashboard/create-quiz">
              <Plus className="w-5 h-5 mr-2" />
              Create Your First Quiz
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => {
            const quizURL = getQuizURL(quiz);
            const isDeleting = deletingQuiz === quiz.slug;

            return (
              <Card key={quiz._id} className="bg-white dark:bg-gray-800 hover:shadow-lg transition-shadow flex flex-col">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2">
                        {quiz.title}
                      </CardTitle>
                      <CardDescription className="text-gray-600 dark:text-gray-300 mt-1">
                        {quiz.keyword}
                      </CardDescription>
                    </div>
                    <div className="flex flex-col gap-2 ml-2">
                      <Badge variant="secondary">
                        {quiz.format}
                      </Badge>
                      {quiz.isPublic !== undefined && (
                        <Badge 
                          variant={quiz.isPublic ? 'default' : 'outline'} 
                          className={`text-xs px-2 py-1 ${quiz.isPublic ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'}`}
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
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {quiz.viewCount}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(quiz.createdAt)}
                      </div>
                      {quiz.isPublic && quiz.forkCount > 0 && (
                        <div className="flex items-center gap-1">
                          <GitFork className="h-4 w-4" />
                          {quiz.forkCount}
                        </div>
                      )}
                    </div>

                    <div className="text-xs text-gray-400 dark:text-gray-500 font-mono bg-gray-50 dark:bg-gray-700 p-2 rounded">
                      {quiz.slug ? (
                        <span className="text-green-600 dark:text-green-400">✓ SEO: {quizURL}</span>
                      ) : (
                        <span className="text-orange-600 dark:text-orange-400">⚠ ID: {quizURL}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 justify-between items-center">
                    <Button asChild variant="default" size="sm" className="flex-1">
                      <Link to={quizURL}>
                        Take Quiz
                      </Link>
                    </Button>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleShare(quiz)}
                        className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors"
                        title="Share quiz"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isDeleting}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                          >
                            {isDeleting ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-white dark:bg-gray-800">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-gray-900 dark:text-white">
                              Delete Quiz
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-gray-600 dark:text-gray-300">
                              Are you sure you want to delete "{quiz.title}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600">
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(quiz.slug, quiz.title)}
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

          <span className="px-4 py-2 text-sm text-gray-600">
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