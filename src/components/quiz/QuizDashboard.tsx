import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { QuizService } from '@/services/quizService';
import { getQuizURL } from '@/utils/config';
import { 
  Brain, 
  Plus, 
  TrendingUp, 
  Clock, 
  Target,
  Eye,
  Calendar
} from 'lucide-react';
import type { Quiz } from '@/types/quiz';

interface QuizDashboardProps {
  userId: string;
}

export const QuizDashboard: React.FC<QuizDashboardProps> = ({ userId }) => {
  const [recentQuizzes, setRecentQuizzes] = useState<Quiz[]>([]);
  const [stats, setStats] = useState({
    totalQuizzes: 0,
    totalViews: 0,
    thisWeekQuizzes: 0,
    averageViews: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [userId]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch recent quizzes
      const response = await QuizService.getUserQuizzes(userId, 1, 5);
      
      if (response.success) {
        setRecentQuizzes(response.data);
        
        // Calculate stats
        const totalQuizzes = response.totalCount;
        const totalViews = response.data.reduce((sum, quiz) => sum + quiz.viewCount, 0);
        const averageViews = totalQuizzes > 0 ? Math.round(totalViews / totalQuizzes) : 0;
        
        // Calculate this week's quizzes
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const thisWeekQuizzes = response.data.filter(
          quiz => new Date(quiz.createdAt) > oneWeekAgo
        ).length;
        
        setStats({
          totalQuizzes,
          totalViews,
          thisWeekQuizzes,
          averageViews
        });
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Loading skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow-sm animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-card rounded-lg p-6 shadow-sm border border-border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2 text-foreground">Quiz Dashboard</h1>
            <p className="text-muted-foreground">Create and manage your AI-generated quizzes</p>
          </div>
          <Brain className="h-16 w-16 text-primary/20" />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Quizzes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalQuizzes}</p>
            </div>
            <Target className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Views</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalViews}</p>
            </div>
            <Eye className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">This Week</p>
              <p className="text-2xl font-bold text-gray-900">{stats.thisWeekQuizzes}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg. Views</p>
              <p className="text-2xl font-bold text-gray-900">{stats.averageViews}</p>
            </div>
            <Clock className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/quiz/create"
            className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors group"
          >
            <Plus className="h-8 w-8 text-gray-400 group-hover:text-blue-600 mr-3" />
            <div>
              <h3 className="font-medium text-gray-900 group-hover:text-blue-900">Create New Quiz</h3>
              <p className="text-sm text-gray-600">Generate a quiz with AI</p>
            </div>
          </Link>

          <Link
            to="/quizzes"
            className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors group"
          >
            <Brain className="h-8 w-8 text-gray-400 group-hover:text-green-600 mr-3" />
            <div>
              <h3 className="font-medium text-gray-900 group-hover:text-green-900">View All Quizzes</h3>
              <p className="text-sm text-gray-600">Manage your quizzes</p>
            </div>
          </Link>

          <div className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg opacity-50">
            <TrendingUp className="h-8 w-8 text-gray-400 mr-3" />
            <div>
              <h3 className="font-medium text-gray-900">Analytics</h3>
              <p className="text-sm text-gray-600">Coming soon</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Quizzes */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Quizzes</h2>
          <Link
            to="/quizzes"
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            View all
          </Link>
        </div>

        {recentQuizzes.length === 0 ? (
          <div className="text-center py-8">
            <Brain className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">No quizzes yet</p>
            <Link
              to="/quiz/create"
              className="inline-flex items-center mt-3 text-blue-600 hover:text-blue-800"
            >
              <Plus className="h-4 w-4 mr-1" />
              Create your first quiz
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentQuizzes.map((quiz) => {
              const quizURL = getQuizURL(quiz);
              
              return (
                <div key={quiz._id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <Link
                      to={quizURL}
                      className="font-medium text-gray-900 hover:text-blue-600"
                    >
                      {quiz.title}
                    </Link>
                    <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                      <span className="flex items-center">
                        <Target className="h-3 w-3 mr-1" />
                        {quiz.keyword}
                      </span>
                      <span className="flex items-center">
                        <Eye className="h-3 w-3 mr-1" />
                        {quiz.viewCount} views
                      </span>
                      <span className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(quiz.createdAt)}
                      </span>
                    </div>
                  </div>
                  <Link
                    to={quizURL}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                  >
                    Take Quiz
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};