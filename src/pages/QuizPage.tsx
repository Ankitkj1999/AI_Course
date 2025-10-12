
import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ChevronLeft, ChevronRight, Brain, Medal, Clock, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import axios from 'axios';
import { serverURL } from '@/constants';


enum QuizState {
    NotStarted,
    InProgress,
    Completed
}

const QuizPage = () => {

    const [quizState, setQuizState] = useState<QuizState>(QuizState.NotStarted);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [timeRemaining, setTimeRemaining] = useState(0); // 5 minutes in seconds
    const [timerActive, setTimerActive] = useState(false);
    const { toast } = useToast();

    const { state } = useLocation();
    const { topic, courseId, questions } = state;
    const [quizQuestions, setExamJSON] = useState([]);
    const [passedQuiz, setPassed] = useState(false);

    useEffect(() => {

        init();

    }, []);

    const setQuizResult = () => {
        const half = quizQuestions.length;
        const scor = getScore();
        if (scor > half) {
            setPassed(true);
            updateResult(scor);
        } else {
            setPassed(false);
        }
    }

    async function updateResult(correct) {
        const marks = correct * 10;
        const marksString = "" + marks;
        await axios.post(serverURL + '/api/updateresult', { courseId, marksString });
    }


    function init() {
        const topLevelKeys = Object.keys(questions)
        const quizQuestions = questions[topLevelKeys[0]].map((item, index) => {
            return {
                id: index + 1,
                question: item.question,
                options: item.options.map((option, i) => {
                    return {
                        id: String.fromCharCode(97 + i), // Convert index to 'a', 'b', 'c', 'd'
                        text: option
                    };
                }),
                correctAnswer: item.answer.toLowerCase()
            };
        });
        setExamJSON(quizQuestions);
    }

    // Calculate quiz progress
    const progress = quizState === QuizState.InProgress
        ? ((currentQuestionIndex + 1) / quizQuestions.length) * 100
        : 0;

    useEffect(() => {
        // Simulate loading delay
        const loadTimer = setTimeout(() => {
            setIsLoading(false);
        }, 1500);

        return () => clearTimeout(loadTimer);
    }, []);

    useEffect(() => {
        let timer: NodeJS.Timeout;

        if (timerActive && timeRemaining > 0) {
            timer = setInterval(() => {
                setTimeRemaining(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        setTimerActive(false);
                        setQuizState(QuizState.Completed);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => {
            if (timer) clearInterval(timer);
        };
    }, [timerActive, timeRemaining]);

    const handleStartQuiz = () => {
        setQuizState(QuizState.InProgress);
        setTimerActive(true);
        setAnswers({});
        setCurrentQuestionIndex(0);

        setTimeRemaining(60 * quizQuestions.length);

        toast({
            title: "Quiz started",
            description: "Good luck! You have" + quizQuestions.length + " minutes to complete the quiz.",
        });
    };

    const handleSelectAnswer = (questionId: number, optionId: string) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: optionId
        }));
    };

    const handleNextQuestion = () => {
        if (currentQuestionIndex < quizQuestions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            setQuizState(QuizState.Completed);
            setTimerActive(false);
            toast({
                title: "Quiz completed",
                description: "Your answers have been submitted. Check your results below.",
            });
            setQuizResult();
        }
    };

    const handlePrevQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    const getScore = () => {
        let correctCount = 0;
        quizQuestions.forEach(question => {
            if (answers[question.id] === question.correctAnswer) {
                correctCount++;
            }
        });
        return correctCount;
    };

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <header className="border-b border-border/40 py-4 px-6 bg-background/95 backdrop-blur-sm">
                <div className="max-w-5xl mx-auto w-full flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Button onClick={() => window.history.back()} variant="ghost" size="sm" asChild>
                            <span>
                                <ChevronLeft className="mr-1 h-4 w-4" />
                                Back to Course
                            </span>
                        </Button>
                    </div>

                    {quizState === QuizState.InProgress && (
                        <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>{formatTime(timeRemaining)}</span>
                        </div>
                    )}
                </div>
            </header>

            <main className="flex-1 py-8 px-4">
                <div className="max-w-3xl mx-auto">
                    {isLoading ? (
                        <div className="space-y-6 animate-pulse">
                            <Skeleton className="h-8 w-3/4 mb-8 mx-auto" />
                            <Card>
                                <CardHeader>
                                    <Skeleton className="h-7 w-full mb-2" />
                                    <Skeleton className="h-5 w-3/4" />
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {[1, 2, 3, 4].map((i) => (
                                            <div key={i} className="flex items-start gap-3">
                                                <Skeleton className="h-5 w-5 rounded-full mt-0.5" />
                                                <Skeleton className="h-6 w-full" />
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Skeleton className="h-10 w-full" />
                                </CardFooter>
                            </Card>
                        </div>
                    ) : (
                        <>
                            {quizState === QuizState.NotStarted && (
                                <Card className="text-center">
                                    <CardHeader>
                                        <CardTitle className="text-2xl capitalize">{topic} Quiz</CardTitle>
                                        <CardDescription>Test your knowledge of {topic} concepts</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex justify-center mb-4">
                                            <Brain className="h-24 w-24 text-primary/80" />
                                        </div>
                                        <div className="space-y-2 text-left">
                                            <div className="flex items-center gap-2">
                                                <Medal className="h-5 w-5 text-muted-foreground" />
                                                <span>{quizQuestions.length} questions to test your understanding</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-5 w-5 text-muted-foreground" />
                                                <span>{quizQuestions.length} minutes to complete the quiz</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Trophy className="h-5 w-5 text-muted-foreground" />
                                                <span>Instant feedback on your answers</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="flex justify-center">
                                        <Button size="lg" onClick={handleStartQuiz}>
                                            Start Quiz
                                        </Button>
                                    </CardFooter>
                                </Card>
                            )}

                            {quizState === QuizState.InProgress && (
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm text-muted-foreground">
                                            <span>Question {currentQuestionIndex + 1} of {quizQuestions.length}</span>
                                            <span>{formatTime(timeRemaining)} remaining</span>
                                        </div>
                                        <Progress value={progress} className="h-2" />
                                    </div>

                                    <Card>
                                        <CardHeader>
                                            <CardTitle>{quizQuestions[currentQuestionIndex].question}</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <RadioGroup
                                                value={answers[quizQuestions[currentQuestionIndex].id] || ""}
                                                onValueChange={(value) => handleSelectAnswer(quizQuestions[currentQuestionIndex].id, value)}
                                                className="space-y-3"
                                            >
                                                {quizQuestions[currentQuestionIndex].options.map((option) => (
                                                    <div key={option.id} className="flex items-start space-x-2">
                                                        <RadioGroupItem value={option.id} id={`option-${option.id}`} />
                                                        <Label
                                                            htmlFor={`option-${option.id}`}
                                                            className="cursor-pointer font-normal"
                                                        >
                                                            {option.text}
                                                        </Label>
                                                    </div>
                                                ))}
                                            </RadioGroup>
                                        </CardContent>
                                        <CardFooter className="flex justify-between">
                                            <Button
                                                variant="outline"
                                                onClick={handlePrevQuestion}
                                                disabled={currentQuestionIndex === 0}
                                            >
                                                <ChevronLeft className="mr-1 h-4 w-4" />
                                                Previous
                                            </Button>
                                            <Button
                                                onClick={handleNextQuestion}
                                                disabled={!answers[quizQuestions[currentQuestionIndex].id]}
                                            >
                                                {currentQuestionIndex === quizQuestions.length - 1 ? 'Finish' : 'Next'}
                                                {currentQuestionIndex < quizQuestions.length - 1 && (
                                                    <ChevronRight className="ml-1 h-4 w-4" />
                                                )}
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                </div>
                            )}

                            {quizState === QuizState.Completed && (
                                <div className="space-y-6">
                                    <Card className="text-center">
                                        <CardHeader>
                                            <CardTitle className="text-2xl">Quiz {passedQuiz ? "Passed" : "Failed"}</CardTitle>
                                            <CardDescription>
                                                You scored {getScore()} out of {quizQuestions.length}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex justify-center mb-6">
                                                <div className="relative w-32 h-32">
                                                    <svg className="w-32 h-32" viewBox="0 0 100 100">
                                                        <circle
                                                            cx="50" cy="50" r="45"
                                                            fill="none"
                                                            className="stroke-muted-foreground/20"
                                                            strokeWidth="10"
                                                        />
                                                        <circle
                                                            cx="50" cy="50" r="45"
                                                            fill="none"
                                                            className={cn(
                                                                "stroke-primary transition-all duration-1000 ease-in-out",
                                                                getScore() / quizQuestions.length < 0.5 && "stroke-destructive",
                                                                getScore() / quizQuestions.length >= 0.8 && "stroke-green-500"
                                                            )}
                                                            strokeWidth="10"
                                                            strokeDasharray="282.7"
                                                            strokeDashoffset={282.7 - (282.7 * getScore() / quizQuestions.length)}
                                                            transform="rotate(-90 50 50)"
                                                        />
                                                        <text
                                                            x="50" y="50"
                                                            dominantBaseline="middle"
                                                            textAnchor="middle"
                                                            className="fill-foreground text-xl font-bold"
                                                        >
                                                            {Math.round(getScore() / quizQuestions.length * 100)}%
                                                        </text>
                                                    </svg>
                                                </div>
                                            </div>

                                            <ScrollArea className="h-[300px] pr-4">
                                                <div className="space-y-6">
                                                    {quizQuestions.map((question, idx) => (
                                                        <div key={question.id} className="border border-border rounded-lg p-4">
                                                            <p className="font-medium mb-3">{idx + 1}. {question.question}</p>
                                                            <div className="space-y-2">
                                                                {question.options.map((option) => (
                                                                    <div
                                                                        key={option.id}
                                                                        className={cn(
                                                                            "p-2 rounded-md text-sm flex items-center",
                                                                            option.id === question.correctAnswer && "bg-green-500/10 border border-green-500/30",
                                                                            answers[question.id] === option.id && option.id !== question.correctAnswer && "bg-destructive/10 border border-destructive/30"
                                                                        )}
                                                                    >
                                                                        <div className="mr-2">
                                                                            {option.id === question.correctAnswer ? (
                                                                                <div className="h-5 w-5 rounded-full bg-green-500/20 flex items-center justify-center">
                                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
                                                                                        <polyline points="20 6 9 17 4 12"></polyline>
                                                                                    </svg>
                                                                                </div>
                                                                            ) : answers[question.id] === option.id ? (
                                                                                <div className="h-5 w-5 rounded-full bg-destructive/20 flex items-center justify-center">
                                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-destructive">
                                                                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                                                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                                                                    </svg>
                                                                                </div>
                                                                            ) : (
                                                                                <div className="h-5 w-5 rounded-full border border-muted-foreground/30"></div>
                                                                            )}
                                                                        </div>
                                                                        <span>{option.text}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </ScrollArea>
                                        </CardContent>
                                        <CardFooter className="flex justify-center gap-4">
                                            <Button onClick={()=> window.history.back()} variant="outline">
                                                Return to Course
                                            </Button>
                                            <Button onClick={handleStartQuiz}>
                                                Retake Quiz
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>
        </div>
    );
};

export default QuizPage;