import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Brain, List, Plus, Home } from 'lucide-react';

interface QuizNavigationProps {
  className?: string;
}

export const QuizNavigation: React.FC<QuizNavigationProps> = ({ className = '' }) => {
  const location = useLocation();

  const navItems = [
    {
      path: '/',
      label: 'Home',
      icon: Home,
    },
    {
      path: '/quizzes',
      label: 'My Quizzes',
      icon: List,
    },
    {
      path: '/quiz/create',
      label: 'Create Quiz',
      icon: Plus,
    },
  ];

  return (
    <nav className={`bg-white shadow-sm border-b ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <Brain className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">AiQuiz</span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};