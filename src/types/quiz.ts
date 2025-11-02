export interface Quiz {
  _id: string;
  userId: string;
  keyword: string;
  title: string;
  slug: string;
  format: 'mixed' | 'multiple-choice' | 'open-ended';
  content: string;
  tokens: {
    prompt: number;
    completion: number;
    total: number;
  };
  viewCount: number;
  lastVisitedAt: string;
  questionAndAnswers: QuestionAnswer[];
  createdAt: string;
  updatedAt: string;
}

export interface QuestionAnswer {
  role: 'assistant' | 'user';
  question?: string;
  answer?: string;
  possibleAnswers?: string[];
}

export interface QuizListResponse {
  success: boolean;
  data: Quiz[];
  totalCount: number;
  totalPages: number;
  currPage: number;
  perPage: number;
}

export interface QuizResponse {
  success: boolean;
  quiz: Quiz;
  redirect?: string;
}

export interface CreateQuizRequest {
  userId: string;
  keyword: string;
  title: string;
  format?: string;
  provider?: string;
  model?: string;
  questionAndAnswers?: QuestionAnswer[];
}

export interface CreateQuizResponse {
  success: boolean;
  message: string;
  quiz: {
    _id: string;
    slug: string;
    title: string;
    keyword: string;
  };
}

// Parsed quiz question structure
export interface ParsedQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface ParsedQuiz {
  questions: ParsedQuestion[];
  totalQuestions: number;
}