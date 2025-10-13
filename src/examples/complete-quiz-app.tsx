// Complete Quiz Application Example
// This shows how to integrate all quiz components into a working app

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ServerProvider } from '@/providers/ServerProvider';
import { ServerStatus } from '@/components/ServerStatus';
import ErrorBoundary from '@/components/ErrorBoundary';

// Quiz Components
import { QuizNavigation } from '@/components/quiz/QuizNavigation';
import { QuizDashboard } from '@/components/quiz/QuizDashboard';
import { QuizCreator } from '@/components/quiz/QuizCreator';
import { QuizList } from '@/components/quiz/QuizList';
import { QuizViewer } from '@/components/quiz/QuizViewer';

// Mock user context - replace with your actual user management
const useUser = () => {
  return {
    user: {
      _id: '68d593ab8f080eae321d2b31',
      email: 'user@example.com',
      name: 'John Doe'
    },
    isAuthenticated: true,
    loading: false
  };
};

// Layout component
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <QuizNavigation />
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
      <ServerStatus />
    </div>
  );
};

// Protected route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useUser();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Main Quiz App Component
function CompleteQuizApp() {
  const { user } = useUser();

  return (
    <ErrorBoundary>
      <ServerProvider>
        <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            
            {/* Protected quiz routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout>
                  <QuizDashboard userId={user?._id || ''} />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/quizzes" element={
              <ProtectedRoute>
                <Layout>
                  <QuizList userId={user?._id || ''} />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/quiz/create" element={
              <ProtectedRoute>
                <Layout>
                  <QuizCreator userId={user?._id || ''} />
                </Layout>
              </ProtectedRoute>
            } />
            
            {/* Quiz viewing routes (can be public) */}
            <Route path="/quiz/:slug" element={
              <Layout>
                <QuizViewer />
              </Layout>
            } />
            
            <Route path="/quiz/id/:id" element={
              <Layout>
                <QuizViewer />
              </Layout>
            } />
            
            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </ServerProvider>
    </ErrorBoundary>
  );
}

// Simple login page component
const LoginPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Sign in to AiQuiz
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Create and manage AI-generated quizzes
          </p>
        </div>
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <p className="text-center text-gray-600">
            Login functionality would go here
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Continue to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompleteQuizApp;