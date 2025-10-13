import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QuizService } from '@/services/quizService';
import { getQuizURL } from '@/utils/config';
import { LoadingButton } from '@/components/ui/loading';
import { useToast } from '@/hooks/use-toast';
import { Brain, Sparkles } from 'lucide-react';

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
        format: formData.format
      });

      if (response.success) {
        toast({
          title: "Quiz Created!",
          description: `"${response.quiz.title}" has been created successfully.`,
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
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Brain className="h-12 w-12 text-blue-600 mr-3" />
            <Sparkles className="h-8 w-8 text-yellow-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create AI Quiz</h1>
          <p className="text-gray-600">Generate a comprehensive quiz on any topic using AI</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Topic/Keyword */}
          <div>
            <label htmlFor="keyword" className="block text-sm font-medium text-gray-700 mb-2">
              Topic/Keyword *
            </label>
            <input
              type="text"
              id="keyword"
              name="keyword"
              value={formData.keyword}
              onChange={handleInputChange}
              placeholder="e.g., JavaScript fundamentals, React hooks, Node.js..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Enter the main topic or keywords for your quiz
            </p>
          </div>

          {/* Quiz Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Quiz Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="e.g., JavaScript Fundamentals Quiz"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Give your quiz a descriptive title
            </p>
          </div>

          {/* Format */}
          <div>
            <label htmlFor="format" className="block text-sm font-medium text-gray-700 mb-2">
              Quiz Format
            </label>
            <select
              id="format"
              name="format"
              value={formData.format}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="mixed">Mixed Questions</option>
              <option value="multiple-choice">Multiple Choice Only</option>
              <option value="open-ended">Open-Ended Questions</option>
            </select>
            <p className="text-sm text-gray-500 mt-1">
              Choose the type of questions for your quiz
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <LoadingButton
            type="submit"
            loading={isCreating}
            disabled={!formData.keyword.trim() || !formData.title.trim()}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? 'Creating Quiz...' : 'Create Quiz with AI'}
          </LoadingButton>
        </form>

        {/* Info */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-sm font-medium text-blue-900 mb-2">What happens next?</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• AI will generate 15-20 comprehensive questions</li>
            <li>• Questions will include explanations for learning</li>
            <li>• Quiz will be saved with a shareable link</li>
            <li>• You can edit or delete the quiz anytime</li>
          </ul>
        </div>
      </div>
    </div>
  );
};