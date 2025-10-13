import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { QuizService } from '@/services/quizService';
import { getQuizURL, getQuizShareURL } from '@/utils/config';
import { InlineLoader } from '@/components/ui/loading';
import { useToast } from '@/hooks/use-toast';
import { 
  Brain, 
  Calendar, 
  Eye, 
  Share2, 
  Trash2, 
  Plus,
  Clock,
  BarChart3
} from 'lucide-react';
import type { Quiz } from '@/types/quiz';

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

  useEffect(() => {
    fetchQuizzes();
  }, [currentPage]);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const response = await QuizService.getUserQuizzes(userId, currentPage, 9);
      
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

  const handleDelete = async (quiz: Quiz) => {
    if (!confirm(`Are you sure you want to delete "${quiz.title}"?`)) {
      return;
    }

    setDeletingQuiz(quiz.slug);
    
    try {
      const response = await QuizService.deleteQuiz(quiz.slug, userId);
      
      if (response.success) {
        // Remove quiz from list
        setQuizzes(prev => prev.filter(q => q.slug !== quiz.slug));
        toast({
          title: "Quiz Deleted",
          description: `"${quiz.title}" has been deleted successfully.`,
        });
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return <InlineLoader message="Loading your quizzes..." />;
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <button 
          onClick={fetchQuizzes}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Quizzes</h1>
          <p className="text-gray-600">Manage your AI-generated quizzes</p>
        </div>
        <Link
          to="/dashboard/create-quiz"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Quiz
        </Link>
      </div>

      {/* Quiz Grid */}
      {quizzes.length === 0 ? (
        <div className="text-center py-12">
          <Brain className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No quizzes yet</h3>
          <p className="text-gray-600 mb-6">Create your first AI-generated quiz to get started</p>
          <Link
            to="/dashboard/create-quiz"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Your First Quiz
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => {
            const quizURL = getQuizURL(quiz);
            const isDeleting = deletingQuiz === quiz.slug;
            
            return (
              <div key={quiz._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                {/* Quiz Header */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-2">
                        {quiz.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">
                        Topic: {quiz.keyword}
                      </p>
                    </div>
                    <Brain className="h-8 w-8 text-blue-600 flex-shrink-0" />
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Eye className="h-4 w-4 mr-2" />
                      {quiz.viewCount} views
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      {quiz.format}
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="space-y-1 mb-4">
                    <div className="flex items-center text-xs text-gray-500">
                      <Calendar className="h-3 w-3 mr-2" />
                      Created: {formatDate(quiz.createdAt)}
                    </div>
                    <div className="flex items-center text-xs text-gray-500">
                      <Clock className="h-3 w-3 mr-2" />
                      Last viewed: {formatDate(quiz.lastVisitedAt)}
                    </div>
                  </div>

                  {/* URL Display */}
                  <div className="text-xs text-gray-400 mb-4 font-mono bg-gray-50 p-2 rounded">
                    {quiz.slug ? (
                      <span className="text-green-600">✓ SEO: {quizURL}</span>
                    ) : (
                      <span className="text-orange-600">⚠ ID: {quizURL}</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <Link
                      to={quizURL}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                    >
                      Take Quiz
                    </Link>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleShare(quiz)}
                        className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
                        title="Share quiz"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => handleDelete(quiz)}
                        disabled={isDeleting}
                        className="p-2 text-red-600 hover:text-red-800 transition-colors disabled:opacity-50"
                        title="Delete quiz"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          <span className="px-4 py-2 text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};