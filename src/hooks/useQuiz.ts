import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { QuizService } from '@/services/quizService';
import type { Quiz } from '@/types/quiz';

interface UseQuizReturn {
  quiz: Quiz | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useQuiz = (): UseQuizReturn => {
  const params = useParams<{ slug?: string; id?: string }>();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuiz = async () => {
    setLoading(true);
    setError(null);

    try {
      const { slug, id } = params;
      
      if (!slug && !id) {
        throw new Error('No quiz identifier provided');
      }

      let response;
      
      if (slug) {
        response = await QuizService.getQuizBySlug(slug);
      } else if (id) {
        response = await QuizService.getQuizById(id);
      }

      if (response?.success) {
        setQuiz(response.quiz);
      } else {
        throw new Error(response?.message || 'Failed to fetch quiz');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Quiz fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    fetchQuiz();
  };

  useEffect(() => {
    fetchQuiz();
  }, [params.slug, params.id]);

  return {
    quiz,
    loading,
    error,
    refetch
  };
};