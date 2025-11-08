import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Eye,
  Calendar,
  Loader2,
  BookOpen,
  HelpCircle,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { guideService } from '@/services/guideService';
import { Guide } from '@/types/guide';
import ReactMarkdown from 'react-markdown';
import { CodeBlock } from '@/components/CodeBlock';
import { formatCodeBlocks } from '@/utils/contentHandler';

const GuideViewer: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [guide, setGuide] = useState<Guide | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<string>('');

  // Process markdown content to handle escaped characters and format code blocks
  const processMarkdownContent = (content: string): string => {
    if (!content) return '';

    // If content looks like escaped JSON, try to unescape it
    try {
      // Handle common escape sequences
      let processed = content
        .replace(/\\n/g, '\n')           // Convert \\n to actual newlines
        .replace(/\\"/g, '"')           // Convert \" to "
        .replace(/\\\\/g, '\\')         // Convert \\\\ to \\
        .replace(/\\t/g, '\t');         // Convert \\t to tabs

      // Format code blocks for better parsing
      processed = formatCodeBlocks(processed);

      return processed;
    } catch (error) {
      console.warn('Failed to process markdown content:', error);
      return content;
    }
  };

  const fetchGuide = async () => {
    if (!slug) return;

    try {
      setIsLoading(true);
      const response = await guideService.getGuideBySlug(slug);

      if (response.success) {
        setGuide(response.guide);
      } else {
        throw new Error('Guide not found');
      }
    } catch (error: any) {
      console.error('Error fetching guide:', error);
      toast({
        title: "Error",
        description: "Failed to load guide. Please try again.",
        variant: "destructive",
      });
      navigate('/dashboard/guides');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (slug) {
      fetchGuide();
    }
  }, [slug]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setActiveSection(sectionId);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!guide) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Guide not found
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {guide.title}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              {guide.keyword}
            </p>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {guide.viewCount} views
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {formatDate(guide.createdAt)}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-8 space-y-6">
            {/* Quick Navigation */}
            <Card className="bg-white dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="text-lg text-gray-900 dark:text-white">
                  Quick Navigation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => scrollToSection('content')}
                  className="w-full justify-start text-gray-600 dark:text-gray-300"
                >
                  <BookOpen className="mr-2 h-4 w-4" />
                  Main Content
                </Button>
                {guide.relatedTopics.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => scrollToSection('related-topics')}
                    className="w-full justify-start text-gray-600 dark:text-gray-300"
                  >
                    <ChevronRight className="mr-2 h-4 w-4" />
                    Related Topics
                  </Button>
                )}
                {guide.deepDiveTopics.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => scrollToSection('deep-dive')}
                    className="w-full justify-start text-gray-600 dark:text-gray-300"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Deep Dive
                  </Button>
                )}
                {guide.questions.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => scrollToSection('questions')}
                    className="w-full justify-start text-gray-600 dark:text-gray-300"
                  >
                    <HelpCircle className="mr-2 h-4 w-4" />
                    Study Questions
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Related Topics Preview */}
            {guide.relatedTopics.length > 0 && (
              <Card className="bg-white dark:bg-gray-800">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-900 dark:text-white">
                    Related Topics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {guide.relatedTopics.slice(0, 4).map((topic, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {topic}
                      </Badge>
                    ))}
                    {guide.relatedTopics.length > 4 && (
                      <Badge variant="outline" className="text-xs">
                        +{guide.relatedTopics.length - 4} more
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <div className="space-y-8">
            {/* Guide Content */}
            <Card id="content" className="bg-white dark:bg-gray-800">
              <CardContent className="p-8">
                <div className="prose prose-lg dark:prose-invert max-w-none">
                  <ReactMarkdown
                    components={{
                      code({ node, className, children, ...props }: any) {
                        // Check if this is inline code (no language class and single line)
                        const isInline = !className && !String(children).includes('\n');
                        
                        // For inline code, render simple styled span
                        if (isInline) {
                          return (
                            <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">
                              {String(children)}
                            </code>
                          );
                        }
                        
                        // Extract language from className (e.g., "language-javascript" -> "javascript")
                        const extractLanguage = (className: string): string => {
                          const match = /language-(\w+)/.exec(className || '');
                          return match ? match[1] : 'plaintext';
                        };
                        
                        const language = extractLanguage(className);
                        const code = String(children).replace(/\n$/, ''); // Remove trailing newline
                        
                        return (
                          <CodeBlock
                            code={code}
                            language={language as any}
                          />
                        );
                      },
                      pre({ children }) {
                        return <>{children}</>;
                      },
                    }}
                  >
                    {processMarkdownContent(guide.content)}
                  </ReactMarkdown>
                </div>
              </CardContent>
            </Card>

            {/* Related Topics */}
            {guide.relatedTopics.length > 0 && (
              <Card id="related-topics" className="bg-white dark:bg-gray-800">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white">
                    Related Topics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {guide.relatedTopics.map((topic, index) => (
                      <div
                        key={index}
                        className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                      >
                        <div className="flex items-center gap-2">
                          <ChevronRight className="h-4 w-4 text-primary" />
                          <span className="text-gray-900 dark:text-white font-medium">
                            {topic}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Deep Dive Topics */}
            {guide.deepDiveTopics.length > 0 && (
              <Card id="deep-dive" className="bg-white dark:bg-gray-800">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white">
                    Deep Dive Topics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {guide.deepDiveTopics.map((topic, index) => (
                      <div
                        key={index}
                        className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
                      >
                        <div className="flex items-center gap-2">
                          <ExternalLink className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          <span className="text-gray-900 dark:text-white font-medium">
                            {topic}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Study Questions */}
            {guide.questions.length > 0 && (
              <Card id="questions" className="bg-white dark:bg-gray-800">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white">
                    Study Questions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {guide.questions.map((question, index) => (
                      <div
                        key={index}
                        className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-6 h-6 bg-yellow-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </div>
                          <p className="text-gray-900 dark:text-white font-medium">
                            {question}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuideViewer;