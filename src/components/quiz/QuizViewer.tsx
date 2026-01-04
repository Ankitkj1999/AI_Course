import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QuizService, QuizParser } from '@/services/quizService';
import { getQuizShareURL } from '@/utils/config';
import { InlineLoader } from '@/components/ui/loading';
import { useToast } from '@/hooks/use-toast';
import { useAuthState } from '@/hooks/useAuthState';
import { usePendingFork } from '@/hooks/usePendingFork';
import { VisibilityToggle } from '@/components/VisibilityToggle';
import { ForkButton } from '@/components/ForkButton';
import { ContentAttribution } from '@/components/ContentAttribution';
import { 
  Share2, 
  CheckCircle, 
  XCircle, 
  RotateCcw,
  Trophy,
  Clock,
  Target
} from 'lucide-react';
import type { Quiz } from '@/types/quiz';

export const QuizViewer: React.FC = () => {
  const { slug, id } = useParams<{ slug?: string; id?: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userId, isAuthenticated } = useAuthState();
  
  // Handle pending fork operations after login
  usePendingFork();
  
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  
  // Quiz state
  const [parsedQuiz, setParsedQuiz] = useState<{
    questions: Array<{
      question: string;
      options: string[];
      correctAnswer: number;
      explanation: string;
    }>;
    totalQuestions: number;
  } | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);

  useEffect(() => {
    fetchQuiz();
  }, [slug, id]);

  useEffect(() => {
    if (quiz?.content) {
      const parsed = QuizParser.parseQuizContent(quiz.content);
      setParsedQuiz(parsed);
      setUserAnswers(new Array(parsed.questions.length).fill(-1));
    }
  }, [quiz]);

  const fetchQuiz = async () => {
    try {
      setLoading(true);
      setError(null);

      let response;
      if (slug) {
        response = await QuizService.getQuizBySlug(slug);
      } else if (id) {
        response = await QuizService.getQuizById(id);
      } else {
        throw new Error('No quiz identifier provided');
      }

      if (response.success) {
        setQuiz(response.quiz);
        
        // Check if current user is the owner
        setIsOwner(userId === response.quiz.userId);
        
        // Handle redirect for ID-based URLs
        if (response.redirect && !slug) {
          navigate(response.redirect, { replace: true });
        }
      } else {
        setError('Quiz not found');
      }
    } catch (err) {
      setError('Failed to load quiz');
      console.error('Quiz fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (answerIndex: number) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestion] = answerIndex;
    setUserAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < parsedQuiz.questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      // Quiz completed
      setShowResults(true);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleRestart = () => {
    setCurrentQuestion(0);
    setUserAnswers(new Array(parsedQuiz.questions.length).fill(-1));
    setShowResults(false);
    setQuizStarted(false);
  };

  const handleShare = () => {
    if (!quiz) return;
    
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

  const getQuizStats = () => {
    if (!parsedQuiz || !showResults) return null;
    
    const correctAnswers = parsedQuiz.questions.map((q) => q.correctAnswer);
    return QuizParser.generateQuizStats(userAnswers, correctAnswers);
  };

  if (loading) {
    return <InlineLoader message="Loading quiz..." />;
  }

  if (error || !quiz) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
        <p className="text-gray-600 mb-4">{error || 'Quiz not found'}</p>
      </div>
    );
  }

  if (!parsedQuiz) {
    return <InlineLoader message="Parsing quiz content..." />;
  }

  const stats = getQuizStats();
  const currentQ = parsedQuiz.questions[currentQuestion];

  if (!currentQ) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
        <p className="text-gray-600 mb-4">Unable to load quiz question. The quiz content may be malformed.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          {isOwner && quiz && (
            <VisibilityToggle
              contentType="quiz"
              slug={quiz.slug}
              isPublic={quiz.isPublic || false}
              onToggle={(newState) => {
                setQuiz(prev => prev ? { ...prev, isPublic: newState } : null);
              }}
            />
          )}
        </div>
        <div className="flex items-center gap-2">
          {quiz && quiz.isPublic && (
            <ForkButton
              contentType="quiz"
              slug={quiz.slug}
              isAuthenticated={isAuthenticated}
              isOwner={isOwner}
              onForkSuccess={(forkedContent) => {
                toast({
                  title: 'Quiz Forked!',
                  description: `Successfully forked "${forkedContent.title}"`,
                });
              }}
            />
          )}
          <button
            onClick={handleShare}
            className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-800"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </button>
        </div>
      </div>

      {/* Quiz Info */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <div className="mb-4">
          <ContentAttribution
            forkedFrom={quiz.forkedFrom}
            contentType="quiz"
          />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{quiz.title}</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-4">Topic: {quiz.keyword}</p>

        <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
          <span className="flex items-center">
            <Target className="w-4 h-4 mr-1" />
            {parsedQuiz.totalQuestions} questions
          </span>
          <span className="flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            ~{Math.ceil(parsedQuiz.totalQuestions * 1.5)} minutes
          </span>
        </div>
      </div>

      {!quizStarted ? (
        /* Quiz Start Screen */
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
          <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Ready to start?</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            This quiz contains {parsedQuiz.totalQuestions} questions about {quiz.keyword}.
            Take your time and read each question carefully.
          </p>
          <button
            onClick={() => setQuizStarted(true)}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Start Quiz
          </button>
        </div>
      ) : showResults ? (
        /* Results Screen */
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Quiz Complete!</h2>
            <p className="text-gray-600 dark:text-gray-300">Here are your results</p>
          </div>

          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.percentage}%</div>
                <div className="text-sm text-blue-800 dark:text-blue-300">Score</div>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.correctAnswers}</div>
                <div className="text-sm text-green-800 dark:text-green-300">Correct</div>
              </div>
              <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.incorrectAnswers}</div>
                <div className="text-sm text-red-800 dark:text-red-300">Incorrect</div>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.grade}</div>
                <div className="text-sm text-purple-800 dark:text-purple-300">Grade</div>
              </div>
            </div>
          )}

          {/* Question Review */}
          <div className="space-y-4 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Review Answers</h3>
            {parsedQuiz.questions.map((question, index: number) => {
              const userAnswer = userAnswers[index];
              const isCorrect = userAnswer === question.correctAnswer;

              return (
                <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    {isCorrect ? (
                      <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500 mt-1 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                        {index + 1}. {question.question}
                      </h4>
                      <div className="space-y-1 text-sm">
                        <p className="text-gray-600 dark:text-gray-300">
                          Your answer: <span className={isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                            {userAnswer >= 0 ? question.options[userAnswer] : 'No answer'}
                          </span>
                        </p>
                        {!isCorrect && (
                          <p className="text-gray-600 dark:text-gray-300">
                            Correct answer: <span className="text-green-600 dark:text-green-400">
                              {question.options[question.correctAnswer]}
                            </span>
                          </p>
                        )}
                        {question.explanation && (
                          <p className="text-gray-700 dark:text-gray-200 mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                            {question.explanation}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center">
            <button
              onClick={handleRestart}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Take Quiz Again
            </button>
          </div>
        </div>
      ) : (
        /* Quiz Question Screen */
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
          {/* Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300 mb-2">
              <span>Question {currentQuestion + 1} of {parsedQuiz.totalQuestions}</span>
              <span>{Math.round(((currentQuestion + 1) / parsedQuiz.totalQuestions) * 100)}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentQuestion + 1) / parsedQuiz.totalQuestions) * 100}%` }}
              />
            </div>
          </div>

          {/* Question */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              {currentQ.question}
            </h2>

            {/* Options */}
            <div className="space-y-3">
              {currentQ.options.map((option: string, index: number) => (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  className={`w-full text-left p-4 border-2 rounded-lg transition-colors ${
                    userAnswers[currentQuestion] === index
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                      userAnswers[currentQuestion] === index
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300 dark:border-gray-500'
                    }`}>
                      {userAnswers[currentQuestion] === index && (
                        <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5" />
                      )}
                    </div>
                    <span className="text-gray-900 dark:text-white">{option}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              className="px-4 py-2 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            <button
              onClick={handleNext}
              disabled={userAnswers[currentQuestion] === -1}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {currentQuestion === parsedQuiz.totalQuestions - 1 ? 'Finish Quiz' : 'Next'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};