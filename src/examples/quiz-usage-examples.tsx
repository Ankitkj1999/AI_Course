// Examples of how to use the Quiz components and services

import React, { useState } from 'react';
import { QuizService, QuizParser } from '@/services/quizService';
import { getQuizURL, getQuizShareURL } from '@/utils/config';
import type { Quiz, CreateQuizRequest } from '@/types/quiz';

// Example 1: Creating a quiz programmatically
export const CreateQuizExample: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const createSampleQuiz = async () => {
    setLoading(true);
    
    try {
      const quizData: CreateQuizRequest = {
        userId: '68d593ab8f080eae321d2b31',
        keyword: 'React Hooks',
        title: 'React Hooks Mastery Quiz',
        format: 'mixed',
        questionAndAnswers: [
          {
            role: 'assistant',
            question: 'What is your experience level with React?',
            possibleAnswers: ['Beginner', 'Intermediate', 'Advanced']
          },
          {
            role: 'user',
            answer: 'Intermediate'
          }
        ]
      };

      const response = await QuizService.createQuiz(quizData);
      setResult(response);
      
      if (response.success) {
        console.log('Quiz created:', response.quiz);
        // Navigate to quiz: getQuizURL(response.quiz)
      }
    } catch (error) {
      console.error('Failed to create quiz:', error);
      setResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Create Quiz Example</h3>
      
      <button
        onClick={createSampleQuiz}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Creating...' : 'Create Sample Quiz'}
      </button>

      {result && (
        <div className="mt-4 p-3 bg-gray-50 rounded">
          <pre className="text-sm overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

// Example 2: Parsing quiz content
export const ParseQuizExample: React.FC = () => {
  const sampleQuizContent = `# What is React?
- A database
-* A JavaScript library for building user interfaces
- A server framework
- A CSS framework
## React is a JavaScript library developed by Facebook for building user interfaces, particularly for web applications.

# Which hook is used for state management in functional components?
- useEffect
-* useState
- useContext
- useReducer
## useState is the primary hook for managing local state in functional components.`;

  const [parsed, setParsed] = useState<any>(null);

  const parseContent = () => {
    const result = QuizParser.parseQuizContent(sampleQuizContent);
    setParsed(result);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Parse Quiz Content Example</h3>
      
      <div className="mb-4">
        <h4 className="font-medium mb-2">Sample Quiz Content:</h4>
        <pre className="text-sm bg-gray-100 p-3 rounded overflow-auto">
          {sampleQuizContent}
        </pre>
      </div>

      <button
        onClick={parseContent}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Parse Content
      </button>

      {parsed && (
        <div className="mt-4">
          <h4 className="font-medium mb-2">Parsed Result:</h4>
          <div className="space-y-3">
            {parsed.questions.map((q: any, index: number) => (
              <div key={index} className="p-3 bg-gray-50 rounded">
                <h5 className="font-medium">{q.question}</h5>
                <ul className="mt-2 space-y-1">
                  {q.options.map((option: string, optIndex: number) => (
                    <li 
                      key={optIndex}
                      className={`text-sm ${optIndex === q.correctAnswer ? 'text-green-600 font-medium' : 'text-gray-600'}`}
                    >
                      {optIndex === q.correctAnswer ? '✓ ' : '• '}{option}
                    </li>
                  ))}
                </ul>
                {q.explanation && (
                  <p className="mt-2 text-sm text-gray-700 italic">{q.explanation}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Example 3: Quiz statistics
export const QuizStatsExample: React.FC = () => {
  const [userAnswers, setUserAnswers] = useState<number[]>([1, 0, 2, 1, 0]);
  const correctAnswers = [1, 0, 1, 1, 2]; // Correct answers for the quiz
  
  const stats = QuizParser.generateQuizStats(userAnswers, correctAnswers);

  const updateAnswer = (questionIndex: number, answerIndex: number) => {
    const newAnswers = [...userAnswers];
    newAnswers[questionIndex] = answerIndex;
    setUserAnswers(newAnswers);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Quiz Statistics Example</h3>
      
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h4 className="font-medium mb-3">Simulate Quiz Answers:</h4>
          <div className="space-y-2">
            {userAnswers.map((answer, index) => (
              <div key={index} className="flex items-center space-x-2">
                <span className="text-sm">Q{index + 1}:</span>
                <select
                  value={answer}
                  onChange={(e) => updateAnswer(index, parseInt(e.target.value))}
                  className="text-sm border rounded px-2 py-1"
                >
                  <option value={0}>Option A</option>
                  <option value={1}>Option B</option>
                  <option value={2}>Option C</option>
                </select>
                <span className={`text-xs ${answer === correctAnswers[index] ? 'text-green-600' : 'text-red-600'}`}>
                  {answer === correctAnswers[index] ? '✓' : '✗'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-3">Quiz Statistics:</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Total Questions:</span>
              <span className="font-medium">{stats.totalQuestions}</span>
            </div>
            <div className="flex justify-between">
              <span>Correct Answers:</span>
              <span className="font-medium text-green-600">{stats.correctAnswers}</span>
            </div>
            <div className="flex justify-between">
              <span>Incorrect Answers:</span>
              <span className="font-medium text-red-600">{stats.incorrectAnswers}</span>
            </div>
            <div className="flex justify-between">
              <span>Percentage:</span>
              <span className="font-medium">{stats.percentage}%</span>
            </div>
            <div className="flex justify-between">
              <span>Grade:</span>
              <span className="font-medium">{stats.grade}</span>
            </div>
            <div className="flex justify-between">
              <span>Passed:</span>
              <span className={`font-medium ${stats.passed ? 'text-green-600' : 'text-red-600'}`}>
                {stats.passed ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Example 4: Quiz sharing
export const QuizSharingExample: React.FC = () => {
  const sampleQuiz: Quiz = {
    _id: '64f8a1b2c3d4e5f6g7h8i9j2',
    userId: '64f8a1b2c3d4e5f6g7h8i9j0',
    keyword: 'JavaScript',
    title: 'JavaScript Fundamentals Quiz',
    slug: 'javascript-fundamentals-quiz-1234567890',
    format: 'mixed',
    content: '',
    tokens: { prompt: 100, completion: 200, total: 300 },
    viewCount: 5,
    lastVisitedAt: new Date().toISOString(),
    questionAndAnswers: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const quizURL = getQuizURL(sampleQuiz);
  const shareURLs = getQuizShareURL(sampleQuiz);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Copied to clipboard!');
    });
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Quiz Sharing Example</h3>
      
      <div className="space-y-4">
        <div>
          <h4 className="font-medium mb-2">Quiz URL:</h4>
          <div className="flex items-center space-x-2">
            <code className="flex-1 p-2 bg-gray-100 rounded text-sm">{quizURL}</code>
            <button
              onClick={() => copyToClipboard(shareURLs.copy)}
              className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            >
              Copy
            </button>
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-2">Share on Social Media:</h4>
          <div className="flex space-x-2">
            <a
              href={shareURLs.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            >
              Facebook
            </a>
            <a
              href={shareURLs.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 bg-sky-500 text-white rounded text-sm hover:bg-sky-600"
            >
              Twitter
            </a>
            <a
              href={shareURLs.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 bg-blue-700 text-white rounded text-sm hover:bg-blue-800"
            >
              LinkedIn
            </a>
            <a
              href={shareURLs.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
            >
              WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

// Combined examples component
export const QuizUsageExamples: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold text-center mb-8">Quiz Feature Examples</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <CreateQuizExample />
        <ParseQuizExample />
        <QuizStatsExample />
        <QuizSharingExample />
      </div>
    </div>
  );
};