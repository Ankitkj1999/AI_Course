import React from 'react';
import { QuizViewer } from '@/components/quiz/QuizViewer';

const QuizViewerPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <QuizViewer />
    </div>
  );
};

export default QuizViewerPage;