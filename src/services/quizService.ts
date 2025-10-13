import { apiGet, apiPost, apiDelete } from '@/utils/api';
import type { 
  Quiz, 
  QuizListResponse, 
  QuizResponse, 
  CreateQuizRequest, 
  CreateQuizResponse 
} from '@/types/quiz';

export class QuizService {
  // Create a new quiz
  static async createQuiz(data: CreateQuizRequest): Promise<CreateQuizResponse> {
    const response = await apiPost('/quiz/create', data);
    return response.json();
  }

  // Get user's quizzes with pagination
  static async getUserQuizzes(
    userId: string, 
    page: number = 1, 
    limit: number = 10
  ): Promise<QuizListResponse> {
    const response = await apiGet(`/quizzes?userId=${userId}&page=${page}&limit=${limit}`);
    return response.json();
  }

  // Get quiz by slug
  static async getQuizBySlug(slug: string): Promise<QuizResponse> {
    const response = await apiGet(`/quiz/${slug}`);
    return response.json();
  }

  // Get quiz by ID (legacy)
  static async getQuizById(id: string): Promise<QuizResponse> {
    const response = await apiGet(`/quiz/id/${id}`);
    return response.json();
  }

  // Delete quiz
  static async deleteQuiz(slug: string, userId: string): Promise<{ success: boolean; message: string }> {
    const response = await apiDelete(`/quiz/${slug}`, { userId });
    return response.json();
  }
}

// Quiz content parser utility
export class QuizParser {
  // Parse markdown quiz content into structured questions
  static parseQuizContent(content: string): {
    questions: Array<{
      question: string;
      options: string[];
      correctAnswer: number;
      explanation: string;
    }>;
    totalQuestions: number;
  } {
    const questions: Array<{
      question: string;
      options: string[];
      correctAnswer: number;
      explanation: string;
    }> = [];

    // Split content by questions (lines starting with #)
    const questionBlocks = content.split(/^# /gm).filter(block => block.trim());

    questionBlocks.forEach(block => {
      const lines = block.trim().split('\n');
      if (lines.length === 0) return;

      // Extract question (first line)
      const question = lines[0].trim();
      
      // Extract options and find correct answer
      const options: string[] = [];
      let correctAnswer = -1;
      let explanationStart = -1;

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (line.startsWith('##')) {
          explanationStart = i;
          break;
        }
        
        if (line.startsWith('-')) {
          const optionText = line.substring(1).trim();
          
          if (optionText.startsWith('*')) {
            // This is the correct answer
            correctAnswer = options.length;
            options.push(optionText.substring(1).trim());
          } else {
            options.push(optionText);
          }
        }
      }

      // Extract explanation
      let explanation = '';
      if (explanationStart !== -1) {
        explanation = lines
          .slice(explanationStart)
          .join('\n')
          .replace(/^##\s*/, '')
          .trim();
      }

      if (question && options.length > 0 && correctAnswer !== -1) {
        questions.push({
          question,
          options,
          correctAnswer,
          explanation
        });
      }
    });

    return {
      questions,
      totalQuestions: questions.length
    };
  }

  // Generate quiz statistics
  static generateQuizStats(userAnswers: number[], correctAnswers: number[]) {
    const totalQuestions = correctAnswers.length;
    const correctCount = userAnswers.reduce((count, answer, index) => {
      return answer === correctAnswers[index] ? count + 1 : count;
    }, 0);

    const percentage = Math.round((correctCount / totalQuestions) * 100);
    
    return {
      totalQuestions,
      correctAnswers: correctCount,
      incorrectAnswers: totalQuestions - correctCount,
      percentage,
      passed: percentage >= 70, // 70% passing grade
      grade: this.getGrade(percentage)
    };
  }

  private static getGrade(percentage: number): string {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  }
}