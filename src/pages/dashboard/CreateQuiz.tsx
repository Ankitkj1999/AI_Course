import React from 'react';
import { QuizCreator } from '@/components/quiz/QuizCreator';

const DashboardCreateQuizPage: React.FC = () => {
  // Get user ID from session storage (matching your existing pattern)
  const userId = localStorage.getItem('uid') || '';

  if (!userId) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Please log in to create a quiz.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <QuizCreator userId={userId} />
    </div>
  );
};

export default DashboardCreateQuizPage;