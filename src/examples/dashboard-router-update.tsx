// Example of how to add quiz routes to your existing dashboard router
// This shows the routes you need to add to your main router configuration

import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Import your existing dashboard pages
// import DashboardHome from '@/pages/dashboard/Home';
// import DashboardProfile from '@/pages/dashboard/Profile';
// import DashboardPricing from '@/pages/dashboard/Pricing';
// import GenerateCourse from '@/pages/dashboard/GenerateCourse';

// Import the new quiz pages
import DashboardQuizPage from '@/pages/dashboard/QuizDashboard';
import DashboardQuizListPage from '@/pages/dashboard/QuizList';
import DashboardCreateQuizPage from '@/pages/dashboard/CreateQuiz';
import QuizViewerPage from '@/pages/QuizViewer';

// Example of your dashboard routes with quiz routes added
export const DashboardRoutesExample = () => {
  return (
    <Routes>
      {/* Existing dashboard routes */}
      {/* <Route path="/dashboard" element={<DashboardHome />} />
      <Route path="/dashboard/profile" element={<DashboardProfile />} />
      <Route path="/dashboard/pricing" element={<DashboardPricing />} />
      <Route path="/dashboard/generate-course" element={<GenerateCourse />} /> */}
      
      {/* New quiz routes */}
      <Route path="/dashboard/quizzes" element={<DashboardQuizListPage />} />
      <Route path="/dashboard/create-quiz" element={<DashboardCreateQuizPage />} />
      
      {/* Public quiz viewing routes */}
      <Route path="/quiz/:slug" element={<QuizViewerPage />} />
      <Route path="/quiz/id/:id" element={<QuizViewerPage />} />
    </Routes>
  );
};

// Instructions for integration:
// 1. Add the quiz routes to your existing router
// 2. Import the quiz page components
// 3. The sidebar navigation is already updated in DashboardLayout.tsx
// 4. Users can now access:
//    - /dashboard/quizzes (view all quizzes)
//    - /dashboard/create-quiz (create new quiz)
//    - /quiz/[slug] (take a quiz)

export default DashboardRoutesExample;