import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, BookOpen, Sparkles, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { guideService } from '@/services/guideService';
import { useNavigate } from 'react-router-dom';
import ProviderSelector from '@/components/ProviderSelector';
import { useProviderPreferences } from '@/hooks/useProviderPreferences';
import { useVisibilityPreference } from '@/hooks/useVisibilityPreference';
import { CreationVisibilityToggle } from '@/components/CreationVisibilityToggle';
import DocumentBasedCreation from '@/components/DocumentBasedCreation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const GuideCreator: React.FC = () => {
  const [keyword, setKeyword] = useState('');
  const [title, setTitle] = useState('');
  const [customization, setCustomization] = useState('');
  // Use provider preferences hook for guide generation
  const {
    selectedProvider,
    selectedModel,
    setSelectedProvider,
    setSelectedModel
  } = useProviderPreferences('guide');

  // Use visibility preference hook
  const { isPublic, setIsPublic } = useVisibilityPreference('guide', true);

  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!keyword.trim() || !title.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in both keyword and title fields.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const userId = localStorage.getItem('uid');
      if (!userId) {
        toast({
          title: "Authentication Error",
          description: "Please log in to create guides.",
          variant: "destructive",
        });
        return;
      }

      const response = await guideService.createGuide({
        userId,
        keyword: keyword.trim(),
        title: title.trim(),
        customization: customization.trim() || undefined,
        provider: selectedProvider,
        model: selectedModel,
        isPublic: isPublic
      });

      if (response.success) {
        toast({
          title: "Guide Created!",
          description: `Successfully created "${response.guide.title}" as ${isPublic ? 'public' : 'private'} content.`,
        });
        
        // Navigate to the guide viewer
        navigate(`/dashboard/guide/${response.slug}`);
      } else {
        throw new Error(response.message || 'Failed to create guide');
      }
    } catch (error: unknown) {
      console.error('Error creating guide:', error);

      const getErrorMessage = (error: unknown): string => {
        if (typeof error === 'object' && error !== null) {
          const err = error as { response?: { data?: { message?: string } }; message?: string };
          return err.response?.data?.message || err.message || "Failed to create guide. Please try again.";
        }
        return "Failed to create guide. Please try again.";
      };

      toast({
        title: "Creation Failed",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Create Study Guide
          </CardTitle>
          <CardDescription>
            Generate comprehensive study guides for any topic with AI assistance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="traditional" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="traditional">From Topic</TabsTrigger>
              <TabsTrigger value="document">From Document</TabsTrigger>
            </TabsList>
            
            <TabsContent value="traditional">
              <form onSubmit={handleSubmit} className="space-y-6">
            {/* Provider Selection */}
            <ProviderSelector
              selectedProvider={selectedProvider}
              selectedModel={selectedModel}
              onProviderChange={setSelectedProvider}
              onModelChange={setSelectedModel}
              showPerformanceIndicators={true}
              showCostInfo={true}
              className="mb-6"
            />
            <div className="space-y-2">
              <Label htmlFor="keyword">
                Topic/Keyword *
              </Label>
              <Input
                id="keyword"
                type="text"
                placeholder="e.g., React Hooks, Machine Learning, Python Functions"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-sm text-muted-foreground">
                The main topic you want to create a study guide about
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">
                Guide Title *
              </Label>
              <Input
                id="title"
                type="text"
                placeholder="e.g., Complete Guide to React Hooks"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-sm text-muted-foreground">
                A descriptive title for your study guide
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customization">
                Additional Requirements (Optional)
              </Label>
              <Textarea
                id="customization"
                placeholder="e.g., Focus on practical examples, include beginner-friendly explanations, cover advanced concepts..."
                value={customization}
                onChange={(e) => setCustomization(e.target.value)}
                disabled={isLoading}
                rows={3}
              />
              <p className="text-sm text-muted-foreground">
                Specify any particular focus, difficulty level, or special requirements
              </p>
            </div>

            {/* Visibility Toggle */}
            <CreationVisibilityToggle
              contentType="guide"
              isPublic={isPublic}
              onChange={setIsPublic}
            />

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-900 dark:text-blue-400 mb-1">
                    What you'll get:
                  </h4>
                  <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                    <li>• Comprehensive single-page study guide</li>
                    <li>• Practical examples and real-world applications</li>
                    <li>• Related topics for broader understanding</li>
                    <li>• Deep-dive suggestions for advanced learning</li>
                    <li>• Study questions to test your knowledge</li>
                  </ul>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading || !keyword.trim() || !title.trim()}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Guide...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Study Guide
                </>
              )}
            </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="document">
              <DocumentBasedCreation 
                onGenerateContent={async (contentType, source) => {
                  // Only handle guide generation on this page
                  if (contentType !== 'guide') {
                    toast({
                      title: "Wrong Content Type",
                      description: `Please use the Create ${contentType.charAt(0).toUpperCase() + contentType.slice(1)} page to generate ${contentType}s.`,
                      variant: "destructive",
                    });
                    return;
                  }

                  setIsLoading(true);

                  try {
                    const userId = localStorage.getItem('uid');
                    if (!userId) {
                      toast({
                        title: "Authentication Error",
                        description: "Please log in to create guides.",
                        variant: "destructive",
                      });
                      return;
                    }

                    const response = await guideService.createGuideFromDocument({
                      userId,
                      processingId: source.processingId,
                      text: source.text,
                      title: title || 'Guide from Document',
                      provider: selectedProvider,
                      model: selectedModel,
                      isPublic: isPublic
                    });

                    if (response.success) {
                      const guideTitle = response.guide?.title || title || 'Guide from Document';
                      toast({
                        title: "Guide Created!",
                        description: `Successfully created "${guideTitle}" from the document.`,
                      });
                      navigate(`/dashboard/guide/${response.slug}`);
                    } else {
                      throw new Error(response.message || 'Failed to create guide');
                    }
                  } catch (error: unknown) {
                    console.error('Error creating guide from document:', error);

                    const getErrorMessage = (error: unknown): string => {
                      if (typeof error === 'object' && error !== null) {
                        const err = error as { response?: { data?: { message?: string } }; message?: string };
                        return err.response?.data?.message || err.message || "Failed to create guide from document. Please try again.";
                      }
                      return "Failed to create guide from document. Please try again.";
                    };

                    toast({
                      title: "Creation Failed",
                      description: getErrorMessage(error),
                      variant: "destructive",
                    });
                  } finally {
                    setIsLoading(false);
                  }
                }}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default GuideCreator;