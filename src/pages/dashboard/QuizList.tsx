import React from 'react';
import { QuizList } from '@/components/quiz/QuizList';

const DashboardQuizListPage: React.FC = () => {
  // Get user ID from session storage (matching your existing pattern)
  const userId = localStorage.getItem('uid') || '';

  if (!userId) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Please log in to view your quizzes.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <QuizList userId={userId} />
    </div>
  );
};

export default DashboardQuizListPage;