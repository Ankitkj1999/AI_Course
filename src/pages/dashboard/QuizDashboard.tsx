import React from 'react';
import { QuizDashboard } from '@/components/quiz/QuizDashboard';

const DashboardQuizPage: React.FC = () => {
  // Get user ID from session storage (matching your existing pattern)
  const userId = localStorage.getItem('uid') || '';

  if (!userId) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Please log in to view your quizzes.</p>
      </div>
    );
  }

  return <QuizDashboard userId={userId} />;
};

export default DashboardQuizPage;