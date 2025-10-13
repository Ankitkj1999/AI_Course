// Example router configuration with quiz routes

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QuizCreator } from '@/components/quiz/QuizCreator';
import { QuizList } from '@/components/quiz/QuizList';
import { QuizViewer } from '@/components/quiz/QuizViewer';

// Mock user ID - replace with actual user context
const MOCK_USER_ID = '68d593ab8f080eae321d2b31';

function QuizRouter() {
  return (
    <Router>
      <Routes>
        {/* Quiz Management Routes */}
        <Route path="/quizzes" element={<QuizList userId={MOCK_USER_ID} />} />
        <Route path="/quiz/create" element={<QuizCreator userId={MOCK_USER_ID} />} />
        
        {/* Quiz View Routes */}
        <Route path="/quiz/:slug" element={<QuizViewer />} />
        <Route path="/quiz/id/:id" element={<QuizViewer />} />
        
        {/* Other routes */}
        <Route path="/" element={<QuizList userId={MOCK_USER_ID} />} />
      </Routes>
    </Router>
  );
}

export default QuizRouter;