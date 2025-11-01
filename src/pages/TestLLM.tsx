import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Send, 
  Loader2, 
  Copy, 
  RefreshCw, 
  Clock, 
  Zap, 
  CheckCircle,
  AlertCircle,
  Settings
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import ProviderSelector from '@/components/ProviderSelector';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface GenerationResult {
  success: boolean;
  data?: {
    content: string;
    provider: string;
    providerName: string;
    model: string;
    responseTime: number;
    metadata: {
      promptLength: number;
      responseLength: number;
      temperature: number;
    };
  };
  error?: {
    message: string;
    code: string;
    details?: unknown;
  };
  timestamp: string;
}

const TestLLM: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [temperature, setTemperature] = useState([0.7]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<GenerationResult[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const responseRef = useRef<HTMLDivElement>(null);

  // Sample prompts for quick testing
  const samplePrompts = [
    "Explain quantum computing in simple terms.",
    "Write a creative short story about a robot learning to paint.",
    "What are the benefits of renewable energy?",
    "Describe the process of photosynthesis.",
    "Give me 5 tips for better time management."
  ];

  useEffect(() => {
    // Scroll to latest result when new result is added
    if (responseRef.current && results.length > 0) {
      responseRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [results]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a prompt",
        variant: "destructive"
      });
      return;
    }

    if (!selectedProvider) {
      toast({
        title: "Error", 
        description: "Please select a provider",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: "Authentication Required",
          description: "Please log in to use the LLM test screen",
          variant: "destructive"
        });
        return;
      }

      const response = await fetch('/api/llm/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          provider: selectedProvider,
          model: selectedModel,
          temperature: temperature[0]
        })
      });

      const result: GenerationResult = await response.json();
      
      setResults(prev => [result, ...prev]);

      if (result.success) {
        toast({
          title: "Success!",
          description: `Generated response using ${result.data?.providerName} in ${result.data?.responseTime}ms`
        });
      } else {
        toast({
          title: "Generation Failed",
          description: result.error?.message || "Unknown error occurred",
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('Generation error:', error);
      toast({
        title: "Network Error",
        description: "Failed to connect to the server",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyResponse = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied!",
      description: "Response copied to clipboard"
    });
  };

  const handleUseSamplePrompt = (samplePrompt: string) => {
    setPrompt(samplePrompt);
  };

  const clearResults = () => {
    setResults([]);
    toast({
      title: "Cleared",
      description: "All results have been cleared"
    });
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">LLM Test Screen</h1>
        <p className="text-gray-600">
          Test and compare different LLM providers with real-time responses and performance metrics.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Input and Controls */}
        <div className="lg:col-span-1 space-y-6">
          {/* Provider Selection */}
          <ProviderSelector
            selectedProvider={selectedProvider}
            selectedModel={selectedModel}
            onProviderChange={setSelectedProvider}
            onModelChange={setSelectedModel}
            showHealthStatus={true}
            showModelSelector={true}
          />

          {/* Prompt Input */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Send className="w-5 h-5" />
                <span>Prompt</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Enter your prompt here..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={6}
                className="resize-none"
              />
              
              {/* Sample Prompts */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Quick Start:</p>
                <div className="flex flex-wrap gap-2">
                  {samplePrompts.map((sample, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => handleUseSamplePrompt(sample)}
                      className="text-xs"
                    >
                      {sample.substring(0, 30)}...
                    </Button>
                  ))}
                </div>
              </div>

              {/* Advanced Settings */}
              <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full">
                    <Settings className="w-4 h-4 mr-2" />
                    Advanced Settings
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Temperature: {temperature[0]}
                    </label>
                    <Slider
                      value={temperature}
                      onValueChange={setTemperature}
                      max={1}
                      min={0}
                      step={0.1}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500">
                      Higher values make output more creative, lower values more focused
                    </p>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                disabled={loading || !prompt.trim() || !selectedProvider}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Generate Response
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Results */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Results</h2>
            {results.length > 0 && (
              <Button variant="outline" size="sm" onClick={clearResults}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Clear All
              </Button>
            )}
          </div>

          {results.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="text-gray-400 mb-4">
                  <Zap className="w-12 h-12 mx-auto mb-2" />
                  <p>No results yet</p>
                  <p className="text-sm">Generate your first response to see results here</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4" ref={responseRef}>
              {results.map((result, index) => (
                <Card key={index} className={result.success ? 'border-green-200' : 'border-red-200'}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {result.success ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-red-500" />
                        )}
                        <span className="font-medium">
                          {result.success ? result.data?.providerName : 'Generation Failed'}
                        </span>
                        {result.success && (
                          <Badge variant="secondary">
                            {result.data?.model}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Clock className="w-4 h-4" />
                        <span>{formatTimestamp(result.timestamp)}</span>
                      </div>
                    </div>
                    
                    {result.success && result.data && (
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>⚡ {result.data.responseTime}ms</span>
                        <span>📝 {result.data.metadata.responseLength} chars</span>
                        <span>🌡️ {result.data.metadata.temperature}</span>
                      </div>
                    )}
                  </CardHeader>
                  
                  <CardContent>
                    {result.success ? (
                      <div className="space-y-3">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <pre className="whitespace-pre-wrap text-sm font-mono">
                            {result.data?.content}
                          </pre>
                        </div>
                        <div className="flex justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopyResponse(result.data?.content || '')}
                          >
                            <Copy className="w-4 h-4 mr-2" />
                            Copy Response
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Error:</strong> {result.error?.message}
                          {result.error?.code && (
                            <span className="block text-sm mt-1">
                              Code: {result.error.code}
                            </span>
                          )}
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestLLM;